import { getMeta } from "../labs/registry.js";
import { attackTurn, attackUi } from "./attackBench.js";

export function runAttackAction(labId, text, prior) {
  const turn = attackTurn(labId, text, prior);
  return {
    run: turn.run,
    detected: !!turn.detected,
    output: turn.output,
    received: turn.received,
    benchState: turn.benchState || null,
  };
}

export function renderLabPage(labId, learnerId, rec) {
  const meta = getMeta(labId);
  const ui = attackUi[labId] || { blurb: meta.titleHe, placeholder: "" };
  const banner = rec.attackSucceeded
    ? `<div class="ok"><strong>ההתקפה הצליחה</strong><p>${escapeHtml(rec.attackFactHe || "")}</p><p>${escapeHtml(rec.attackCauseHe || "")}</p></div>`
    : "";
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>${escapeHtml(meta.titleHe)}</title>
<style>
  body { font-family: sans-serif; margin: 1rem; background: #f6f7f9; }
  textarea { width: 100%; min-height: 8rem; }
  button { margin: 0.3rem 0; padding: 0.5rem 0.8rem; }
  pre { white-space: pre-wrap; background: white; padding: 0.8rem; }
  .ok { background: #e5f6e8; border: 1px solid #2e7d32; padding: 0.8rem; }
  .log div { margin: 0.2rem 0; }
  .scenario { white-space: pre-wrap; }
</style>
</head>
<body>
<h1>${escapeHtml(meta.titleHe)}</h1>
<p>שלב ההתקפה</p>
<p class="scenario">${escapeHtml(ui.blurb)}</p>
${banner}
<label for="text">Text</label>
<textarea id="text" placeholder="${escapeHtml(ui.placeholder)}"></textarea>
<button type="button" id="send">Send</button>
<h2>יומן</h2>
<div class="log" id="log"></div>
<pre id="out"></pre>
<script>
const learnerId = ${JSON.stringify(learnerId)};
const labId = ${JSON.stringify(labId)};
document.getElementById("send").addEventListener("click", async () => {
  const text = document.getElementById("text").value;
  const res = await fetch("/lab-app/" + labId + "/act?learnerId=" + encodeURIComponent(learnerId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  const data = await res.json();
  document.getElementById("out").textContent = data.output || data.errorHe || "";
  if (data.entryHe) {
    const div = document.createElement("div");
    div.textContent = data.entryHe;
    document.getElementById("log").prepend(div);
  }
  if (data.attackSucceeded) location.reload();
});
</script>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
