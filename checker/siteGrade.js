import vm from "node:vm";
import { siteFix } from "../labs/siteFixes.js";

function categoryForDetail(detail) {
  const d = String(detail || "").toLowerCase();
  if (d.includes("real traffic must survive") || d.includes("blocking everything is not a fix")) return "broke_happy_path";
  return "other";
}

function runHarness(code, entry, harnessSource) {
  const context = vm.createContext(Object.create(null));
  const runner = `
    const code = ${JSON.stringify(String(code ?? ""))};
    const entry = ${JSON.stringify(String(entry ?? ""))};
    const harnessSource = ${JSON.stringify(String(harnessSource ?? ""))};
    const fn = new Function(code + "\\n; return typeof " + entry + " === 'function' ? " + entry + " : null;")();
    if (!fn) throw new Error("No function named '" + entry + "' was defined.");
    const harness = eval("(" + harnessSource + ")");
    harness(fn);
  `;
  return vm.runInContext(runner, context, { timeout: 3000 });
}

export function gradeSite({ labId, files }) {
  const fix = siteFix(labId);
  if (!fix) {
    return {
      done: true,
      passed: false,
      checks: [{ id: "run", nameHe: "הרצה", status: "failed", category: "other", feedbackHe: "מעבדה לא נמצאה" }],
    };
  }
  const file = (files || []).find((f) => f && f.path === fix.file);
  const code = file ? String(file.content ?? "") : "";
  let tests = null;
  let error = null;
  try {
    tests = runHarness(code, fix.entry, fix.harness);
  } catch (e) {
    error = String((e && e.message) || e);
  }
  if (error || !Array.isArray(tests)) {
    const msg = error || "שגיאת הרצה";
    return {
      done: true,
      passed: false,
      checks: [{ id: "run", nameHe: "הרצה", status: "failed", category: "other", feedbackHe: msg }],
    };
  }
  const checks = tests.map((t, i) => {
    const pass = !!(t && t.pass);
    const check = {
      id: "c" + (i + 1),
      nameHe: String((t && t.name) || ("case " + (i + 1))),
      status: pass ? "passed" : "failed",
    };
    if (!pass) {
      check.category = categoryForDetail(t && t.detail);
      check.feedbackHe = String((t && t.detail) || "");
    }
    return check;
  });
  const passed = checks.length > 0 && checks.every((c) => c.status === "passed");
  return { done: true, passed, checks };
}
