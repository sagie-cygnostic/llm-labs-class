export type FixSpec = {
  fn: string;
  path: string;
  starter: string;
};

/** Starter strings copied from reference-llm-labs. Not sent to the server. */
export const FIX_SPECS: Record<string, FixSpec> = {
  llm01: {
    fn: "authorizeRefund",
    path: "server/refunds/authorize.js",
    starter: "// Runs on your server, after the model, before any money moves.\n// `decision` came out of a language model. Treat it like a form field\n// filled in by a stranger.\n\nfunction authorizeRefund(decision, ctx) {\n  // TODO: right now this believes whatever the model asked for.\n  return { allow: true, reason: 'model approved' };\n}\n",
  },
  llm02: {
    fn: "retrieveContext",
    path: "server/rag/retrieve.js",
    starter: "// A helper you can use as-is: how many query words appear in a document.\nfunction score(query, doc) {\n  const terms = String(query).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);\n  const hay = String(doc.text).toLowerCase();\n  return terms.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);\n}\n\nfunction retrieveContext(query, user, corpus) {\n  // TODO: this runs as the service account and can see everything.\n  return corpus\n    .map(doc => ({ doc, s: score(query, doc) }))\n    .filter(x => x.s > 0)\n    .sort((a, b) => b.s - a.s)\n    .slice(0, 4)\n    .map(x => x.doc);\n}\n",
  },
  llm03: {
    fn: "vetDependency",
    path: "ci/vet-dependency.js",
    starter: "const ALLOWED_REGISTRIES = [\n  'https://pypi.org/simple',\n  'https://registry.npmjs.org',\n  'https://registry.internal.acme/plugins',\n  'https://huggingface.co'\n];\nconst POPULAR = ['openai-whisper', 'langchain', 'requests', 'transformers', 'numpy', 'pillow'];\n\n// Provided for you — edit distance between two strings.\nfunction levenshtein(a, b) {\n  const m = [];\n  for (let i = 0; i <= b.length; i++) m[i] = [i];\n  for (let j = 0; j <= a.length; j++) m[0][j] = j;\n  for (let i = 1; i <= b.length; i++)\n    for (let j = 1; j <= a.length; j++)\n      m[i][j] = b[i-1] === a[j-1] ? m[i-1][j-1]\n              : Math.min(m[i-1][j-1] + 1, m[i][j-1] + 1, m[i-1][j] + 1);\n  return m[b.length][a.length];\n}\n\nfunction vetDependency(dep) {\n  const reasons = [];\n  // TODO: nothing is checked yet.\n  return { allow: reasons.length === 0, reasons };\n}\n",
  },
  llm04: {
    fn: "acceptTrainingSample",
    path: "server/feedback/accept.js",
    starter: "function normalise(text) {\n  return String(text || '').toLowerCase().replace(/\\s+/g, ' ').trim();\n}\n\nfunction acceptTrainingSample(sample, store) {\n  // TODO: today, anything a user types becomes training data.\n  return { accept: true, reason: 'ok' };\n}\n",
  },
  llm05: {
    fn: "renderModelOutput",
    path: "client/render-draft.js",
    starter: "function renderModelOutput(markdown) {\n  // TODO: this hands the model's string straight to the DOM.\n  return String(markdown);\n}\n",
  },
  llm06: {
    fn: "toolPolicy",
    path: "agent/tool-policy.js",
    starter: "function toolPolicy(call, ctx) {\n  // TODO: today the agent calls whatever it decides to call.\n  return { allow: true, requiresApproval: false, reason: 'agent decided' };\n}\n",
  },
  llm07: {
    fn: "vetSystemPrompt",
    path: "ci/vet-system-prompt.js",
    starter: "function vetSystemPrompt(prompt) {\n  const findings = [];\n  const text = String(prompt || '');\n\n  // TODO: nothing is checked yet.\n\n  return { safe: findings.length === 0, findings };\n}\n",
  },
  llm08: {
    fn: "searchIndex",
    path: "server/rag/search.js",
    starter: "// Provided: fraction of query words that appear in the document.\nfunction similarity(query, doc) {\n  const terms = String(query).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);\n  if (!terms.length) return 0;\n  const hay = String(doc.text).toLowerCase();\n  return terms.filter(w => hay.indexOf(w) >= 0).length / terms.length;\n}\n\nconst SCORE_FLOOR = 0.3;\nconst MAX_RESULTS = 3;\n\nfunction searchIndex(query, user, index) {\n  // TODO: ranks the whole shared index on similarity alone.\n  return index\n    .map(doc => ({ doc, s: similarity(query, doc) }))\n    .sort((a, b) => b.s - a.s)\n    .slice(0, MAX_RESULTS)\n    .map(x => x.doc);\n}\n",
  },
  llm09: {
    fn: "verifyPackages",
    path: "server/assistant/ground.js",
    starter: "function verifyPackages(answer, registry) {\n  const unknown = [];\n  const text = String(answer || '');\n\n  // TODO: nothing is extracted or checked yet.\n\n  return { safe: unknown.length === 0, unknown };\n}\n",
  },
  llm10: {
    fn: "admitRequest",
    path: "server/gateway/admit.js",
    starter: "function admitRequest(req, budget) {\n  // TODO: the endpoint currently serves whatever arrives, at whatever size.\n  return { allow: true, maxOutputTokens: Infinity, reason: 'no limits configured' };\n}\n",
  },
};

export function fixSpec(labId: string): FixSpec | null {
  return FIX_SPECS[labId] ?? null;
}

/** Server file is the new lab only when it defines this function and is not the old handle lab. */
export function isNewLabFile(content: string, fnName: string): boolean {
  return content.includes(fnName) && !content.includes("function handle");
}

export function pickServerFixFile<T extends { content: string; editable: boolean }>(files: T[], fnName: string): T | null {
  const hits = files.filter((file) => isNewLabFile(file.content, fnName));
  return hits.find((file) => file.editable) ?? hits[0] ?? null;
}
