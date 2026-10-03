import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import type { LabSummary } from "../../../shared/api";
import { createApi } from "../api";
import { labText } from "../lab-copy";
import { useMock, useTo } from "../nav";
import { useSession } from "../session";
import { getLearnerId } from "../storage";
import { useUiLang } from "../ui-lang";

export function Shell() {
  const location = useLocation();
  const teach = location.pathname === "/teach" || location.pathname.startsWith("/teach/");
  if (teach) return <TeachShell />;
  return (
    <div className="learn">
      <Outlet />
    </div>
  );
}

function TeachShell() {
  const to = useTo();
  const mock = useMock();
  const { displayName } = useSession();
  const location = useLocation();
  const { lang, copy, setLang } = useUiLang();
  const project = /\/teach\/[^/]+\/project$/.test(location.pathname);
  const learnerRoute = location.pathname === "/labs" || location.pathname.startsWith("/labs/");
  const currentLab = location.pathname.match(/^\/labs\/([^/]+)/)?.[1] ?? "";
  const [labs, setLabs] = useState<LabSummary[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    if (!learnerRoute || !getLearnerId()) {
      setLabs([]);
      setProgress(null);
      return;
    }
    let cancel = false;
    createApi(mock)
      .session()
      .then((session) => {
        if (cancel) return;
        setLabs(session.labs);
        setProgress({ done: session.progress.fixesPassed, total: session.labs.length });
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [learnerRoute, location.pathname, mock]);

  const showRail = learnerRoute && labs.length > 0;

  return (
    <>
      <header className="topbar">
        <Link className="brand" to={to(project ? "/teach" : "/")}>
          Prompt <span className="amp">&amp;</span> Patch
        </Link>
        <span className="progress-count" aria-label={copy.meterTitle}>
          {progress ? `${progress.done}/${progress.total}` : ""}
        </span>
        <div className="top-side">
          {displayName ? <span className="who">{displayName}</span> : null}
          {mock ? <span className="who">{copy.mock}</span> : null}
          <nav className="nav">
            {project ? (
              <Link to={to("/teach")}>{copy.backBoard}</Link>
            ) : (
              <>
                <Link to={to("/labs")}>{copy.labs}</Link>
                <Link to={to("/resume")}>{copy.resume}</Link>
                <Link to={to("/teach")}>{copy.teach}</Link>
              </>
            )}
          </nav>
          <div className="lang-toggle" role="group" aria-label={copy.langLabel}>
            <button type="button" className={lang === "he" ? "on" : ""} aria-pressed={lang === "he"} onClick={() => setLang("he")}>
              {lang === "en" ? "HE" : "עב"}
            </button>
            <button type="button" className={lang === "en" ? "on" : ""} aria-pressed={lang === "en"} onClick={() => setLang("en")}>
              EN
            </button>
          </div>
        </div>
      </header>
      <div className={showRail ? "learner-shell" : "plain-shell"}>
        {showRail ? (
          <aside className="rail" aria-label={copy.labs}>
            <ul>
              {labs.map((lab) => (
                <li key={lab.id}>
                  <Link to={to(`/labs/${lab.id}`)} className={currentLab === lab.id ? "on" : ""}>
                    <span className={`lamp ${lab.state}`} aria-hidden="true" />
                    <span className="rail-id" dir="ltr">
                      {lab.id}
                    </span>
                    <span className="rail-title">{labText(lang, lab.id, "title", lab.titleHe)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
        <main className="page">
          <Outlet />
        </main>
      </div>
    </>
  );
}
