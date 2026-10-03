import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { FailureCategory, ProjectionResponse } from "../../../shared/api";
import { createApi } from "../api";
import { ErrorBox, Loading } from "../components/Bits";
import { failureLabel } from "../labels";
import { useMock, useTo } from "../nav";
import { labText } from "../lab-copy";
import { getInstructorKey } from "../storage";
import { useUiLang } from "../ui-lang";

const CATEGORIES: FailureCategory[] = ["prompt_only", "blocklist", "client_only", "broke_happy_path", "hidden_variant", "other"];

export function ProjectPage() {
  const { classCode = "" } = useParams();
  const mock = useMock();
  const to = useTo();
  const [data, setData] = useState<ProjectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = getInstructorKey();
  const { lang } = useUiLang();

  const load = useCallback(async () => {
    const next = await createApi(mock).projection(classCode);
    setData(next);
    setError(null);
  }, [classCode, mock]);

  useEffect(() => {
    if (!key || !classCode) return;
    let cancel = false;
    load().catch((reason: unknown) => {
      if (!cancel) setError(reason instanceof Error ? reason.message : "נתוני ההקרנה לא נטענו.");
    });
    const timer = window.setInterval(() => {
      load().catch(() => undefined);
    }, 8000);
    const stop = createApi(mock).subscribe({ instructorKey: key }, (name) => {
      if (name === "board" || name === "session_closed") load().catch(() => undefined);
    });
    return () => {
      cancel = true;
      window.clearInterval(timer);
      stop();
    };
  }, [classCode, key, load, mock]);

  if (!key) {
    return (
      <div className="project-page">
        <h1>מצב הקרנה</h1>
        <p>אין מפתח מרצה בדפדפן הזה. פתחו מפגש מאותו דפדפן, ואז חזרו להקרנה. לא מוצגים כאן נתונים מומצאים.</p>
        <Link className="btn primary" to={to("/teach")}>
          ללוח המרצה
        </Link>
      </div>
    );
  }

  return (
    <div className="project-page">
      <h1>מצב הקרנה</h1>
      <p>
        כיתה <span className="ltr">{classCode}</span>. המספרים מצטברים ובלי שמות.
      </p>
      {error ? <ErrorBox text={error} /> : null}
      {!data && !error ? <Loading text="טוענים את תמונת המצב…" /> : null}
      {data && data.labs.length === 0 ? <p>אין עדיין נתונים להקרנה.</p> : null}
      {data?.labs.map((lab) => (
        <section key={lab.labId} className="project-lab">
          <h2>{labText(lang, lab.labId, "title", lab.titleHe)}</h2>
          <div className="project-grid">
            <article className="stat">
              <b>{lab.attackedSuccessfully}</b>
              תקפו בהצלחה
            </article>
            <article className="stat warn">
              <b>{lab.promptOnlyRejected}</b>
              נדחו כי התיקון היה רק בפרומפט
            </article>
            <article className="stat bad">
              <b>{lab.brokeHappyPath}</b>
              נכשלו בתרחיש התקין
            </article>
            <article className="stat good">
              <b>{lab.passed}</b>
              עברו
            </article>
            <article className="stat">
              <b>{lab.passedAfterSolution}</b>
              עברו אחרי צפייה בפתרון
            </article>
          </div>
          <h3>כישלונות לפי קטגוריה</h3>
          <div className="project-grid">
            {CATEGORIES.map((category) => (
              <article key={category} className="stat">
                <b>{lab.failureCounts[category] ?? 0}</b>
                {failureLabel[category]}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
