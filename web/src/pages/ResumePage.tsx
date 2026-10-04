import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createApi } from "../api";
import { chrome } from "../learner/copy";
import { surface } from "../learner/surface";
import { useMock, useTo } from "../nav";
import { useSession } from "../session";
import { saveLearner } from "../storage";
import { useUiLang } from "../ui-lang";

export function ResumePage() {
  const mock = useMock();
  const to = useTo();
  const navigate = useNavigate();
  const { refresh } = useSession();
  const { lang } = useUiLang();
  const t = chrome(lang);
  const [classCode, setClassCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [serverDetail, setServerDetail] = useState("");
  const [serverOk, setServerOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    createApi(mock)
      .health()
      .then((health) => {
        if (cancel) return;
        if (!health.ok) {
          setServerOk(false);
          setServerDetail(t.serverBad);
          return;
        }
        setServerOk(true);
        setServerDetail(t.serverOk);
      })
      .catch((reason: unknown) => {
        if (cancel) return;
        setServerOk(false);
        setServerDetail(surface(lang, "llm01", reason instanceof Error ? reason.message : t.serverBad));
      });
    return () => {
      cancel = true;
    };
  }, [lang, mock, t.serverBad, t.serverOk]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!classCode.trim() || !pin.trim()) {
      setError(t.needBoth);
      return;
    }
    setBusy(true);
    try {
      const resumed = await createApi(mock).resume({ classCode: classCode.trim(), pin: pin.trim() });
      saveLearner(resumed.learnerId, resumed.displayName, classCode.trim());
      refresh();
      navigate(to("/labs"));
    } catch (reason: unknown) {
      setError(surface(lang, "llm01", reason instanceof Error ? reason.message : t.resumeFail));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ln-gate">
      <div className="ln-corner">
      </div>
      <form className="ln-card" onSubmit={(event) => void onSubmit(event)}>
        <h1>{t.resumeTitle}</h1>
        <p className={serverOk ? "ln-note" : "ln-error"}>{serverDetail || t.serverChecking}</p>
        {error ? <p className="ln-error">{error}</p> : null}
        <label className="ln-label" htmlFor="classCode">
          {t.classCode}
        </label>
        <input id="classCode" dir="ltr" value={classCode} onChange={(event) => setClassCode(event.target.value)} />
        <label className="ln-label" htmlFor="pin">
          {t.pin}
        </label>
        <input id="pin" dir="ltr" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} />
        <div className="ln-row">
          <button className="ln-btn primary" type="submit" disabled={!serverOk || busy}>
            {busy ? t.resuming : t.resume}
          </button>
        </div>
        <Link className="ln-link" to={to("/")}>
          {t.firstJoin}
        </Link>
      </form>
    </div>
  );
}
