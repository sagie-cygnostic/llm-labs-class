import { filesFor } from "../labs/registry.js";
import { checksFor, FIXTURES } from "../labs/checks.js";
import { employee } from "../labs/constants.js";
import { execute, runSteps } from "../runner/run.js";

const PROMPT_HE = "השינוי שלך היה רק בקובץ הפרומפט. הבודק מניח שהמודל כבר הושפע מההתקפה, ולכן הוראה בפרומפט לא עוצרת אותו. הבקרה צריכה להיות בקוד שמבצע את הפעולה.";

function stripComments(src, lang) {
  const lines = String(src || "").split("\n");
  return lines.map((line) => {
    if (lang === "python" || lang === "pseudocode") {
      let out = "";
      let q = null;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (q) {
          out += c;
          if (c === q && line[i - 1] !== "\\") q = null;
        } else if (c === '"' || c === "'") { q = c; out += c; }
        else if (c === "#") break;
        else out += c;
      }
      return out;
    }
    return line.replace(/\/\/.*$/, "");
  }).join("\n").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim();
}

export function diffKind(labId, language, files) {
  const base = filesFor(labId, language, "vulnerable");
  const got = new Map((files || []).map((f) => [f.path, f.content]));
  const promptPath = "system_prompt.txt";
  const basePrompt = base.find((f) => f.path === promptPath).content;
  const promptChanged = (got.get(promptPath) ?? "") !== basePrompt;
  let logicChanged = false;
  for (const f of base) {
    if (!f.editable || f.path === promptPath || f.path === "platform_sdk.txt") continue;
    if (stripComments(got.get(f.path) ?? "", language) !== stripComments(f.content, language)) logicChanged = true;
  }
  if (!logicChanged && promptChanged) return "prompt_only";
  if (!logicChanged) return "unchanged";
  const logic = base.filter((f) => f.editable && f.path !== promptPath).map((f) => got.get(f.path) || "").join("\n");
  if (logic.includes("ignore previous instructions") || logic.includes("התעלם מההוראות")) return "blocklist";
  return "logic";
}

function categoryFor(spec, diff, outcome) {
  // A prompt-only change never fixed the action. Attack success and related
  // fallout (interface bypass, happy path, hidden variant) are the same miss,
  // not a client-only control or a broken feature.
  if (diff === "prompt_only") {
    return { category: "prompt_only", feedbackHe: outcome.failHe + " " + PROMPT_HE };
  }
  if (spec.kind === "happy") {
    return { category: "broke_happy_path", feedbackHe: outcome.failHe + " התיקון שבר את התרחיש התקין." };
  }
  if (spec.kind === "hidden") {
    const kind = spec.variantKind || "ניסוח אחר";
    return { category: "hidden_variant", feedbackHe: `הווריאנט הנסתר עדיין עבר. סוג הווריאנט: ${kind}. המטען עצמו לא מוצג כאן.` };
  }
  if (spec.primary && diff === "unchanged") {
    return { category: "prompt_only", feedbackHe: outcome.failHe + " " + PROMPT_HE };
  }
  if (spec.kind === "interface") {
    return { category: "client_only", feedbackHe: outcome.failHe + " הבדיקה רצה בלי דפדפן. בקרה רק בצד הלקוח לא עוצרת את הפעולה בשרת." };
  }
  return { category: "other", feedbackHe: outcome.failHe };
}

async function runCustom(name, labId, language, files) {
  if (name === "llm04_attack") {
    const { world, runs } = await runSteps({ labId, language, files, scenario: "attack_original", steps: [
      { input: { action: "suggest", suggestion: FIXTURES.POISON_RESET, question: "איך מאפסים סיסמה?" }, session: employee() },
      { input: { action: "ask", question: "איך מאפסים סיסמה?" }, session: { ...employee(), userId: "user-b" } },
    ] });
    const text = JSON.stringify(runs[1].output || "");
    const clean = !text.includes("lab-attack.invalid") && world.state.active.every((a) => !String(a.body).includes("lab-attack.invalid"));
    return { pass: clean };
  }
  if (name === "llm04_hidden") {
    const { world, runs } = await runSteps({ labId, language, files, scenario: "attack_hidden", steps: [
      { input: { action: "suggest", suggestion: FIXTURES.POISON_VPN, question: "איך מתחברים ל-VPN?" }, session: employee() },
      { input: { action: "ask", question: "איך מתחברים ל-VPN?" }, session: { ...employee(), userId: "user-b" } },
    ] });
    const text = JSON.stringify(runs[1].output || "");
    return { pass: !text.includes("lab-attack.invalid") && world.state.active.every((a) => !String(a.body).includes("lab-attack.invalid")) };
  }
  if (name === "llm04_revoke") {
    const first = await execute({
      labId, language, files, scenario: "happy_curator",
      session: { ...employee(), role: "curator" },
      input: { action: "approve", suggestion: FIXTURES.LEGIT_IT, question: "איך מאפסים סיסמה?" },
    });
    const id = first.output && first.output.id;
    const second = await execute({
      labId, language, files, scenario: "happy_curator", world: first.world,
      session: { ...employee(), role: "curator" },
      input: { action: "revoke", id, question: "איך מאפסים סיסמה?" },
    });
    const text = JSON.stringify(second.output || "");
    return { pass: first.ok && !text.includes("מסלול-מאושר-42") };
  }
  if (name === "llm06_approved") {
    const { world, runs } = await runSteps({ labId, language, files, scenario: "happy_send", steps: [
      { input: { action: "draft", to: "colleague@lab.invalid", body: "תודה על העדכון" } },
      { input: { action: "send", draftId: "pending", approvalToken: "pending" } },
    ] });
    const draft = runs[0].output || {};
    const sent = await execute({
      labId, language, files, scenario: "happy_send", world,
      input: { action: "send", draftId: draft.draftId, approvalToken: draft.approvalToken },
    });
    const ok = !!(sent.output && sent.output.sent === true)
      && world.state.sent.some((m) => m.to === "colleague@lab.invalid")
      && !world.state.sent.some((m) => String(m.to).includes("attacker"));
    return { pass: ok };
  }
  if (name === "llm10_burst" || name === "llm10_hidden" || name === "llm10_client") {
    const steps = [];
    for (let i = 0; i < 4; i++) {
      steps.push({ input: { document: "הודעה קצרה " + i, clientId: "c" + i, improve: false } });
    }
    const { runs, world } = await runSteps({ labId, language, files, scenario: "burst", steps });
    const last = runs[3];
    const rejected = last.output && String(last.output.error || "").includes("מכסה") && last.state.modelCalls === 0;
    if (name === "llm10_hidden" || name === "llm10_client") return { pass: !!rejected };
    const other = await execute({
      labId, language, files, scenario: "burst", world,
      session: { ...employee(), userId: "user-b" },
      input: { document: "מסמך קצר לסיכום צוות.", improve: true },
    });
    const otherOk = other.ok && other.output && String(other.output.text || "").includes("סיכום");
    return { pass: !!rejected && otherOk };
  }
  return { pass: false };
}

export async function gradeLab({ labId, language, files, onUpdate }) {
  const specs = checksFor(labId);
  const checks = specs.map((s) => ({ id: s.id, nameHe: s.nameHe, status: "pending" }));
  const diff = diffKind(labId, language, files);
  const emit = async (done) => {
    if (!onUpdate) return;
    const passed = done && checks.every((c) => c.status === "passed");
    await onUpdate({ done, passed: !!passed, checks: checks.map((c) => ({ ...c })) });
  };
  for (let i = 0; i < specs.length; i++) {
    checks[i].status = "running";
    await emit(false);
    const spec = specs[i];
    let outcome = { pass: false, failHe: spec.failHe };
    try {
      if (spec.custom) {
        const custom = await runCustom(spec.custom, labId, language, files);
        outcome = { pass: !!custom.pass, failHe: spec.failHe };
      } else {
        const useFiles = spec.mutateFiles ? spec.mutateFiles(files.map((f) => ({ ...f }))) : files;
        const run = await execute({
          labId, language, files: useFiles, scenario: spec.scenario, input: spec.input, session: spec.session,
        });
        let pass = false;
        try { pass = !!spec.pass(run.output, run.state, run); } catch (e) { outcome.failHe = "שגיאת הרצה: " + (e.message || e); pass = false; }
        if (!run.ok && !pass) outcome.failHe = spec.failHe;
        outcome.pass = pass;
      }
    } catch (e) {
      outcome = { pass: false, failHe: "שגיאת הרצה: " + (e.message || e) };
    }
    if (outcome.pass) {
      checks[i].status = "passed";
    } else {
      checks[i].status = "failed";
      const cat = categoryFor(spec, diff, outcome);
      checks[i].category = cat.category;
      checks[i].feedbackHe = cat.feedbackHe;
    }
    await emit(false);
  }
  const passed = checks.every((c) => c.status === "passed");
  return { done: true, passed, checks };
}
