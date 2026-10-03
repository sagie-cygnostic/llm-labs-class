import fs from "fs";
import path from "path";

const file = "/workspace/llm-labs/data/sessions.json";

function empty() {
  return { sessions: {}, submissions: {} };
}

export function readStore() {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return empty();
  }
}

function writeStore(data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
}

let chain = Promise.resolve();
export function updateStore(mutator) {
  const run = chain.then(async () => {
    const data = readStore();
    const result = await mutator(data);
    writeStore(data);
    return result;
  });
  chain = run.then(() => {}, () => {});
  return run;
}
