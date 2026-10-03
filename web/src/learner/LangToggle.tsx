import { chrome } from "./copy";
import { useUiLang } from "../ui-lang";

export function LangToggle() {
  const { lang, setLang } = useUiLang();
  const t = chrome(lang);
  return (
    <div className="ln-lang" role="group" aria-label={t.langLabel}>
      <button type="button" className={lang === "he" ? "on" : ""} aria-pressed={lang === "he"} onClick={() => setLang("he")}>
        {lang === "en" ? "HE" : "עב"}
      </button>
      <button type="button" className={lang === "en" ? "on" : ""} aria-pressed={lang === "en"} onClick={() => setLang("en")}>
        EN
      </button>
    </div>
  );
}
