import type { BoardCell, CheckStatus, FailureCategory, Language, LearnerLabState, TimelineKind } from "../../shared/api";

export const stateLabel: Record<LearnerLabState, string> = {
  locked: "נעולה",
  open: "פתוחה",
  attack: "שלב התקפה",
  fix: "שלב תיקון",
  completed: "הושלמה",
  completed_after_solution: "הושלמה אחרי צפייה בפתרון",
};

export const boardLabel: Record<BoardCell, string> = {
  not_started: "לא התחיל",
  attack: "בשלב התקפה",
  attack_succeeded: "תקף בהצלחה",
  submitted_failed: "הגיש ונכשל",
  passed: "עבר",
  passed_after_solution: "עבר אחרי צפייה בפתרון",
  instructor_skip: "דילוג באישור מרצה",
};

export const boardMark: Record<BoardCell, string> = {
  not_started: "·",
  attack: "…",
  attack_succeeded: "הצליח",
  submitted_failed: "נכשל",
  passed: "עבר",
  passed_after_solution: "עבר*",
  instructor_skip: "דילוג",
};

export const failureLabel: Record<FailureCategory, string> = {
  prompt_only: "רק פרומפט",
  blocklist: "רשימה שחורה",
  client_only: "בדיקה בצד הלקוח",
  broke_happy_path: "נשבר התרחיש התקין",
  hidden_variant: "וריאנט נסתר",
  other: "אחר",
};

export const checkStatusLabel: Record<CheckStatus, string> = {
  pending: "ממתינה",
  running: "רצה",
  passed: "עברה",
  failed: "נכשלה",
};

export const languageLabel: Record<Language, string> = {
  python: "Python",
  typescript: "TypeScript",
  pseudocode: "פסאודו-קוד",
};

export const timelineLabel: Record<TimelineKind, string> = {
  hint: "רמז",
  attack_succeeded: "הצלחת התקפה",
  submission: "הגשה",
  viewed_solution: "צפייה בפתרון",
  instructor_skip: "דילוג מרצה",
  passed: "מעבר",
};

export const languages: Language[] = ["python", "typescript", "pseudocode"];
