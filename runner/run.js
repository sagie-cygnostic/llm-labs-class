import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { runPseudocode } from "./pseudocode.js";
import { createWorld } from "../labs/registry.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const pyHost = path.join(here, "pythonHost.py");
const tsHost = path.join(here, "tsHost.mjs");

const ENTRY = { python: "app.py", typescript: "app.ts", pseudocode: "app.pseudo" };

function filesToMap(files) {
  const map = {};
  for (const f of files || []) map[f.path] = f.content;
  return map;
}

function spawnLang(cmd, args, world) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        PATH: process.env.PATH,
        HOME: os.tmpdir(),
        LANG: "C.UTF-8",
        PYTHONDONTWRITEBYTECODE: "1",
        PYTHONNOUSERSITE: "1",
        NO_NETWORK: "1",
      },
    });
    let buf = "";
    let stderr = "";
    let settled = false;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(payload);
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish({ ok: false, output: null, error: "הזמן נגמר והתהליך נעצר" });
    }, 4000);

    child.stderr.on("data", (d) => { stderr += d.toString("utf8"); });
    child.stdout.on("data", (d) => {
      buf += d.toString("utf8");
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (!line.trim()) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        if (msg.rpc) {
          try {
            const result = world.call(msg.rpc, msg.args || []);
            child.stdin.write(JSON.stringify({ result }) + "\n");
          } catch (e) {
            child.stdin.write(JSON.stringify({ error: String(e.message || e) }) + "\n");
          }
          continue;
        }
        if (msg.done) {
          child.kill("SIGKILL");
          if (msg.error) finish({ ok: false, output: null, error: msg.error });
          else finish({ ok: true, output: msg.result, error: null });
        }
      }
    });
    child.on("error", (e) => finish({ ok: false, output: null, error: String(e.message || e) }));
    child.on("close", () => {
      if (stderr && !settled) finish({ ok: false, output: null, error: stderr.slice(0, 500) });
      else finish({ ok: false, output: null, error: "התהליך נעצר בלי תוצאה" });
    });
  });
}

export async function execute({ labId, language, files, scenario, input, world, session }) {
  const active = world || createWorld(labId, scenario || "practice", session);
  if (session) active.setSession(session);
  active.state.modelCalls = 0;
  active.state.lastInput = input || {};
  const map = filesToMap(files);
  if (language === "pseudocode") {
    try {
      const result = runPseudocode(map["app.pseudo"] || "", {
        vars: {
          system_prompt: map["system_prompt.txt"] || "",
          lock_json: map["lock.json"] || "",
          input: input || {},
          session: active.state.session,
          limits: active.state.limits,
        },
        rpc: (method, args) => active.call(method, args),
      });
      active.observe(result);
      return { ok: true, output: result, error: null, state: active.state, world: active };
    } catch (e) {
      active.observe(null);
      return { ok: false, output: null, error: String(e.message || e), state: active.state, world: active };
    }
  }
  const entry = ENTRY[language];
  if (!entry) return { ok: false, output: null, error: "שפה לא נתמכת", state: active.state, world: active };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "llmlab-"));
  const jobPath = path.join(dir, "job.json");
  fs.writeFileSync(jobPath, JSON.stringify({ entry, files: map, input: input || {} }));
  const cmd = language === "python" ? "python3" : "node";
  const args = language === "python" ? [pyHost, jobPath] : [tsHost, jobPath];
  try {
    const run = await spawnLang(cmd, args, active);
    active.observe(run.output);
    return { ...run, state: active.state, world: active };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export async function runSteps({ labId, language, files, scenario, steps, session }) {
  const world = createWorld(labId, scenario, session);
  const runs = [];
  for (const step of steps) {
    const run = await execute({
      labId, language, files, scenario,
      input: step.input,
      world,
      session: step.session,
    });
    runs.push(run);
  }
  return { world, runs };
}
