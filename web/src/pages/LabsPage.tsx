import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { LearnerLabState, SessionResponse, SseLabState, SseSessionClosed } from "../../../shared/api";
import { createApi } from "../api";
import { LABS, chrome, pick } from "../learner/copy";
import { LangToggle } from "../learner/LangToggle";
import { surface } from "../learner/surface";
import { useMock, useTo } from "../nav";
import { useSession } from "../session";
import { getLearnerId } from "../storage";
import { useUiLang } from "../ui-lang";

type Face = "closed" | "breached" | "patched";

function face(state: LearnerLabState | "missing"): Face {
  if (state === "completed" || state === "completed_after_solution") return "patched";
  if (state === "attack" || state === "fix") return "breached";
  return "closed";
}

export function LabsPage() {
  const mock = useMock();
  const to = useTo();
  const { lang } = useUiLang();
  const t = chrome(lang);
  const { displayName } = useSession();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const learnerId = getLearnerId();

  const load = useCallback(async () => {
    const api = createApi(mock);
    const next = await api.session();
    setSession(next);
  }, [mock]);

  useEffect(() => {
    if (!learnerId) return;
    let cancel = false;
    load().catch((reason: unknown) => {
      if (!cancel) setError(surface(lang, "llm01", reason instanceof Error ? reason.message : t.loading));
    });
    return () => {
      cancel = true;
    };
  }, [lang, learnerId, load, t.loading]);

  useEffect(() => {
    if (!learnerId) return;
    return createApi(mock).subscribe({ learnerId }, (name, data) => {
      if (name === "session_closed") {
        const event = data as SseSessionClosed;
        setSession((prev) => (prev ? { ...prev, closed: true, classCode: event.classCode || prev.classCode } : prev));
      }
      if (name === "lab_state") {
        const event = data as SseLabState;
        setSession((prev) =>
          prev
            ? { ...prev, labs: prev.labs.map((lab) => (lab.id === event.labId ? { ...lab, state: event.state } : lab)) }
            : prev,
        );
        load().catch(() => undefined);
      }
      if (name === "attack_succeeded" || name === "submission_check") load().catch(() => undefined);
    });
  }, [learnerId, load, mock]);

  if (!learnerId) {
    return (
      <div className="ln-board">
        <h1>{t.labsTitle}</h1>
        <p>{t.needJoin}</p>
        <Link className="ln-btn primary" to={to("/")}>
          {t.toJoin}
        </Link>
      </div>
    );
  }
  if (error) return <div className="ln-board"><p className="ln-error">{error}</p></div>;
  if (!session) return <div className="ln-board"><p className="ln-note">{t.loading}</p></div>;

  const byId = new Map(session.labs.map((lab) => [lab.id, lab]));
  const name = displayName || t.dash;

  return (
    <div className="ln-board">
      <div className="ln-board-head">
        <h1>{t.labsTitle}</h1>
        <LangToggle />
      </div>
      {session.closed ? <p className="ln-note">{t.closedNote}</p> : null}
      <div className="ln-grid">
        {LABS.map((copy) => {
          const live = byId.get(copy.id);
          const state = live?.state ?? "locked";
          const status = face(live ? state : "missing");
          const done = state === "completed" || state === "completed_after_solution";
          const blocked = state === "locked" || (session.closed && !done) || !live;
          const broke = status === "breached" || status === "patched" ? name : t.dash;
          const fixed = status === "patched" ? name : t.dash;
          const body = (
            <>
              <span className="ln-id" dir="ltr">
                {copy.code}
              </span>
              <h2>{pick(lang, copy.title)}</h2>
              <p>{pick(lang, copy.threat)}</p>
              <span className={`ln-status ${status}`}>
                {status === "patched" ? t.statusPatched : status === "breached" ? t.statusBreached : t.statusClosed}
              </span>
              <div className="ln-who-row">
                <span>{t.broke}</span>
                <b>{broke}</b>
                <span>{t.patched}</span>
                <b>{fixed}</b>
              </div>
            </>
          );
          if (blocked) {
            return (
              <article key={copy.id} className="ln-lab-card locked">
                {body}
              </article>
            );
          }
          return (
            <Link key={copy.id} className="ln-lab-card" to={to(`/labs/${copy.id}`)}>
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
