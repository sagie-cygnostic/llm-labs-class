import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Hint } from "../../../shared/api";
import { labHint } from "../lab-copy";
import { surface } from "../learner/surface";
import { BASE_INDEX, HR_DOCS, PR_LINES, chrome, pick, type LabCopy } from "../learner/copy";
import type { UiLang } from "../i18n";

export type ActResult = {
  output: string;
  received: string;
  attackSucceeded: boolean;
  toolLine: string | null;
};

export function BreakPlay({
  lab,
  lang,
  hints,
  busy,
  onHint,
  onAct,
}: {
  lab: LabCopy;
  lang: UiLang;
  hints: Hint[];
  busy: boolean;
  onHint: () => void;
  onAct: (text: string, ui?: Record<string, unknown>) => Promise<ActResult | null>;
}) {
  const t = chrome(lang);
  const composeRef = useRef<HTMLTextAreaElement | null>(null);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<{ role: "learner" | "model"; text: string }[]>([]);
  const [received, setReceived] = useState("");
  const [typed, setTyped] = useState("");
  const [toolLine, setToolLine] = useState<string | null>(null);
  const [preview, setPreview] = useState("");
  const [hits, setHits] = useState<{ id: string; title: string; body: string; leaked: boolean }[]>([]);
  const [flags, setFlags] = useState<boolean[]>(() => PR_LINES.map(() => false));
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [samples, setSamples] = useState<{ q: string; a: string }[]>([]);
  const [trained, setTrained] = useState(false);
  const [payload, setPayload] = useState<string | null>(null);
  const [ask, setAsk] = useState("");
  const [asked, setAsked] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mailOut, setMailOut] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docBody, setDocBody] = useState("");
  const [mine, setMine] = useState<{ title: string; body: string }[]>([]);
  const [vellum, setVellum] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [bill, setBill] = useState(0);

  useEffect(() => {
    const el = composeRef.current;
    if (!el) return;
    el.style.blockSize = "auto";
    const line = Number.parseFloat(getComputedStyle(el).lineHeight) || 24;
    const next = Math.min(Math.max(el.scrollHeight, line * 2), line * 6);
    el.style.blockSize = `${next}px`;
  }, [draft]);

  function onComposeKey(event: KeyboardEvent<HTMLTextAreaElement>, send: () => void) {
    if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    send();
  }

  async function pushAct(text: string, asLearner: boolean, ui?: Record<string, unknown>) {
    const result = await onAct(text, ui);
    if (!result) return;
    setReceived(result.received);
    setTyped(text);
    setToolLine(result.toolLine);
    if (asLearner) setTurns((prev) => [...prev, { role: "learner", text }, { role: "model", text: result.output }]);
    return result;
  }

  function sendChat() {
    const text = draft;
    if (!text.trim() || busy) return;
    setDraft("");
    if (kind === "retrieve") {
      const terms = text.toLowerCase().split(/[^a-z0-9\u0590-\u05FF]+/).filter((word) => word.length > 2);
      const next = HR_DOCS.map((doc) => {
        const title = pick(lang, doc.title);
        const bodyText = pick(lang, doc.body);
        const hay = `${title} ${bodyText}`.toLowerCase();
        const score = terms.reduce((n, word) => n + (hay.includes(word) ? 1 : 0), 0);
        const leaked = doc.vis === "restricted" || (doc.vis === "private" && doc.owner !== "dana");
        return { id: doc.id, title, body: bodyText, leaked, score };
      })
        .filter((row) => row.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, 4);
      setHits(next);
    }
    void pushAct(text, true);
  }

  const kind = lab.break.kind;
  return (
    <div className="ln-prose">
      {kind === "chat" || kind === "retrieve" ? (
        <div className={kind === "retrieve" ? "ln-split" : undefined}>
          <div className="ln-chat">
            <div className="ln-log" aria-live="polite">
              {lab.break.opener ? <div className="ln-bubble model">{pick(lang, lab.break.opener)}</div> : null}
              {turns.map((turn, index) => (
                <div key={index} className={`ln-bubble ${turn.role}`}>
                  {turn.text}
                </div>
              ))}
            </div>
            <div className="ln-compose">
              <textarea
                ref={composeRef}
                className="ln-field"
                rows={2}
                value={draft}
                placeholder={lab.break.placeholder ? pick(lang, lab.break.placeholder) : ""}
                aria-label={t.send}
                disabled={busy}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => onComposeKey(event, sendChat)}
              />
              <button type="button" className="ln-btn primary" disabled={busy || !draft.trim()} onClick={sendChat}>
                {t.send}
              </button>
            </div>
            {toolLine ? (
              <p className="ln-tool">
                {t.toolLine}: {toolLine}
              </p>
            ) : null}
          </div>
          {kind === "retrieve" ? (
            <aside className="ln-side" aria-label={t.retrieved}>
              <span className="ln-k">{t.retrieved}</span>
              {hits.length === 0 ? <p className="ln-note">{t.empty}</p> : null}
              {hits.map((hit) => (
                <div key={hit.id} className="ln-hit">
                  <span className={hit.leaked ? "stone" : "ok"}>{hit.leaked ? t.untrusted : t.trusted}</span>
                  <strong>{hit.title}</strong>
                  <span>{hit.body}</span>
                </div>
              ))}
            </aside>
          ) : null}
        </div>
      ) : null}

      {kind === "preview" ? (
        <div className="ln-split">
          <div className="ln-compose">
            <textarea
              className="ln-field"
              value={draft}
              placeholder={lab.break.placeholder ? pick(lang, lab.break.placeholder) : ""}
              aria-label={t.body}
              disabled={busy}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              type="button"
              className="ln-btn primary"
              disabled={busy || !draft.trim()}
              onClick={() => {
                const text = draft;
                setDraft("");
                void (async () => {
                  const result = await pushAct(text, false);
                  if (!result) return;
                  setPreview(result.output);
                })();
              }}
            >
              {t.send}
            </button>
          </div>
          <aside className="ln-preview" aria-label={t.preview}>
            <span className="ln-k">{t.preview}</span>
            <pre>{preview || t.empty}</pre>
          </aside>
        </div>
      ) : null}

      {kind === "review" ? (
        <div className="ln-pr" dir="ltr">
          <span className="ln-k">{t.prTitle}</span>
          {PR_LINES.map((line, index) => (
            <label key={line.text} className="ln-pr-row" dir="ltr">
              <input
                type="checkbox"
                checked={flags[index]}
                onChange={() => setFlags((prev) => prev.map((on, i) => (i === index ? !on : on)))}
              />
              <span className="ln-pr-body">
                <code dir="ltr">{line.text}</code>
                <span className="ln-line-why" dir="ltr">{pick(lang, line.why)}</span>
              </span>
            </label>
          ))}
          <button
            type="button"
            className="ln-btn primary"
            disabled={busy}
            onClick={() => {
              let missed = 0;
              let falseFlags = 0;
              const picked: string[] = [];
              PR_LINES.forEach((line, index) => {
                if (flags[index]) picked.push(line.text);
                if (line.bad && !flags[index]) missed += 1;
                if (!line.bad && flags[index]) falseFlags += 1;
              });
              const localOk = missed === 0 && falseFlags <= 1 && picked.length > 0;
              void (async () => {
                const result = picked.length ? await pushAct(picked.join("\n"), false) : null;
                const ok = localOk && !!result?.attackSucceeded;
                setReviewNote(
                  ok
                    ? t.reviewPass
                    : `${t.reviewFail} ${t.missed}: ${missed}. ${t.falseFlags}: ${falseFlags}.`,
                );
              })();
            }}
          >
            {t.submitFlags}
          </button>
          {reviewNote ? <p>{reviewNote}</p> : null}
        </div>
      ) : null}

      {kind === "poison" ? (
        <div className="ln-side">
          <label className="ln-label" htmlFor="corr-q">
            {t.question}
          </label>
          <input id="corr-q" className="ln-field" value={q} onChange={(event) => setQ(event.target.value)} />
          <label className="ln-label" htmlFor="corr-a">
            {t.answer}
          </label>
          <input id="corr-a" className="ln-field" value={a} onChange={(event) => setA(event.target.value)} />
          <div className="ln-row">
            <button
              type="button"
              className="ln-btn primary"
              disabled={busy || !q.trim() || !a.trim()}
              onClick={() => {
                const next = { q: q.trim(), a: a.trim() };
                setSamples((prev) => [...prev, next]);
                setTrained(false);
                setPayload(null);
                setQ("");
                setA("");
                void pushAct(`${next.q}\n${next.a}`, false, { op: "correction", q: next.q, a: next.a });
              }}
            >
              {t.submitCorrection}
            </button>
            <button
              type="button"
              className="ln-btn"
              disabled={busy || samples.length === 0}
              onClick={() => {
                const counts = new Map<string, number>();
                for (const sample of samples) counts.set(sample.a, (counts.get(sample.a) ?? 0) + 1);
                let found: string | null = null;
                for (const [answer, count] of counts) {
                  if (count >= 3 && /https?:\/\/\S+/i.test(answer)) found = answer;
                }
                setTrained(true);
                setPayload(found);
                void pushAct(samples.map((sample) => `${sample.q}\n${sample.a}`).join("\n"), false, { op: "finetune", samples });
              }}
            >
              {t.fineTune}
            </button>
          </div>
          <p className="ln-note">{trained ? t.trained : t.notTrained}</p>
          <span className="ln-k">{t.corrections}</span>
          {samples.length === 0 ? <p className="ln-note">{t.empty}</p> : null}
          {samples.map((sample, index) => (
            <p key={index}>
              {sample.q} — {sample.a}
            </p>
          ))}
          <label className="ln-label" htmlFor="ask-q">
            {t.ask}
          </label>
          <input id="ask-q" className="ln-field" value={ask} onChange={(event) => setAsk(event.target.value)} />
          <button
            type="button"
            className="ln-btn primary"
            disabled={busy || !ask.trim()}
            onClick={() => {
              const question = ask.trim();
              const normal = "Reset the VPN from the internal IT portal.";
              void (async () => {
                const result = await pushAct(question, false, { op: "ask", question });
                setAsked(result?.attackSucceeded ? payload || result.output || normal : normal);
              })();
            }}
          >
            {t.ask}
          </button>
          {asked ? (
            <p>
              <span className="ln-k">{t.vpnAnswer}</span>
              {asked}
            </p>
          ) : null}
        </div>
      ) : null}

      {kind === "email" ? (
        <div className="ln-side">
          <label className="ln-label" htmlFor="mail-subject">
            {t.subject}
          </label>
          <input id="mail-subject" className="ln-field" value={subject} onChange={(event) => setSubject(event.target.value)} />
          <label className="ln-label" htmlFor="mail-body">
            {t.body}
          </label>
          <textarea id="mail-body" className="ln-field" value={body} onChange={(event) => setBody(event.target.value)} />
          <button
            type="button"
            className="ln-btn primary"
            disabled={busy || !subject.trim() || !body.trim()}
            onClick={() => {
              const text = `${subject.trim()}\n${body.trim()}`;
              void (async () => {
                const result = await pushAct(text, false);
                if (result) setMailOut(result.output);
              })();
            }}
          >
            {t.deliver}
          </button>
          {mailOut ? <div className="ln-bubble model">{mailOut}</div> : null}
          {toolLine ? (
            <p className="ln-tool">
              {t.toolLine}: {toolLine}
            </p>
          ) : null}
        </div>
      ) : null}

      {kind === "publish" ? (
        <div className="ln-split">
          <div className="ln-side">
            <label className="ln-label" htmlFor="doc-title">
              {t.docTitle}
            </label>
            <input id="doc-title" className="ln-field" value={docTitle} onChange={(event) => setDocTitle(event.target.value)} />
            <label className="ln-label" htmlFor="doc-body">
              {t.docBody}
            </label>
            <textarea id="doc-body" className="ln-field" value={docBody} onChange={(event) => setDocBody(event.target.value)} />
            <button
              type="button"
              className="ln-btn primary"
              disabled={busy || !docTitle.trim() || !docBody.trim()}
              onClick={() => {
                const next = { title: docTitle.trim(), body: docBody.trim() };
                setMine((prev) => [...prev, next]);
                setDocTitle("");
                setDocBody("");
                void pushAct(`${next.title}\n${next.body}`, false, { op: "publish", title: next.title, body: next.body });
              }}
            >
              {t.publish}
            </button>
            <label className="ln-label" htmlFor="vellum-q">
              {t.ask}
            </label>
            <input id="vellum-q" className="ln-field" value={ask} onChange={(event) => setAsk(event.target.value)} />
            <button
              type="button"
              className="ln-btn primary"
              disabled={busy || !ask.trim()}
              onClick={() => {
                const question = ask.trim();
                const docs = [
                  ...BASE_INDEX.map((doc) => ({ title: pick(lang, doc.title), body: pick(lang, doc.body), mine: false })),
                  ...mine.map((doc) => ({ ...doc, mine: true })),
                ];
                const terms = question.toLowerCase().split(/[^a-z0-9\u0590-\u05FF]+/).filter((word) => word.length > 2);
                const ranked = docs
                  .map((doc) => {
                    const hay = `${doc.title} ${doc.body}`.toLowerCase();
                    const score = terms.reduce((n, word) => n + (hay.includes(word) ? 1 : 0), 0);
                    return { ...doc, score };
                  })
                  .sort((left, right) => right.score - left.score);
                const top = ranked[0];
                setVellum(top && top.score > 0 ? top.body : t.empty);
                void pushAct(question, false, { op: "ask", question, docs });
              }}
            >
              {t.ask}
            </button>
            {vellum ? (
              <p>
                <span className="ln-k">{t.vellumAnswer}</span>
                {vellum}
              </p>
            ) : null}
          </div>
          <aside className="ln-side">
            <span className="ln-k">{t.index}</span>
            {BASE_INDEX.map((doc) => (
              <p key={doc.id}>{pick(lang, doc.title)}</p>
            ))}
            {mine.map((doc, index) => (
              <p key={index}>
                {t.published}: {doc.title}
              </p>
            ))}
          </aside>
        </div>
      ) : null}

      {kind === "replay" ? (
        <div className="ln-chat">
          <p className="ln-bill">
            {t.bill}: ${bill}
          </p>
          <textarea
            className="ln-field"
            value={draft}
            placeholder={lab.break.placeholder ? pick(lang, lab.break.placeholder) : ""}
            aria-label={t.send}
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="ln-row">
            <button
              type="button"
              className="ln-btn primary"
              disabled={busy || !draft.trim()}
              onClick={() => {
                const text = draft;
                const cost = Math.min(480, 40 + Math.ceil(text.length / 2));
                setSent(text);
                setBill(cost);
                void pushAct(text, true, { op: "send" });
              }}
            >
              {t.send}
            </button>
            <button
              type="button"
              className="ln-btn"
              disabled={busy || !sent}
              onClick={() => {
                if (!sent) return;
                const cost = Math.min(480, 40 + Math.ceil(sent.length / 2));
                const next = bill + cost;
                setBill(next);
                void pushAct(sent, false, { op: "replay" });
              }}
            >
              {t.replay}
            </button>
          </div>
          {!sent ? <p className="ln-note">{t.replayNeed}</p> : null}
          {toolLine ? (
            <p className="ln-tool">
              {t.toolLine}: {toolLine}
            </p>
          ) : null}
        </div>
      ) : null}

      <details className="ln-more">
        <summary>{t.received}</summary>
        {!received && !typed ? <p>{t.nothingYet}</p> : <PromptParts labId={lab.id} lang={lang} received={received} typed={typed} trusted={t.trusted} untrusted={t.untrusted} />}
      </details>

      <div className="ln-row">
        <button type="button" className="ln-btn" disabled={busy || hints.length >= 3} onClick={onHint}>
          {t.hint}
        </button>
      </div>
      {hints.map((hint) => (
        <p key={hint.level}>{surface(lang, lab.id, labHint(lang, lab.id, hint.level, hint.textHe))}</p>
      ))}
    </div>
  );
}

function PromptParts({
  labId,
  lang,
  received,
  typed,
  trusted,
  untrusted,
}: {
  labId: string;
  lang: UiLang;
  received: string;
  typed: string;
  trusted: string;
  untrusted: string;
}) {
  const idx = typed && received.includes(typed) ? received.indexOf(typed) : -1;
  const trustedText = idx >= 0 ? `${received.slice(0, idx)}${received.slice(idx + typed.length)}`.trim() : received;
  const untrustedText = idx >= 0 ? typed : typed && !received ? typed : idx < 0 && typed && received !== typed ? typed : "";
  const shownTrusted = surface(lang, labId, trustedText);
  return (
    <>
      {shownTrusted ? (
        <div className="ln-trust">
          <span className="ln-k">{trusted}</span>
          <pre dir="ltr">{shownTrusted}</pre>
        </div>
      ) : null}
      {untrustedText ? (
        <div className="ln-untrust">
          <span className="ln-k">{untrusted}</span>
          <pre>{untrustedText}</pre>
        </div>
      ) : null}
    </>
  );
}
