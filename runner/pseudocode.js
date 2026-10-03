// Small English-keyword dialect. See contracts/pseudocode.md.

class PseudoError extends Error {}

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const isId = (c) => /[A-Za-z_\u0590-\u05FF]/.test(c);
  const isId2 = (c) => /[A-Za-z0-9_\u0590-\u05FF]/.test(c);
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t" || c === "\r") { i++; continue; }
    if (c === "\n") { tokens.push({ t: "nl" }); i++; continue; }
    if (c === "#") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === '"' || c === "'") {
      const q = c;
      i++;
      let s = "";
      while (i < src.length && src[i] !== q) {
        if (src[i] === "\\") {
          const n = src[++i];
          s += n === "n" ? "\n" : n === "t" ? "\t" : n;
          i++;
        } else s += src[i++];
      }
      if (src[i] !== q) throw new PseudoError("מחרוזת לא נסגרה");
      i++;
      tokens.push({ t: "str", v: s });
      continue;
    }
    if (/[0-9]/.test(c)) {
      let s = "";
      while (i < src.length && /[0-9.]/.test(src[i])) s += src[i++];
      tokens.push({ t: "num", v: Number(s) });
      continue;
    }
    if ("{}[](),:.".includes(c)) { tokens.push({ t: c }); i++; continue; }
    if (src.startsWith("==", i)) { tokens.push({ t: "op", v: "==" }); i += 2; continue; }
    if (src.startsWith("!=", i)) { tokens.push({ t: "op", v: "!=" }); i += 2; continue; }
    if (src.startsWith("<=", i)) { tokens.push({ t: "op", v: "<=" }); i += 2; continue; }
    if (src.startsWith(">=", i)) { tokens.push({ t: "op", v: ">=" }); i += 2; continue; }
    if (c === "<" || c === ">" || c === "+") { tokens.push({ t: "op", v: c }); i++; continue; }
    if (isId(c)) {
      let s = "";
      while (i < src.length && isId2(src[i])) s += src[i++];
      tokens.push({ t: "id", v: s });
      continue;
    }
    throw new PseudoError("תו לא מוכר: " + c);
  }
  tokens.push({ t: "eof" });
  return tokens;
}

const KEYWORDS = new Set(["set", "to", "if", "then", "else", "end", "while", "return", "and", "or", "not", "true", "false", "contains"]);

export function runPseudocode(source, env) {
  const tokens = tokenize(source);
  let i = 0;
  let steps = 0;
  const MAX = 4000;
  function peek() { return tokens[i]; }
  function next() { return tokens[i++]; }
  function eatNl() { while (peek().t === "nl") next(); }
  function step() {
    steps++;
    if (steps > MAX) throw new PseudoError("הלולאה נעצרה: יותר מדי צעדים");
  }

  function parseBlock(stop) {
    const stmts = [];
    eatNl();
    while (peek().t !== "eof" && !(peek().t === "id" && stop.includes(peek().v))) {
      stmts.push(parseStmt());
      eatNl();
    }
    return stmts;
  }

  function parseStmt() {
    eatNl();
    const p = peek();
    if (p.t === "id" && p.v === "set") {
      next();
      const path = parsePath();
      if (!(peek().t === "id" && peek().v === "to")) throw new PseudoError("חסר to");
      next();
      const expr = parseExpr();
      return { k: "set", path, expr };
    }
    if (p.t === "id" && p.v === "if") {
      next();
      const cond = parseExpr();
      if (!(peek().t === "id" && peek().v === "then")) throw new PseudoError("חסר then");
      next();
      const thenB = parseBlock(["else", "end"]);
      let elseB = [];
      if (peek().t === "id" && peek().v === "else") {
        next();
        elseB = parseBlock(["end"]);
      }
      if (!(peek().t === "id" && peek().v === "end")) throw new PseudoError("חסר end");
      next();
      return { k: "if", cond, thenB, elseB };
    }
    if (p.t === "id" && p.v === "while") {
      next();
      const cond = parseExpr();
      const body = parseBlock(["end"]);
      if (!(peek().t === "id" && peek().v === "end")) throw new PseudoError("חסר end");
      next();
      return { k: "while", cond, body };
    }
    if (p.t === "id" && p.v === "return") {
      next();
      return { k: "return", expr: parseExpr() };
    }
    const expr = parseExpr();
    return { k: "expr", expr };
  }

  function parsePath() {
    if (peek().t !== "id") throw new PseudoError("חסר שם");
    const parts = [next().v];
    while (peek().t === ".") {
      next();
      if (peek().t !== "id") throw new PseudoError("חסר שדה");
      parts.push(next().v);
    }
    return parts;
  }

  function parseExpr() { return parseOr(); }
  function parseOr() {
    let left = parseAnd();
    while (peek().t === "id" && peek().v === "or") { next(); const r = parseAnd(); left = { k: "or", left, right: r }; }
    return left;
  }
  function parseAnd() {
    let left = parseNot();
    while (peek().t === "id" && peek().v === "and") { next(); const r = parseNot(); left = { k: "and", left, right: r }; }
    return left;
  }
  function parseNot() {
    if (peek().t === "id" && peek().v === "not") { next(); return { k: "not", expr: parseNot() }; }
    return parseCmp();
  }
  function parseCmp() {
    let left = parseAdd();
    if (peek().t === "op") {
      const op = next().v;
      left = { k: "cmp", op, left, right: parseAdd() };
    } else if (peek().t === "id" && peek().v === "contains") {
      next();
      left = { k: "contains", left, right: parseAdd() };
    }
    return left;
  }
  function parseAdd() {
    let left = parsePrimary();
    while (peek().t === "op" && peek().v === "+") {
      next();
      left = { k: "add", left, right: parsePrimary() };
    }
    return left;
  }
  function parsePrimary() {
    const p = peek();
    if (p.t === "str" || p.t === "num") { next(); return { k: "lit", v: p.v }; }
    if (p.t === "id" && (p.v === "true" || p.v === "false")) { next(); return { k: "lit", v: p.v === "true" }; }
    if (p.t === "(") { next(); const e = parseExpr(); if (peek().t !== ")") throw new PseudoError("חסר )"); next(); return e; }
    if (p.t === "{") return parseObj();
    if (p.t === "[") return parseArr();
    if (p.t === "id") {
      const path = parsePath();
      if (peek().t === "(") {
        next();
        const args = [];
        if (peek().t !== ")") {
          args.push(parseExpr());
          while (peek().t === ",") { next(); args.push(parseExpr()); }
        }
        if (peek().t !== ")") throw new PseudoError("חסר )");
        next();
        return { k: "call", path, args };
      }
      return { k: "get", path };
    }
    throw new PseudoError("ביטוי לא תקין");
  }
  function parseObj() {
    next();
    const fields = [];
    eatNl();
    if (peek().t !== "}") {
      while (true) {
        eatNl();
        if (peek().t !== "id") throw new PseudoError("חסר שדה באובייקט");
        const name = next().v;
        if (peek().t !== ":") throw new PseudoError("חסר :");
        next();
        fields.push([name, parseExpr()]);
        eatNl();
        if (peek().t === ",") { next(); continue; }
        break;
      }
    }
    if (peek().t !== "}") throw new PseudoError("חסר }");
    next();
    return { k: "obj", fields };
  }
  function parseArr() {
    next();
    const items = [];
    if (peek().t !== "]") {
      items.push(parseExpr());
      while (peek().t === ",") { next(); items.push(parseExpr()); }
    }
    if (peek().t !== "]") throw new PseudoError("חסר ]");
    next();
    return { k: "arr", items };
  }

  const root = parseBlock([]);

  function truth(v) { return !!v; }
  function lookup(path) {
    let cur = env.vars;
    for (let n = 0; n < path.length; n++) {
      if (cur == null) return undefined;
      if (n === 0 && Object.prototype.hasOwnProperty.call(env.vars, path[0]) === false && env.rpc) {
        // fall through to object fields
      }
      cur = cur[path[n]];
    }
    return cur;
  }
  function evalExpr(node) {
    step();
    if (node.k === "lit") return node.v;
    if (node.k === "or") return truth(evalExpr(node.left)) ? evalExpr(node.left) : evalExpr(node.right);
    if (node.k === "and") return truth(evalExpr(node.left)) ? evalExpr(node.right) : evalExpr(node.left);
    if (node.k === "not") return !truth(evalExpr(node.expr));
    if (node.k === "add") {
      const a = evalExpr(node.left);
      const b = evalExpr(node.right);
      if (typeof a === "string" || typeof b === "string") return String(a) + String(b);
      return Number(a) + Number(b);
    }
    if (node.k === "contains") {
      return String(evalExpr(node.left)).includes(String(evalExpr(node.right)));
    }
    if (node.k === "cmp") {
      const a = evalExpr(node.left);
      const b = evalExpr(node.right);
      if (node.op === "==") return a === b;
      if (node.op === "!=") return a !== b;
      if (node.op === "<") return a < b;
      if (node.op === ">") return a > b;
      if (node.op === "<=") return a <= b;
      if (node.op === ">=") return a >= b;
    }
    if (node.k === "obj") {
      const o = {};
      for (const [name, ex] of node.fields) o[name] = evalExpr(ex);
      return o;
    }
    if (node.k === "arr") return node.items.map(evalExpr);
    if (node.k === "get") return getPath(node.path);
    if (node.k === "call") return callPath(node.path, node.args.map(evalExpr));
    throw new PseudoError("צומת לא נתמך");
  }
  function getPath(path) {
    if (path.length === 1 && Object.prototype.hasOwnProperty.call(env.vars, path[0])) return env.vars[path[0]];
    const rootName = path[0];
    if (Object.prototype.hasOwnProperty.call(env.vars, rootName)) {
      let cur = env.vars[rootName];
      for (let n = 1; n < path.length; n++) {
        if (cur == null) return undefined;
        cur = cur[path[n]];
      }
      return cur;
    }
    throw new PseudoError("שם לא מוכר: " + path.join("."));
  }
  function callPath(path, args) {
    if (path[0] === "json" && path[1] === "parse") return JSON.parse(String(args[0] ?? ""));
    if (path[0] === "json" && path[1] === "stringify") return JSON.stringify(args[0]);
    if (path[0] === "length") return String(args[0] ?? "").length;
    if (!env.rpc) throw new PseudoError("אין קריאה: " + path.join("."));
    return env.rpc(path.join("."), args);
  }
  function setPath(path, value) {
    if (path.length === 1) { env.vars[path[0]] = value; return; }
    let cur = env.vars[path[0]];
    if (cur == null || typeof cur !== "object") throw new PseudoError("אי אפשר לכתוב ל-" + path.join("."));
    for (let n = 1; n < path.length - 1; n++) cur = cur[path[n]];
    cur[path[path.length - 1]] = value;
  }
  function execStmt(stmt) {
    step();
    if (stmt.k === "set") { setPath(stmt.path, evalExpr(stmt.expr)); return; }
    if (stmt.k === "expr") { evalExpr(stmt.expr); return; }
    if (stmt.k === "return") { const v = evalExpr(stmt.expr); throw { __ret: v }; }
    if (stmt.k === "if") {
      const stmts = truth(evalExpr(stmt.cond)) ? stmt.thenB : stmt.elseB;
      for (const s of stmts) execStmt(s);
      return;
    }
    if (stmt.k === "while") {
      let guard = 0;
      while (truth(evalExpr(stmt.cond))) {
        if (++guard > 500) throw new PseudoError("לולאה חרגה מתקרת הבטיחות");
        for (const s of stmt.body) execStmt(s);
      }
    }
  }
  try {
    for (const s of root) execStmt(s);
  } catch (e) {
    if (e && Object.prototype.hasOwnProperty.call(e, "__ret")) return e.__ret;
    throw e;
  }
  throw new PseudoError("התוכנית לא החזירה ערך");
}

