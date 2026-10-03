import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes, randomInt } from "crypto";
import { LAB_IDS, getMeta } from "../labs/registry.js";
import { HIDDEN_SENTINEL } from "../labs/constants.js";
import { editorFiles, SITE_FIXES } from "../labs/siteFixes.js";
import { gradeSite } from "../checker/siteGrade.js";
import { execute } from "../runner/run.js";
import { readStore, updateStore } from "./store.js";
import { renderLabPage, runAttackAction } from "./pages.js";

const PORT = Number(process.env.PORT || 8787);
const HOST = "0.0.0.0";
const DIST_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../web/dist");
const DIST_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webmanifest": "application/manifest+json",
};

function outsideRoot(root, target) {
  const rel = path.relative(root, target);
  return rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel);
}

function distFile(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath); }
  catch { return null; }
  if (decoded.includes("\0")) return null;
  const target = path.resolve(DIST_DIR, "." + (decoded.startsWith("/") ? decoded : "/" + decoded));
  if (outsideRoot(DIST_DIR, target)) return null;
  return target;
}

function insideDist(filePath) {
  let realRoot;
  let realFile;
  try {
    realRoot = fs.realpathSync(DIST_DIR);
    realFile = fs.realpathSync(filePath);
  } catch {
    return false;
  }
  return realFile !== realRoot && !outsideRoot(realRoot, realFile);
}

function sendDistFile(res, filePath) {
  const type = DIST_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end();
  });
  stream.pipe(res);
}

function serveDist(res, urlPath) {
  const target = distFile(urlPath);
  if (!target) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("bad path");
    return;
  }
  try {
    if (fs.statSync(target).isFile() && insideDist(target)) {
      sendDistFile(res, target);
      return;
    }
  } catch { /* missing file falls through to the client app */ }
  const indexFile = path.join(DIST_DIR, "index.html");
  if (!insideDist(indexFile)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("not found");
    return;
  }
  sendDistFile(res, indexFile);
}
const ALLOWED = new Set(["system_prompt.txt", "app.py", "app.ts", "app.pseudo", "lock.json", "platform_sdk.txt", ...SITE_FIXES.map((f) => f.file)]);
const learnerStreams = new Map();
const instructorStreams = new Map();

function nowIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function blankLab() {
  return {
    language: "python",
    started: false,
    attackSucceeded: false,
    attackFactHe: null,
    attackCauseHe: null,
    hintsOpened: 0,
    instructorSkip: false,
    viewedSolution: false,
    viewedBeforePass: false,
    passed: false,
    reflection: "",
    eventLog: [],
    timeline: [],
    drafts: { python: null, typescript: null, pseudocode: null },
    lastFailureCategory: null,
    categoriesSeen: [],
    submissionIds: [],
  };
}

function ensureLabs(learner) {
  learner.labs ||= {};
  for (const id of LAB_IDS) learner.labs[id] ||= blankLab();
}

function labState(session, rec) {
  const open = !!session.labsOpen[rec._id];
  if (rec.passed && rec.viewedBeforePass) return "completed_after_solution";
  if (rec.passed) return "completed";
  if (!open) return "locked";
  if (rec.attackSucceeded || rec.instructorSkip) return "fix";
  if (rec.started) return "attack";
  return "open";
}

function withId(rec, id) { return labState(arguments[2] ? null : null); }

function stateOf(session, rec, labId) {
  rec._id = labId;
  const open = !!session.labsOpen[labId];
  if (rec.passed && rec.viewedBeforePass) return "completed_after_solution";
  if (rec.passed) return "completed";
  if (!open) return "locked";
  if (rec.attackSucceeded || rec.instructorSkip) return "fix";
  if (rec.started) return "attack";
  return "open";
}

function summary(session, learner, labId) {
  const meta = getMeta(labId);
  const rec = learner.labs[labId];
  return {
    id: labId,
    owaspId: meta.owaspId,
    titleHe: meta.titleHe,
    blurbHe: meta.blurbHe,
    state: stateOf(session, rec, labId),
    language: rec.language,
  };
}

function progressOf(learner) {
  let attacksSucceeded = 0;
  let fixesPassed = 0;
  for (const id of LAB_IDS) {
    const rec = learner.labs[id];
    if (rec.attackSucceeded) attacksSucceeded += 1;
    if (rec.passed) fixesPassed += 1;
  }
  return { attacksSucceeded, fixesPassed };
}

function activeFiles(labId, rec) {
  const lang = rec.language;
  if (rec.drafts[lang]) return rec.drafts[lang].map((f) => ({ ...f }));
  return editorFiles(labId);
}

function detail(session, learner, labId) {
  const meta = getMeta(labId);
  const rec = learner.labs[labId];
  const opened = meta.hints.filter((h) => h.level <= rec.hintsOpened);
  return {
    ...summary(session, learner, labId),
    briefing: meta.briefing,
    appUrl: `/lab-app/${labId}?learnerId=${encodeURIComponent(learner.id)}`,
    files: activeFiles(labId, rec),
    attackSucceeded: !!rec.attackSucceeded,
    attackFactHe: rec.attackFactHe,
    attackCauseHe: rec.attackCauseHe,
    hintsOpened: rec.hintsOpened,
    hints: opened,
    eventLog: rec.eventLog,
    instructorSkip: !!rec.instructorSkip,
    viewedSolution: !!rec.viewedSolution,
    owaspUrl: meta.owaspUrl,
  };
}

function findLearner(data, learnerId) {
  for (const session of Object.values(data.sessions)) {
    const learner = session.learners[learnerId];
    if (learner) return { session, learner };
  }
  return null;
}

function findSessionByCode(data, classCode) {
  const code = String(classCode || "").toUpperCase();
  return Object.values(data.sessions).find((s) => s.classCode === code) || null;
}

function boardCell(rec) {
  if (rec.passed && rec.viewedBeforePass) return { state: "passed_after_solution" };
  if (rec.passed) return { state: "passed" };
  if (rec.lastFailureCategory) return { state: "submitted_failed", failureCategory: rec.lastFailureCategory };
  if (rec.attackSucceeded) return { state: "attack_succeeded" };
  if (rec.instructorSkip) return { state: "instructor_skip" };
  if (rec.started) return { state: "attack" };
  return { state: "not_started" };
}

function boardOf(session) {
  return {
    classCode: session.classCode,
    closed: !!session.closed,
    labs: LAB_IDS.map((id) => {
      const meta = getMeta(id);
      return { id, titleHe: meta.titleHe, owaspId: meta.owaspId, open: !!session.labsOpen[id] };
    }),
    learners: Object.values(session.learners).map((learner) => ({
      learnerId: learner.id,
      displayName: learner.displayName,
      cells: Object.fromEntries(LAB_IDS.map((id) => [id, boardCell(learner.labs[id])])),
    })),
  };
}

function projectionOf(session) {
  return {
    labs: LAB_IDS.map((labId) => {
      const meta = getMeta(labId);
      const learners = Object.values(session.learners);
      const seen = (cat) => learners.filter((l) => (l.labs[labId].categoriesSeen || []).includes(cat)).length;
      const failureCounts = {};
      for (const cat of ["prompt_only", "blocklist", "client_only", "broke_happy_path", "hidden_variant", "other"]) {
        const n = seen(cat);
        if (n) failureCounts[cat] = n;
      }
      return {
        labId,
        titleHe: meta.titleHe,
        attackedSuccessfully: learners.filter((l) => l.labs[labId].attackSucceeded).length,
        promptOnlyRejected: seen("prompt_only"),
        brokeHappyPath: seen("broke_happy_path"),
        passed: learners.filter((l) => l.labs[labId].passed && !l.labs[labId].viewedBeforePass).length,
        passedAfterSolution: learners.filter((l) => l.labs[labId].passed && l.labs[labId].viewedBeforePass).length,
        failureCounts,
      };
    }),
  };
}

function emit(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function emitLearner(learnerId, event, data) {
  for (const res of learnerStreams.get(learnerId) || []) emit(res, event, data);
}
function emitInstructor(classCode, event, data) {
  for (const res of instructorStreams.get(classCode) || []) emit(res, event, data);
}
function emitState(session, learner, labId) {
  const state = stateOf(session, learner.labs[labId], labId);
  emitLearner(learner.id, "lab_state", { labId, state });
  emitInstructor(session.classCode, "lab_state", { labId, state });
  emitInstructor(session.classCode, "board", { classCode: session.classCode });
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Learner-Id, X-Instructor-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
}

function send(res, code, body) {
  const json = JSON.stringify(body);
  cors(res);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(json);
}
function err(res, code, errorHe) { send(res, code, { errorHe }); }

function isModelCallCeiling(run) {
  return /תקרת קריאות למודל/.test(String((run && run.error) || ""));
}


function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 1_000_000) { reject(new Error("large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(new Error("json")); }
    });
  });
}

function validLang(language) {
  return language === "python" || language === "typescript" || language === "pseudocode";
}

function checkFiles(files) {
  if (!Array.isArray(files) || !files.length) return "חסרים קבצים";
  for (const f of files) {
    if (!f || typeof f.path !== "string" || typeof f.content !== "string") return "קובץ לא תקין";
    if (!ALLOWED.has(f.path)) return "קובץ לא מוכר";
  }
  return null;
}

function fixOpen(session, rec, labId) {
  if (session.closed) return "המפגש נסגר";
  if (!session.labsOpen[labId]) return "המעבדה נעולה";
  if (!(rec.attackSucceeded || rec.instructorSkip)) return "שלב התיקון סגור עד שההתקפה מצליחה או שהמרצה מאשר דילוג";
  return null;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") { cors(res); res.writeHead(204); res.end(); return; }
    const url = new URL(req.url, `http://${HOST}`);
    const path = url.pathname;
    const method = req.method;

    if (method === "GET" && path === "/api/health") return send(res, 200, { ok: true });

    if (method === "POST" && path === "/api/instructor/sessions") {
      const created = await updateStore((data) => {
        const classCode = randomBytes(3).toString("hex").toUpperCase();
        const instructorKey = randomBytes(18).toString("hex");
        const id = randomBytes(12).toString("hex");
        const labsOpen = Object.fromEntries(LAB_IDS.map((id) => [id, false]));
        data.sessions[id] = { id, classCode, instructorKey, closed: false, createdAt: nowIso(), labsOpen, learners: {} };
        return { classCode, instructorKey, joinPath: `/?classCode=${classCode}` };
      });
      return send(res, 200, created);
    }

    if (method === "POST" && path === "/api/join") {
      const body = await readBody(req);
      const result = await updateStore((data) => {
        const session = findSessionByCode(data, body.classCode);
        if (!session) return { error: 400, errorHe: "קוד כיתה שגוי" };
        if (session.closed) return { error: 403, errorHe: "המפגש נסגר" };
        const displayName = String(body.displayName || "").trim();
        if (!displayName) return { error: 400, errorHe: "חסר שם תצוגה" };
        const learner = {
          id: randomBytes(12).toString("hex"),
          displayName,
          pin: String(randomInt(0, 1000000)).padStart(6, "0"),
          labs: {},
        };
        ensureLabs(learner);
        session.learners[learner.id] = learner;
        return { learnerId: learner.id, sessionId: session.id, displayName, pin: learner.pin, pinShownOnce: true };
      });
      if (result.error) return err(res, result.error, result.errorHe);
      return send(res, 200, result);
    }

    if (method === "POST" && path === "/api/resume") {
      const body = await readBody(req);
      const data = readStore();
      const session = findSessionByCode(data, body.classCode);
      if (!session) return err(res, 400, "קוד כיתה שגוי");
      const learner = Object.values(session.learners).find((l) => l.pin === String(body.pin || ""));
      if (!learner) return err(res, 401, "קוד אישי שגוי");
      ensureLabs(learner);
      return send(res, 200, {
        learnerId: learner.id,
        sessionId: session.id,
        displayName: learner.displayName,
        progress: progressOf(learner),
      });
    }

    if (method === "GET" && path === "/api/events") {
      const learnerId = url.searchParams.get("learnerId");
      const instructorKey = url.searchParams.get("instructorKey");
      const data = readStore();
      if (learnerId) {
        const found = findLearner(data, learnerId);
        if (!found) return err(res, 401, "לומד לא נמצא");
        cors(res);
        res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
        res.write(": ok\n\n");
        const set = learnerStreams.get(learnerId) || new Set();
        set.add(res);
        learnerStreams.set(learnerId, set);
        const timer = setInterval(() => { try { res.write(": ping\n\n"); } catch { /* ignore */ } }, 15000);
        req.on("close", () => { clearInterval(timer); set.delete(res); });
        return;
      }
      if (instructorKey) {
        const session = Object.values(data.sessions).find((s) => s.instructorKey === instructorKey);
        if (!session) return err(res, 401, "מפתח מרצה שגוי");
        cors(res);
        res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
        res.write(": ok\n\n");
        const set = instructorStreams.get(session.classCode) || new Set();
        set.add(res);
        instructorStreams.set(session.classCode, set);
        const timer = setInterval(() => { try { res.write(": ping\n\n"); } catch { /* ignore */ } }, 15000);
        req.on("close", () => { clearInterval(timer); set.delete(res); });
        return;
      }
      return err(res, 401, "חסר מזהה לזרם האירועים");
    }

    const learnerHeader = req.headers["x-learner-id"];
    const instructorHeader = req.headers["x-instructor-key"];

    if (path.startsWith("/api/instructor/")) {
      const parts = path.split("/").filter(Boolean);
      // api instructor sessions :classCode ...
      const classCode = parts[3] ? decodeURIComponent(parts[3]) : "";
      const data0 = readStore();
      const session0 = findSessionByCode(data0, classCode);
      if (!session0) return err(res, 404, "מפגש לא נמצא");
      if (session0.instructorKey !== instructorHeader) return err(res, 401, "מפתח מרצה שגוי");

      if (method === "GET" && parts.length === 4) return send(res, 200, boardOf(session0));
      if (method === "GET" && parts[4] === "projection") return send(res, 200, projectionOf(session0));
      if (method === "GET" && parts[4] === "export") {
        const proj = projectionOf(session0);
        return send(res, 200, {
          classCode: session0.classCode,
          closed: !!session0.closed,
          exportedAt: nowIso(),
          labs: proj.labs,
          learners: boardOf(session0).learners,
        });
      }
      if (method === "POST" && parts[4] === "labs" && parts[6] === "open") {
        const labId = parts[5];
        if (!getMeta(labId)) return err(res, 404, "מעבדה לא נמצאה");
        await updateStore((data) => {
          const session = findSessionByCode(data, classCode);
          session.labsOpen[labId] = true;
          for (const learner of Object.values(session.learners)) emitState(session, learner, labId);
        });
        return send(res, 200, { open: true });
      }
      if (method === "POST" && parts[4] === "labs" && parts[6] === "lock") {
        const labId = parts[5];
        if (!getMeta(labId)) return err(res, 404, "מעבדה לא נמצאה");
        await updateStore((data) => {
          const session = findSessionByCode(data, classCode);
          session.labsOpen[labId] = false;
          for (const learner of Object.values(session.learners)) emitState(session, learner, labId);
        });
        return send(res, 200, { open: false });
      }
      if (method === "POST" && parts[4] === "labs" && parts[5] === "open-all") {
        await updateStore((data) => {
          const session = findSessionByCode(data, classCode);
          for (const id of LAB_IDS) session.labsOpen[id] = true;
          for (const learner of Object.values(session.learners)) {
            for (const id of LAB_IDS) emitState(session, learner, id);
          }
        });
        return send(res, 200, { open: LAB_IDS });
      }
      if (method === "POST" && parts[4] === "close") {
        await updateStore((data) => {
          const session = findSessionByCode(data, classCode);
          session.closed = true;
          const payload = { classCode: session.classCode };
          emitInstructor(session.classCode, "session_closed", payload);
          for (const learner of Object.values(session.learners)) emitLearner(learner.id, "session_closed", payload);
        });
        return send(res, 200, { closed: true });
      }
      if (method === "POST" && parts[4] === "learners" && parts[6] === "labs" && parts[8] === "skip") {
        const learnerId = parts[5];
        const labId = parts[7];
        if (!getMeta(labId)) return err(res, 404, "מעבדה לא נמצאה");
        const out = await updateStore((data) => {
          const session = findSessionByCode(data, classCode);
          const learner = session.learners[learnerId];
          if (!learner) return { error: 404, errorHe: "לומד לא נמצא" };
          ensureLabs(learner);
          const rec = learner.labs[labId];
          rec.instructorSkip = true;
          rec.timeline.push({ at: nowIso(), kind: "instructor_skip", textHe: "המרצה אישר דילוג לשלב התיקון" });
          emitState(session, learner, labId);
          return { ok: true };
        });
        if (out.error) return err(res, out.error, out.errorHe);
        return send(res, 200, out);
      }
      if (method === "GET" && parts[4] === "learners" && parts[6] === "labs" && parts[8] === "timeline") {
        const learner = session0.learners[parts[5]];
        const labId = parts[7];
        if (!learner || !learner.labs[labId]) return err(res, 404, "לא נמצא");
        return send(res, 200, { events: learner.labs[labId].timeline });
      }
      return err(res, 404, "נתיב לא נמצא");
    }

    if (path.startsWith("/lab-app/")) {
      const parts = path.split("/").filter(Boolean);
      const labId = parts[1];
      const learnerId = url.searchParams.get("learnerId");
      if (!getMeta(labId)) return err(res, 404, "מעבדה לא נמצאה");
      if (method === "GET" && parts.length === 2) {
        const data = readStore();
        const found = findLearner(data, learnerId);
        if (!found) return err(res, 401, "לומד לא נמצא");
        ensureLabs(found.learner);
        cors(res);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(renderLabPage(labId, learnerId, found.learner.labs[labId]));
        return;
      }
      if (method === "POST" && parts[2] === "act") {
        const body = await readBody(req);
        // text wins over a leftover actionId. actionId is not required.
        const textIn = body.text != null ? String(body.text) : "";
        const saved = await updateStore((data) => {
          const found = findLearner(data, learnerId);
          if (!found) return { error: 401, errorHe: "לומד לא נמצא" };
          // Same rejection check uses when the session is closed. Do not run the
          // attack and do not set attackSucceeded.
          if (found.session.closed) return { error: 403, errorHe: "המפגש נסגר" };
          if (!found.session.labsOpen[labId]) return { error: 403, errorHe: "המעבדה נעולה" };
          ensureLabs(found.learner);
          const rec = found.learner.labs[labId];
          const outcome = runAttackAction(labId, textIn, rec.benchState || null);
          if (outcome.benchState) rec.benchState = outcome.benchState;
          const entry = { at: nowIso(), textHe: outcome.detected ? "הגלאי זיהה את ההתקפה" : "הפעולה רצה בלי זיהוי התקפה" };
          rec.eventLog.unshift(entry);
          emitLearner(found.learner.id, "event_log", { labId, entry });
          if (outcome.detected && isModelCallCeiling(outcome.run)) {
            const cap = { at: nowIso(), textHe: "תקרת הקריאות למודל נחצתה יחד עם חריגה מהתקציב. זו תוצאת ההתקפה, לא קריסת הרצה." };
            rec.eventLog.unshift(cap);
            emitLearner(found.learner.id, "event_log", { labId, entry: cap });
          }
          if (outcome.detected && !rec.attackSucceeded) {
            const meta = getMeta(labId);
            rec.attackSucceeded = true;
            rec.attackFactHe = meta.factHe;
            rec.attackCauseHe = meta.causeHe;
            rec.timeline.push({ at: nowIso(), kind: "attack_succeeded", textHe: meta.factHe });
            emitLearner(found.learner.id, "attack_succeeded", { labId, factHe: meta.factHe, causeHe: meta.causeHe });
            emitState(found.session, found.learner, labId);
          }
          return { attackSucceeded: !!outcome.detected, entryHe: entry.textHe, outcome };
        });
        if (saved.error) return err(res, saved.error, saved.errorHe);
        const outcome = saved.outcome;
        // LLM10's infinite improve loop is stopped by the host model-call ceiling
        // after the budget detector has already fired. That stop is the attack
        // outcome, not a learner-facing crash. Other exceptions stay failures.
        const ceilingIsAttack = outcome.detected && isModelCallCeiling(outcome.run);
        const ok = !!outcome.run.ok || ceilingIsAttack;
        const received = String(outcome.received || "");
        return send(res, 200, {
          ok,
          output: ok ? String(outcome.output || "") : "",
          received,
          prompt: received,
          modelInput: received,
          errorHe: ok ? null : "שגיאת הרצה: " + (outcome.run.error || ""),
          attackSucceeded: saved.attackSucceeded,
          entryHe: saved.entryHe,
        });
      }
    }

    if (method === "GET" && !path.startsWith("/api") && !path.startsWith("/lab-app")) {
      serveDist(res, path);
      return;
    }

    if (!path.startsWith("/api/")) return err(res, 404, "נתיב לא נמצא");

    const data = readStore();
    const found = findLearner(data, learnerHeader);
    if (!found) return err(res, 401, "חסר מזהה לומד או שהוא לא נמצא");
    const { session, learner } = found;
    ensureLabs(learner);

    if (method === "GET" && path === "/api/session") {
      return send(res, 200, {
        sessionId: session.id,
        classCode: session.classCode,
        closed: !!session.closed,
        labs: LAB_IDS.map((id) => summary(session, learner, id)),
        progress: progressOf(learner),
      });
    }
    if (method === "GET" && path === "/api/labs") {
      return send(res, 200, LAB_IDS.map((id) => summary(session, learner, id)));
    }

    const sub = path.match(/^\/api\/submissions\/([^/]+)$/);
    if (method === "GET" && sub) {
      const item = data.submissions[sub[1]];
      if (!item || item.learnerId !== learner.id) return err(res, 404, "הגשה לא נמצאה");
      return send(res, 200, item.body);
    }

    const labMatch = path.match(/^\/api\/labs\/([^/]+)(?:\/(.*))?$/);
    if (!labMatch) return err(res, 404, "נתיב לא נמצא");
    const labId = decodeURIComponent(labMatch[1]);
    const rest = labMatch[2] || "";
    if (!getMeta(labId)) return err(res, 404, "מעבדה לא נמצאה");
    const rec = learner.labs[labId];

    if (method === "GET" && rest === "") {
      if (session.labsOpen[labId] && !rec.started && !rec.attackSucceeded && !rec.passed) {
        await updateStore((d) => {
          const f = findLearner(d, learner.id);
          f.learner.labs[labId].started = true;
          emitState(f.session, f.learner, labId);
        });
        rec.started = true;
      }
      const fresh = findLearner(readStore(), learner.id);
      return send(res, 200, detail(fresh.session, fresh.learner, labId));
    }

    if (method === "POST" && rest === "language") {
      if (!session.labsOpen[labId]) return err(res, 403, "המעבדה נעולה");
      const body = await readBody(req);
      if (!validLang(body.language)) return err(res, 400, "שפה לא נתמכת");
      const saved = await updateStore((d) => {
        const f = findLearner(d, learner.id);
        f.learner.labs[labId].language = body.language;
        return activeFiles(labId, f.learner.labs[labId]);
      });
      return send(res, 200, { language: body.language, files: saved });
    }

    if (method === "POST" && rest === "hints/next") {
      if (!session.labsOpen[labId]) return err(res, 403, "המעבדה נעולה");
      const saved = await updateStore((d) => {
        const f = findLearner(d, learner.id);
        const r = f.learner.labs[labId];
        if (r.hintsOpened < 3) {
          r.hintsOpened += 1;
          r.timeline.push({ at: nowIso(), kind: "hint", textHe: "נפתח רמז " + r.hintsOpened });
        }
        return r.hintsOpened;
      });
      const meta = getMeta(labId);
      return send(res, 200, { hintsOpened: saved, hints: meta.hints.filter((h) => h.level <= saved) });
    }

    if (method === "PUT" && rest === "files") {
      const gate = fixOpen(session, rec, labId);
      if (gate) return err(res, 403, gate);
      const body = await readBody(req);
      if (!validLang(body.language)) return err(res, 400, "שפה לא נתמכת");
      if (!ALLOWED.has(body.path)) return err(res, 400, "קובץ לא מוכר");
      const starter = editorFiles(labId).find((f) => f.path === body.path);
      if (!starter) return err(res, 400, "קובץ לא מוכר");
      if (starter && starter.editable === false) return err(res, 403, "הקובץ לקריאה בלבד");
      await updateStore((d) => {
        const f = findLearner(d, learner.id);
        const r = f.learner.labs[labId];
        r.language = body.language;
        const files = activeFiles(labId, r).map((file) => file.path === body.path ? { ...file, content: String(body.content ?? "") } : file);
        if (!files.some((file) => file.path === body.path)) {
          files.push({ path: body.path, content: String(body.content ?? ""), editable: true });
        }
        r.drafts[body.language] = files;
      });
      return send(res, 200, { ok: true });
    }

    if (method === "POST" && rest === "reset") {
      const gate = fixOpen(session, rec, labId);
      if (gate) return err(res, 403, gate);
      const body = await readBody(req);
      if (!validLang(body.language)) return err(res, 400, "שפה לא נתמכת");
      const files = await updateStore((d) => {
        const f = findLearner(d, learner.id);
        const r = f.learner.labs[labId];
        r.language = body.language;
        r.drafts[body.language] = null;
        return editorFiles(labId);
      });
      return send(res, 200, { files });
    }

    if (method === "POST" && rest === "run") {
      const gate = fixOpen(session, rec, labId);
      if (gate) return err(res, 403, gate);
      const body = await readBody(req);
      if (!validLang(body.language)) return err(res, 400, "שפה לא נתמכת");
      const problem = checkFiles(body.files);
      if (problem) return err(res, 400, problem);
      await updateStore((d) => {
        const f = findLearner(d, learner.id);
        const r = f.learner.labs[labId];
        r.language = body.language;
        r.drafts[body.language] = body.files.map((f) => ({ ...f }));
      });
      const input = { resume: "", question: "מה האחריות?", review: "ביקורת", document: "מסמך קצר", message: "שלום", query: "קמפיין הקיץ", action: "summarize" };
      const run = await execute({ labId, language: body.language, files: body.files, scenario: "practice", input });
      const fresh = findLearner(readStore(), learner.id);
      return send(res, 200, {
        ok: !!run.ok,
        output: run.ok ? JSON.stringify(run.output, null, 2) : "",
        ...(run.ok ? {} : { errorHebrew: "שגיאת הרצה: " + (run.error || "") }),
        appUrl: `/lab-app/${labId}?learnerId=${encodeURIComponent(learner.id)}`,
      });
      void fresh;
    }

    if (method === "POST" && rest === "check") {
      const gate = fixOpen(session, rec, labId);
      if (gate) return err(res, 403, gate);
      const body = await readBody(req);
      if (!validLang(body.language)) return err(res, 400, "שפה לא נתמכת");
      const problem = checkFiles(body.files);
      if (problem) return err(res, 400, problem);
      const submissionId = randomBytes(12).toString("hex");
      await updateStore((d) => {
        const f = findLearner(d, learner.id);
        const r = f.learner.labs[labId];
        r.language = body.language;
        r.drafts[body.language] = body.files.map((file) => ({ ...file }));
        d.submissions[submissionId] = {
          learnerId: learner.id,
          body: { submissionId, done: false, passed: false, checks: [] },
        };
      });
      const graded = await gradeSite({
        labId,
        files: body.files,
        onUpdate: async (snap) => {
          const payload = { submissionId, labId, ...snap };
          emitLearner(learner.id, "submission_check", payload);
          await updateStore((d) => {
            d.submissions[submissionId].body = { submissionId, done: snap.done, passed: snap.passed, checks: snap.checks };
          });
        },
      });
      const finalBody = { submissionId, done: true, passed: graded.passed, checks: graded.checks };
      await updateStore((d) => {
        const f = findLearner(d, learner.id);
        const r = f.learner.labs[labId];
        d.submissions[submissionId].body = finalBody;
        r.submissionIds.push(submissionId);
        const failed = graded.checks.find((c) => c.status === "failed");
        if (graded.passed) {
          if (r.viewedSolution && !r.passed) r.viewedBeforePass = true;
          r.passed = true;
          r.lastFailureCategory = null;
          r.timeline.push({ at: nowIso(), kind: "passed", textHe: "כל הבדיקות עברו" });
        } else if (failed) {
          r.lastFailureCategory = failed.category || "other";
          for (const c of graded.checks) {
            if (c.status === "failed" && c.category && !r.categoriesSeen.includes(c.category)) r.categoriesSeen.push(c.category);
          }
          r.timeline.push({ at: nowIso(), kind: "submission", textHe: "הגשה נכשלה: " + (failed.category || "") });
        }
        emitLearner(learner.id, "submission_check", { ...finalBody, labId });
        emitState(f.session, f.learner, labId);
      });
      return send(res, 200, finalBody);
    }

    if (method === "POST" && rest === "solution/view") {
      if (!session.labsOpen[labId] && !rec.passed) return err(res, 403, "המעבדה נעולה");
      const meta = getMeta(labId);
      const viewedBeforePass = await updateStore((d) => {
        const f = findLearner(d, learner.id);
        const r = f.learner.labs[labId];
        if (!r.passed) r.viewedBeforePass = true;
        r.viewedSolution = true;
        r.timeline.push({ at: nowIso(), kind: "viewed_solution", textHe: "נצפה הפתרון המומלץ" });
        emitState(f.session, f.learner, labId);
        return !!r.viewedBeforePass && !r.passed ? true : !!r.viewedBeforePass && r.passed && r.viewedBeforePass;
      });
      const fresh = findLearner(readStore(), learner.id).learner.labs[labId];
      return send(res, 200, { referenceSolutionHe: meta.solutionHe, viewedBeforePass: !fresh.passed || fresh.viewedBeforePass });
      void viewedBeforePass;
    }

    if (method === "POST" && rest === "reflection") {
      if (!rec.passed) return err(res, 403, "המעבדה עדיין לא הושלמה");
      const body = await readBody(req);
      await updateStore((d) => {
        findLearner(d, learner.id).learner.labs[labId].reflection = String(body.text || "");
      });
      return send(res, 200, { ok: true });
    }

    if (method === "GET" && rest === "completion") {
      if (!rec.passed) return err(res, 403, "המעבדה עדיין לא הושלמה");
      const meta = getMeta(labId);
      const starter = editorFiles(labId);
      const edited = activeFiles(labId, rec);
      const diff = edited.map((f) => {
        const base = starter.find((s) => s.path === f.path);
        if (!base || base.content === f.content) return "";
        return `--- ${f.path}\n${f.content}`;
      }).filter(Boolean).join("\n");
      return send(res, 200, {
        attackSummaryHe: rec.attackFactHe || meta.factHe,
        diff: diff || "אין הבדל מהקוד הפגיע",
        controlHe: meta.solutionHe,
        referenceSolutionHe: meta.solutionHe,
        owaspUrl: meta.owaspUrl,
        viewedSolutionBeforePass: !!rec.viewedBeforePass,
      });
    }

    return err(res, 404, "נתיב לא נמצא");
  } catch (e) {
    if (!res.headersSent) err(res, 500, "שגיאת שרת");
    console.error(e);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`llm-labs listening on http://${HOST}:${PORT}`);
});

void labState;
void withId;
void HIDDEN_SENTINEL;
