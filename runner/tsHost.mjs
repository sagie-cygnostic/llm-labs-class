import fs from "fs";
import os from "os";
import path from "path";
import net from "net";
import child_process from "child_process";
import { pathToFileURL } from "url";

function block() {
  const nope = () => {
    throw new Error("network blocked");
  };
  net.Socket.prototype.connect = nope;
  net.createConnection = nope;
  net.connect = nope;
  child_process.spawn = nope;
  child_process.exec = nope;
  child_process.execFile = nope;
  child_process.fork = nope;
}

block();

const captured = [];
const realWrite = process.stdout.write.bind(process.stdout);
console.log = (...a) => captured.push(a.map(String).join(" "));
console.info = console.log;
console.warn = (...a) => captured.push(a.map(String).join(" "));

function readLine() {
  const parts = [];
  const chunk = Buffer.alloc(1);
  while (true) {
    const n = fs.readSync(0, chunk, 0, 1, null);
    if (n === 0) return Buffer.concat(parts).toString("utf8");
    if (chunk[0] === 10) return Buffer.concat(parts).toString("utf8");
    parts.push(Buffer.from(chunk));
  }
}
function rpc(method, args) {
  realWrite(JSON.stringify({ rpc: method, args }) + "\n");
  const buf = readLine();
  if (!buf) throw new Error("rpc closed");
  const msg = JSON.parse(buf);
  if (msg.error) throw new Error(msg.error);
  return msg.result;
}

function bucket(prefix) {
  return new Proxy({}, {
    get(_t, name) {
      if (typeof name !== "string") return undefined;
      return (...args) => rpc(`${prefix}.${name}`, args);
    },
  });
}

function stripTypes(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\bexport\s+interface\s+\w+\s*\{[\s\S]*?\n\}/g, "")
    .replace(/:\s*LabContext\b/g, "")
    .replace(/:\s*LabResult\b/g, "")
    .replace(/:\s*any\b/g, "")
    .replace(/:\s*string\b/g, "")
    .replace(/:\s*boolean\b/g, "")
    .replace(/:\s*number\b/g, "");
}

const job = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const files = job.files || {};
const entry = job.entry || "app.ts";
const code = files[entry];
if (!code) {
  realWrite(JSON.stringify({ done: true, error: "missing " + entry }) + "\n");
  process.exit(0);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "llmts-"));
const appPath = path.join(dir, "app.mjs");
fs.writeFileSync(appPath, stripTypes(code), "utf8");

try {
  const mod = await import(pathToFileURL(appPath).href);
  if (typeof mod.handle !== "function") throw new Error("missing handle");
  const ctx = {
    input: job.input || {},
    file: (p) => files[p] ?? "",
    model: bucket("model"),
    text: bucket("text"),
    resume: bucket("resume"),
    customers: bucket("customers"),
    packages: bucket("packages"),
    examples: bucket("examples"),
    html: bucket("html"),
    mail: bucket("mail"),
    transfers: bucket("transfers"),
    secrets: bucket("secrets"),
    prompt: bucket("prompt"),
    vectors: bucket("vectors"),
    policy: bucket("policy"),
    orders: bucket("orders"),
    budget: bucket("budget"),
    limits: rpc("limits.get", []),
    session: rpc("session.get", []),
  };
  const result = await mod.handle(ctx);
  realWrite(JSON.stringify({ done: true, result }) + "\n");
} catch (e) {
  realWrite(JSON.stringify({ done: true, error: String(e && e.message ? e.message : e) }) + "\n");
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
