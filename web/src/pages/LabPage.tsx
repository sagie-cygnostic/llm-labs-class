import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  CheckItem,
  CheckStatus,
  LabDetail,
  LabSummary,
  Language,
  RunResponse,
  SseAttackSucceeded,
  SseLabState,
  SseSubmissionCheck,
} from "../../../shared/api";
import { createApi } from "../api";
import { CodeEditor } from "../components/CodeEditor";
import { fixSpec, isNewLabFile, pickServerFixFile } from "../fix/starters";
import { BREAK_BRIEF, ENTRY_BRIEF, FIX_CONTRACT, chrome, labCopy, pick } from "../learner/copy";
import { checkName, surface } from "../learner/surface";
import { useMock, useTo } from "../nav";
import { getLearnerId } from "../storage";
import { useUiLang } from "../ui-lang";
import { BreakPlay, type ActResult } from "./BreakPlay";

type Phase = "context" | "break" | "fix" | "takeaway";

function stageAllowed(lab: LabDetail, next: Phase): boolean {
  if (next === "context") return true;
  if (next === "break") return lab.state !== "locked";
  const done = lab.state === "completed" || lab.state === "completed_after_solution";
  if (next === "fix") return lab.attackSucceeded || lab.instructorSkip || lab.state === "fix" || done;
  return done;
}

function initialPhase(lab: LabDetail): Phase {
  if (stageAllowed(lab, lab.phase)) return lab.phase;
  if (lab.state === "completed" || lab.state === "completed_after_solution") return "takeaway";
  if (lab.instructorSkip || lab.state === "fix") return "fix";
  if (lab.attackSucceeded || lab.state === "attack") return "break";
  return "context";
}

function promptField(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function toolLineOf(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const calls = (value as { toolCalls?: unknown; tools?: unknown }).toolCalls ?? (value as { tools?: unknown }).tools;
  if (!Array.isArray(calls) || calls.length === 0) return null;
  return calls
    .map((call) => {
      if (!call || typeof call !== "object") return "";
      const row = call as { tool?: unknown; nm?: unknown; name?: unknown; ar?: unknown; to?: unknown };
      const name = [row.tool, row.nm, row.name].find((part) => typeof part === "string") as string | undefined;
      const arg = [row.ar, row.to].find((part) => typeof part === "string") as string | undefined;
      return [name, arg].filter(Boolean).join(" ");
    })
    .filter(Boolean)
    .join(" · ");
}


function trackTone(checks: CheckItem[], passed: boolean | null): "ok" | "mid" | "bad" {
  const ok = checks.filter((item) => item.status === "passed").length;
  const bad = checks.filter((item) => item.status === "failed").length;
  if (passed || (bad === 0 && ok === checks.length && checks.length > 0)) return "ok";
  if (ok > 0 && ok >= Math.ceil(checks.length / 2)) return "mid";
  return "bad";
}

function trackText(checks: CheckItem[], passed: boolean | null): string {
  const ok = checks.filter((item) => item.status === "passed").length;
  const total = checks.length;
  const tone = trackTone(checks, passed);
  if (tone === "ok") return "On the right track. Every case passes, including ordinary traffic that still has to work.";
  if (tone === "mid") return `On the right track: ${ok} of ${total} cases pass. The notes under the failures say what to change next. Do not undo the cases that already pass.`;
  if (ok === 0) return "Not close yet. Read what each argument can hold, then change the first failing case. Blocking every request is not a pass.";
  return `Part of the way: ${ok} of ${total} cases pass. Not close enough yet. Use the failing notes as the next edit, and keep the cases that already pass.`;
}

export function LabPage() {
  const { labId = "" } = useParams();
  const mock = useMock();
  const to = useTo();
  const { lang } = useUiLang();
  const t = chrome(lang);
  const copy = labCopy(labId);
  const api = useMemo(() => createApi(mock), [mock]);
  const [lab, setLab] = useState<LabDetail | null>(null);
  const [roster, setRoster] = useState<LabSummary[]>([]);
  const [files, setFiles] = useState<LabDetail["files"]>([]);
  const [language, setLanguage] = useState<Language>("python");
  const [phase, setPhase] = useState<Phase>("context");
  const spec = fixSpec(labId);
  const [starterCode, setStarterCode] = useState(spec?.starter ?? "");
  const [starterLab, setStarterLab] = useState(labId);
  if (starterLab !== labId) {
    setStarterLab(labId);
    setStarterCode(spec?.starter ?? "");
  }
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<RunResponse | null>(null);
  const [checks, setChecks] = useState<CheckItem[] | null>(null);
  const [checkPassed, setCheckPassed] = useState<boolean | null>(null);
  const [pendingLang, setPendingLang] = useState<Language | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const dirtyRef = useRef(false);
  const filesRef = useRef(files);
  const languageRef = useRef(language);
  const putTimer = useRef<number | null>(null);
  const checksRef = useRef<HTMLElement | null>(null);
  const firstFailRef = useRef<HTMLElement | null>(null);
  dirtyRef.current = dirty;
  filesRef.current = files;
  languageRef.current = language;

  useEffect(() => {
    if (!labId || !getLearnerId()) return;
    let cancel = false;
    setError(null);
    setChecks(null);
    setCheckPassed(null);
    setRun(null);
    api
      .lab(labId)
      .then((detail) => {
        if (cancel) return;
        setLab(detail);
        setFiles(detail.files);
        setLanguage(detail.language);
        setDirty(false);
        setPhase(initialPhase(detail));
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(surface(lang, labId, reason instanceof Error ? reason.message : t.loading));
      });
    api
      .session()
      .then((session) => {
        if (cancel) return;
        setClosed(session.closed);
        setRoster(session.labs);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [api, labId, lang, t.loading]);

  useEffect(() => {
    const learnerId = getLearnerId();
    if (!learnerId || !labId) return;
    return api.subscribe({ learnerId }, (name, data) => {
      if (name === "session_closed") setClosed(true);
      if (name === "lab_state") {
        const event = data as SseLabState;
        if (event.labId !== labId) return;
        api
          .lab(labId)
          .then((detail) => {
            if (dirtyRef.current) setLab({ ...detail, files: filesRef.current, language: languageRef.current });
            else {
              setLab(detail);
              setFiles(detail.files);
              setLanguage(detail.language);
            }
            if (detail.instructorSkip) setPhase("fix");
          })
          .catch(() => undefined);
      }
      if (name === "attack_succeeded") {
        const event = data as SseAttackSucceeded;
        if (event.labId !== labId) return;
        setLab((prev) => {
          if (!prev) return prev;
          const done = prev.state === "completed" || prev.state === "completed_after_solution";
          return {
            ...prev,
            attackSucceeded: true,
            attackFactHe: event.factHe,
            attackCauseHe: event.causeHe,
            state: done ? prev.state : "fix",
          };
        });
      }
      if (name === "submission_check") {
        const event = data as SseSubmissionCheck;
        if (event.labId !== labId) return;
        const fn = fixSpec(labId)?.fn;
        if (!fn || !pickServerFixFile(filesRef.current, fn)) return;
        setChecks(event.checks);
        if (event.done) setCheckPassed(event.passed);
      }
    });
  }, [api, labId]);

  useEffect(() => {
    return () => {
      if (putTimer.current) window.clearTimeout(putTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!checks || checks.length === 0) return;
    const target = firstFailRef.current ?? checksRef.current;
    target?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [checks]);

  useEffect(() => {
    if (phase !== "takeaway" || !labId) return;
    let cancel = false;
    api.completion(labId).catch((reason: unknown) => {
      if (!cancel) setError(surface(lang, labId, reason instanceof Error ? reason.message : t.loading));
    });
    return () => {
      cancel = true;
    };
  }, [api, labId, lang, phase, t.loading]);

  function message(reason: unknown, fallback: string): string {
    return surface(lang, labId, reason instanceof Error ? reason.message : fallback);
  }

  function schedulePut(path: string, content: string, langCode: Language) {
    if (putTimer.current) window.clearTimeout(putTimer.current);
    putTimer.current = window.setTimeout(() => {
      api.putFile(labId, { path, content, language: langCode }).then(() => setDirty(false)).catch((reason: unknown) => setError(message(reason, t.loading)));
    }, 500);
  }

  async function applyLanguage(next: Language) {
    setBusy(true);
    setError(null);
    try {
      const response = await api.setLanguage(labId, { language: next });
      setLanguage(response.language);
      setFiles(response.files);
      setDirty(false);
      setLab((prev) => (prev ? { ...prev, language: response.language, files: response.files } : prev));
    } catch (reason: unknown) {
      setError(message(reason, t.loading));
    } finally {
      setBusy(false);
      setPendingLang(null);
    }
  }

  function serverFixFile() {
    return spec ? pickServerFixFile(files, spec.fn) : null;
  }

  function onEdit(content: string) {
    const file = serverFixFile();
    if (!file) {
      setStarterCode(content);
      return;
    }
    if (!file.editable) return;
    setFiles(files.map((item) => (item.path === file.path ? { ...item, content } : item)));
    setDirty(true);
    schedulePut(file.path, content, language);
  }

  async function onRun() {
    if (!serverFixFile()) return;
    setBusy(true);
    setError(null);
    try {
      setRun(await api.run(labId, { language, files }));
    } catch (reason: unknown) {
      setError(message(reason, t.loading));
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    setConfirmReset(false);
    if (spec && !serverFixFile()) {
      setStarterCode(spec.starter);
      setDirty(false);
      setRun(null);
      setChecks(null);
      setCheckPassed(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await api.reset(labId, { language });
      setFiles(response.files);
      setDirty(false);
    } catch (reason: unknown) {
      setError(message(reason, t.loading));
    } finally {
      setBusy(false);
    }
  }

  function gradedFiles() {
    if (serverFixFile()) return files;
    if (!spec) return null;
    return [{ path: spec.path, content: starterCode, editable: true }];
  }

  async function onCheck() {
    const submitted = gradedFiles();
    if (!submitted) return;
    setBusy(true);
    setError(null);
    setChecks(null);
    setCheckPassed(null);
    try {
      const response = await api.check(labId, { language, files: submitted });
      setChecks(response.checks);
      setCheckPassed(response.passed);
      try {
        const again = await api.submission(response.submissionId);
        setChecks(again.checks);
        setCheckPassed(again.passed);
      } catch (reason: unknown) {
        setError(message(reason, t.loading));
      }
    } catch (reason: unknown) {
      setError(message(reason, t.loading));
    } finally {
      setBusy(false);
    }
  }

  async function onHint() {
    setBusy(true);
    setError(null);
    try {
      const hint = await api.nextHint(labId);
      setLab((prev) => {
        if (!prev) return prev;
        const hints = [...prev.hints.filter((item) => item.level !== hint.level), hint].sort((a, b) => a.level - b.level);
        return { ...prev, hints, hintsOpened: hint.level };
      });
    } catch (reason: unknown) {
      setError(message(reason, t.loading));
    } finally {
      setBusy(false);
    }
  }

  async function onAct(text: string, ui?: Record<string, unknown>): Promise<ActResult | null> {
    const learnerId = getLearnerId();
    if (!learnerId) return null;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/lab-app/${labId}/act?learnerId=${encodeURIComponent(learnerId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ui ? { text, ui } : { text }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        output?: unknown;
        errorHe?: unknown;
        attackSucceeded?: boolean;
        received?: unknown;
        prompt?: unknown;
        modelInput?: unknown;
        toolCalls?: unknown;
      };
      const rawOut = data.ok ? (typeof data.output === "string" ? data.output : "") : typeof data.errorHe === "string" ? data.errorHe : "";
      const received = promptField(data.received) ?? promptField(data.prompt) ?? promptField(data.modelInput) ?? "";
      if (data.attackSucceeded) {
        setLab((prev) => {
          if (!prev) return prev;
          const done = prev.state === "completed" || prev.state === "completed_after_solution";
          return { ...prev, attackSucceeded: true, state: done ? prev.state : "fix" };
        });
      }
      const parsedTools = toolLineOf(data) || toolLineOf(typeof data.output === "object" ? data.output : null);
      return {
        output: surface(lang, labId, rawOut),
        received,
        attackSucceeded: !!data.attackSucceeded,
        toolLine: parsedTools ? surface(lang, labId, parsedTools) : null,
      };
    } catch (reason: unknown) {
      setError(message(reason, t.loading));
      return null;
    } finally {
      setBusy(false);
    }
  }

  if (!getLearnerId()) {
    return (
      <div className="ln-board">
        <p>{t.needJoin}</p>
        <Link className="ln-btn primary" to={to("/")}>
          {t.toJoin}
        </Link>
      </div>
    );
  }
  if (!copy) return <div className="ln-board"><p className="ln-error">{labId}</p></div>;
  if (error && !lab) return <div className="ln-board"><p className="ln-error">{error}</p></div>;
  if (!lab) return <div className="ln-board"><p className="ln-note">{t.loading}</p></div>;

  const done = lab.state === "completed" || lab.state === "completed_after_solution" || checkPassed === true;
  const readOnly = closed && !done && phase !== "takeaway";
  const won = lab.attackSucceeded;
  const fixOpen = won || lab.instructorSkip || lab.state === "fix" || done;
  const breakOpen = lab.state !== "locked" && !readOnly;
  const serverFile = spec ? pickServerFixFile(files, spec.fn) : null;
  const editorPath = serverFile ? serverFile.path : (spec?.path ?? "");
  const editorValue = serverFile ? serverFile.content : starterCode;
  const editorLanguage = serverFile ? language : "javascript";
  const serverFixFiles = spec ? files.filter((item) => isNewLabFile(item.content, spec.fn)) : [];
  const next = roster[roster.findIndex((item) => item.id === lab.id) + 1];
  const stages: { id: Phase; label: string; open: boolean }[] = [
    { id: "context", label: t.context, open: true },
    { id: "break", label: t.break, open: breakOpen || phase === "break" },
    { id: "fix", label: t.fix, open: fixOpen },
    { id: "takeaway", label: t.takeaway, open: done },
  ];

  function go(nextPhase: Phase) {
    if (nextPhase === "break" && !breakOpen) return;
    if (nextPhase === "fix" && !fixOpen) return;
    if (nextPhase === "takeaway" && !done) return;
    const previous = phase;
    setPhase(nextPhase);
    void api.setPhase(labId, nextPhase).then(
      () => setLab((prev) => (prev ? { ...prev, phase: nextPhase } : prev)),
      (reason: unknown) => {
        setPhase(previous);
        setError(message(reason, t.loading));
      },
    );
  }

  const bar = phase === "context" ? copy.context.bar : phase === "break" ? copy.break.bar : phase === "fix" ? copy.fix.bar : copy.takeaway.bar;
  const statusWord = (status: CheckStatus) => (status === "passed" ? t.passed : status === "failed" ? t.failed : status === "running" ? t.running : t.pending);

  return (
    <div className={phase === "fix" ? "ln-lab ln-wide ln-stage-fix" : phase === "break" ? "ln-lab ln-wide" : "ln-lab"} dir="ltr">
      <header className="ln-top">
        <Link className="ln-btn" to={to("/labs")}>
          {t.back}
        </Link>
        <h1>{pick(lang, copy.title)}</h1>
        <nav className="ln-stages" aria-label={t.stages}>
          {stages.map((stage) => (
            <button key={stage.id} type="button" className={phase === stage.id ? "on" : ""} disabled={!stage.open} onClick={() => go(stage.id)}>
              {stage.label}
            </button>
          ))}
        </nav>
      </header>
      <div className="ln-task">
        <div>
          <span className="ln-k">{t.do}</span>
          <p>{pick(lang, bar.do)}</p>
        </div>
        <div>
          <span className="ln-k">{t.who}</span>
          <p>{pick(lang, bar.who)}</p>
        </div>
        <div>
          <span className="ln-k">{t.goal}</span>
          <p>{pick(lang, bar.goal)}</p>
        </div>
      </div>
      {error ? <p className="ln-error">{error}</p> : null}
      {readOnly ? <p className="ln-note">{t.sessionClosed}</p> : null}
      {lab.instructorSkip ? <p className="ln-note">{t.instructorSkip}</p> : null}

      {phase === "context" ? (
        <section className="ln-prose">
          {copy.context.lead.map((line) => (
            <p key={line.en}>{pick(lang, line)}</p>
          ))}
          {ENTRY_BRIEF[labId] ? (
            <div className="ln-brief">
              <article>
                <h2>What the vulnerability is</h2>
                <p>{ENTRY_BRIEF[labId].vuln}</p>
              </article>
              <article>
                <h2>How to defend against it</h2>
                <p>{ENTRY_BRIEF[labId].defend}</p>
              </article>
              <article>
                <h2>An example</h2>
                <p>{ENTRY_BRIEF[labId].example}</p>
              </article>
            </div>
          ) : null}
          <article className="ln-app">
            <h2>{pick(lang, copy.context.appTitle)}</h2>
            <p>{pick(lang, copy.context.app)}</p>
          </article>
          <details className="ln-more">
            <summary>{t.more}</summary>
            <p>{pick(lang, copy.context.more)}</p>
          </details>
          {breakOpen ? (
            <button type="button" className="ln-btn primary" onClick={() => go("break")}>
              {t.toBreak}
            </button>
          ) : null}
        </section>
      ) : null}

      {phase === "break" ? (
        <>
          {BREAK_BRIEF[labId] ? (
            <section className="ln-break-brief" dir="ltr">
              <article>
                <h2>What you are breaking</h2>
                <p>{BREAK_BRIEF[labId].vuln}</p>
              </article>
              <article>
                <h2>Your task</h2>
                <p>{BREAK_BRIEF[labId].task}</p>
              </article>
            </section>
          ) : null}
          <BreakPlay
            key={lab.id}
            lab={copy}
            lang={lang}
            hints={lab.hints}
            busy={busy || readOnly}
            onHint={() => void onHint()}
            onAct={onAct}
          />
          {won ? (
            <button type="button" className="ln-btn primary" onClick={() => go("fix")}>
              {t.toFix}
            </button>
          ) : null}
        </>
      ) : null}

      {phase === "fix" ? (
        <section className="ln-fix">
          <p className="ln-rules">{pick(lang, copy.fix.rules)}</p>
          <details className="ln-more">
            <summary>Why not in the prompt</summary>
            <p>{pick(lang, copy.fix.why)}</p>
          </details>
          <div className="ln-fix-layout">
          <div className="ln-editor">
                <div className="ln-editor-bar">
                  <span className="ln-mono" dir="ltr">
                    {editorPath || t.noFiles}
                  </span>
                  <div className="ln-row" role="group" aria-label={t.codeLang}>
                    {(["python", "typescript", "pseudocode"] as Language[]).map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={item === language ? "ln-btn on" : "ln-btn"}
                        disabled={busy || readOnly}
                        onClick={() => {
                          if (item === language) return;
                          if (dirty) setPendingLang(item);
                          else void applyLanguage(item);
                        }}
                      >
                        {item === "pseudocode" ? "Pseudocode" : item === "python" ? "Python" : "TypeScript"}
                      </button>
                    ))}
                  </div>
                </div>
                {editorPath ? (
                  <CodeEditor path={editorPath} value={editorValue} language={editorLanguage} readOnly={serverFile ? !serverFile.editable || readOnly : readOnly} onChange={onEdit} />
                ) : (
                  <p className="ln-note">{t.noFiles}</p>
                )}
              </div>
              {FIX_CONTRACT[labId] ? (
                <aside className="ln-contract" aria-label="What this code can hold">
                  <h2>What you are editing</h2>
                  <p className="ln-mono" dir="ltr">{FIX_CONTRACT[labId].signature}</p>
                  {FIX_CONTRACT[labId].keep ? <p>{FIX_CONTRACT[labId].keep}</p> : null}
                  {FIX_CONTRACT[labId].fields.map((field) => (
                    <div key={field.name} className="ln-field-row">
                      <strong className="ln-mono" dir="ltr">{field.name}</strong>
                      <p>{field.about}</p>
                    </div>
                  ))}
                  <ul>
                    {FIX_CONTRACT[labId].rules.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                  {FIX_CONTRACT[labId].note ? <p className="ln-note">{FIX_CONTRACT[labId].note}</p> : null}
                </aside>
              ) : null}
              </div>
              {serverFixFiles.length > 1 ? (
                <div className="ln-row">
                  {serverFixFiles.map((item) => (
                    <button key={item.path} type="button" className={serverFile && item.path === serverFile.path ? "ln-btn on" : "ln-btn"} disabled>
                      <span dir="ltr">{item.path}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="ln-row">
                <button type="button" className="ln-btn primary" disabled={busy || readOnly || !editorPath} onClick={() => void onCheck()}>
                  {t.runTests}
                </button>
                <button type="button" className="ln-btn" disabled={busy || readOnly || !editorPath} onClick={() => setConfirmReset(true)}>
                  {t.reset}
                </button>
                <button type="button" className="ln-btn" disabled={busy || readOnly || !serverFile} onClick={() => void onRun()}>
                  {t.run}
                </button>
              </div>
              {run ? (
                <div className="ln-side">
                  <span className="ln-k">{t.runOut}</span>
                  <p>{run.errorHebrew ? surface(lang, labId, run.errorHebrew) : run.ok ? t.passed : t.failed}</p>
                  <pre className="ln-code" dir="ltr">
                    {surface(lang, labId, run.output)}
                  </pre>
                </div>
              ) : null}
            <aside className="ln-checks" ref={checksRef}>
              <p className="ln-k">{t.notAPass}</p>
              {busy && !checks ? <p className="ln-note">{t.checking}</p> : null}
              {checks && checks.length > 0 ? <p className={`ln-track ${trackTone(checks, checkPassed)}`}>{trackText(checks, checkPassed)}</p> : null}
              {checks?.map((item, index) => {
                const failed = item.status === "failed";
                const first = failed && checks.findIndex((row) => row.status === "failed") === index;
                const hint = failed ? surface(lang, labId, item.feedbackHe) : "";
                return (
                  <article key={item.id} className={`ln-check ${item.status}`} ref={first ? firstFailRef : undefined}>
                    <span className="st">{statusWord(item.status)}</span>
                    <span className="ln-check-name">{checkName(lang, labId, item.id, item.nameHe)}</span>
                    {failed ? <p className="ln-check-note">{hint && !hint.startsWith("The server sent text") ? `Next: ${hint}` : "Next: compare this case with the contract beside the editor. You are missing a condition, or you blocked a case that should pass."}</p> : null}
                  </article>
                );
              })}
              {checkPassed ? (
                <button type="button" className="ln-btn primary" onClick={() => go("takeaway")}>
                  {t.takeaway}
                </button>
              ) : null}
            </aside>
        </section>
      ) : null}

      {phase === "takeaway" ? (
        <section>
          <div className="ln-take">
            {copy.takeaway.cards.map((card, index) => (
              <article key={card.en}>
                {index === copy.takeaway.cards.length - 1 ? (
                  <ul>
                    {pick(lang, card)
                      .split("\n")
                      .slice(0, 4)
                      .map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                  </ul>
                ) : (
                  <p>{pick(lang, card)}</p>
                )}
              </article>
            ))}
          </div>
          <div className="ln-row">
            {next ? (
              <Link className="ln-btn primary" to={to(`/labs/${next.id}`)}>
                {t.nextLab}
              </Link>
            ) : (
              <Link className="ln-btn primary" to={to("/labs")}>
                {t.toLabs}
              </Link>
            )}
          </div>
        </section>
      ) : null}

      {pendingLang ? (
        <Dialog title={t.switchTitle} body={t.switchBody} confirm={t.switchYes} cancel={t.cancel} onConfirm={() => void applyLanguage(pendingLang)} onCancel={() => setPendingLang(null)} />
      ) : null}
      {confirmReset ? (
        <Dialog title={t.resetTitle} body={t.resetBody} confirm={t.resetYes} cancel={t.cancel} onConfirm={() => void onReset()} onCancel={() => setConfirmReset(false)} />
      ) : null}
    </div>
  );
}

function Dialog({
  title,
  body,
  confirm,
  cancel,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirm: string;
  cancel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="ln-modal" role="presentation">
      <div className="ln-card" role="dialog" aria-modal="true">
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="ln-row">
          <button type="button" className="ln-btn primary" onClick={onConfirm}>
            {confirm}
          </button>
          <button type="button" className="ln-btn" onClick={onCancel}>
            {cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
