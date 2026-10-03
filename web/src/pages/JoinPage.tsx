import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createApi } from "../api";
import { chrome } from "../learner/copy";
import { LangToggle } from "../learner/LangToggle";
import { surface } from "../learner/surface";
import { useMock, useTo } from "../nav";
import { useSession } from "../session";
import { saveLearner } from "../storage";
import { useUiLang } from "../ui-lang";

export function JoinPage() {
  const mock = useMock();
  const to = useTo();
  const navigate = useNavigate();
  const { refresh } = useSession();
  const { lang } = useUiLang();
  const t = chrome(lang);
  const [classCode, setClassCode] = useState(() => new URLSearchParams(window.location.search).get("classCode") ?? "");
  const [displayName, setDisplayName] = useState("");
  const [server, setServer] = useState<"loading" | "ok" | "bad">("loading");
  const [serverDetail, setServerDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancel = false;
    setServer("loading");
    createApi(mock)
      .health()
      .then((health) => {
        if (cancel) return;
        if (!health.ok) {
          setServer("bad");
          setServerDetail(t.serverBad);
          return;
        }
        setServer("ok");
        setServerDetail(t.serverOk);
      })
      .catch((reason: unknown) => {
        if (cancel) return;
        setServer("bad");
        setServerDetail(surface(lang, "llm01", reason instanceof Error ? reason.message : t.serverBad));
      });
    return () => {
      cancel = true;
    };
  }, [lang, mock, t.serverBad, t.serverOk]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!classCode.trim()) {
      setError(t.missingCode);
      return;
    }
    if (!displayName.trim()) {
      setError(t.missingName);
      return;
    }
    setBusy(true);
    try {
      const joined = await createApi(mock).join({ classCode: classCode.trim(), displayName: displayName.trim() });
      saveLearner(joined.learnerId, joined.displayName, classCode.trim());
      refresh();
      setPin(joined.pin);
    } catch (reason: unknown) {
      setError(surface(lang, "llm01", reason instanceof Error ? reason.message : t.joinFail));
    } finally {
      setBusy(false);
    }
  }

  async function copyPin() {
    if (!pin) return;
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
    } catch {
      setCopied(false);
      setError(t.copyFail);
    }
  }

  return (
    <div className="ln-gate">
      <div className="ln-corner">
        <LangToggle />
      </div>
      <form className="ln-card" onSubmit={(event) => void onSubmit(event)}>
        <h1>{t.joinTitle}</h1>
        <p className="ln-note">{server === "loading" ? t.serverChecking : serverDetail}</p>
        {error ? <p className="ln-error">{error}</p> : null}
        {pin ? (
          <>
            <p className="ln-label">{t.yourPin}</p>
            <p className="ln-pin" dir="ltr">
              {pin}
            </p>
            <p className="ln-note">{t.pinOnce}</p>
            <div className="ln-row">
              <button type="button" className="ln-btn" onClick={() => void copyPin()}>
                {copied ? t.copied : t.copy}
              </button>
              <button type="button" className="ln-btn primary" onClick={() => navigate(to("/labs"))}>
                {t.toLabs}
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="ln-label" htmlFor="classCode">
              {t.classCode}
            </label>
            <input id="classCode" dir="ltr" autoComplete="off" spellCheck={false} value={classCode} onChange={(event) => setClassCode(event.target.value)} />
            <label className="ln-label" htmlFor="displayName">
              {t.displayName}
            </label>
            <input id="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            <div className="ln-row">
              <button className="ln-btn primary" type="submit" disabled={server !== "ok" || busy}>
                {busy ? t.entering : t.enter}
              </button>
            </div>
            <Link className="ln-link" to={to("/resume")}>
              {t.havePin}
            </Link>
          </>
        )}
      </form>
    </div>
  );
}
