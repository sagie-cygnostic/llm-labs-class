import type { Language } from "../../../shared/api";
import { languageLabel, languages } from "../labels";
import { useUiLang } from "../ui-lang";

export function ErrorBox({ text }: { text: string }) {
  return (
    <div className="error" role="alert">
      {text}
    </div>
  );
}

export function Loading({ text = "טוענים…" }: { text?: string }) {
  return (
    <p className="loading" role="status">
      {text}
    </p>
  );
}

export function LanguagePicker({
  value,
  disabled,
  onPick,
}: {
  value: Language;
  disabled?: boolean;
  onPick: (language: Language) => void;
}) {
  const { copy } = useUiLang();
  return (
    <div className="row lang" role="group" aria-label={copy.codeLang}>
      {languages.map((language) => (
        <button
          key={language}
          type="button"
          className={language === value ? "btn on" : "btn"}
          aria-pressed={language === value}
          disabled={disabled}
          dir={language === "pseudocode" ? "rtl" : "ltr"}
          lang={language === "pseudocode" ? "he" : "en"}
          onClick={() => onPick(language)}
        >
          {languageLabel[language]}
        </button>
      ))}
    </div>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { copy } = useUiLang();
  return (
    <div className="modal-back" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <p>{body}</p>
        <div className="row">
          <button type="button" className={danger ? "btn warn" : "btn primary"} onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="btn" onClick={onCancel}>
            {copy.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
