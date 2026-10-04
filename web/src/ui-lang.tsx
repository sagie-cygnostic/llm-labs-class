import { useEffect, useMemo, useState } from "react";
import { applyUiLang, readUiLang, uiStrings, writeUiLang, type UiCopy, type UiLang } from "./i18n";

export function useUiLang(): { lang: UiLang; copy: UiCopy; setLang: (lang: UiLang) => void } {
  const [lang, setLangState] = useState<UiLang>(() => readUiLang());
  const copy = useMemo(() => uiStrings(lang), [lang]);

  useEffect(() => {
    applyUiLang(lang);
  }, [lang]);

  useEffect(() => {
    const sync = () => setLangState(readUiLang());
    window.addEventListener("llm-labs-lang", sync);
    return () => window.removeEventListener("llm-labs-lang", sync);
  }, []);

  function setLang(_next: UiLang) {
    writeUiLang("en");
    applyUiLang("en");
    setLangState("en");
  }

  return { lang, copy, setLang };
}
