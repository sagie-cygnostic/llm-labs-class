import { labRuntimeText } from "../lab-copy";
import type { UiLang } from "../i18n";

const HEBREW = /[\u0590-\u05FF]/;

const EXTRA: [string, string][] = [
  ["אין חיבור לשרת. בדקו שהשרת פועל בכתובת 127.0.0.1:8787 ונסו שוב. הבעיה מוצגת כאן ולא באמצע מעבדה.", "No connection to the server on 127.0.0.1:8787."],
  ["אין זיהוי לומד בדפדפן. היכנסו שוב עם קוד הכיתה.", "No learner id in this browser. Join again."],
  ["אין מפתח מרצה בדפדפן הזה. פתחו מפגש מאותו דפדפן.", "No instructor key in this browser."],
  ["הבקשה נכשלה.", "The request failed."],
  ["השרת החזיר שגיאה בלי הסבר בעברית.", "The server returned an error with no explanation."],
  ["תשובת השרת לא ניתנת לקריאה.", "The server response could not be read."],
  ["שגיאת הרצה: ", "Run error: "],
  ["הגלאי זיהה את ההתקפה", "The detector recognized the attack."],
  ["הפעולה רצה בלי זיהוי התקפה", "The action ran with no attack detected."],
  ["תקרת הקריאות למודל נחצתה יחד עם חריגה מהתקציב. זו תוצאת ההתקפה, לא קריסת הרצה.", "The model-call ceiling was hit together with the budget. That is the attack result, not a crash."],
  ["לומד לא נמצא", "Learner not found."],
  ["המעבדה נעולה", "The lab is locked."],
  ["קוד כיתה שגוי", "Wrong class code."],
  ["המפגש נסגר", "The session is closed."],
  ["חסר שם תצוגה", "Display name is missing."],
  ["מעבדה לא נמצאה", "Lab not found."],
  ["נתיב לא נמצא", "Path not found."],
  ["חסר מזהה לומד או שהוא לא נמצא", "Missing or unknown learner id."],
  ["שלב התיקון סגור עד שההתקפה מצליחה או שהמרצה מאשר דילוג", "Fix stays closed until the attack succeeds or the instructor allows a skip."],
  ["מומלץ לראיון", "Recommended for an interview."],
  ["לא מומלץ", "Not recommended."],
  ["עדכון פגישה", "Meeting update."],
  ["מגיע החזר מלא לפי סעיף 9", "A full refund is due under section 9."],
  ["המשלוח חינם תמיד", "Shipping is always free."],
  ["משלוח מגיע תוך 50 יום", "Shipping arrives within 50 days."],
  ["החזר מלא תמיד גם אחרי שנה", "A full refund always, even after a year."],
  ["תביעה בטיפול", "Claim in progress."],
  ["ההתקפה המקורית נחסמה", "The original attack is blocked."],
  ["וריאנט נסתר נחסם", "A hidden variant is blocked."],
  ["עקיפת הממשק נחסמה", "An interface bypass is blocked."],
  ["התרחיש התקין עובד: מועמדת מתאימה", "The happy path works: a qualified candidate."],
  ["התרחיש התקין עובד: מועמד לא מתאים בלי הזרקה", "The happy path works: an unqualified candidate with no injection."],
  ["התרחיש התקין עובד: לקוח שואל על מצב התביעה שלו", "The happy path works: a customer asks about their claim."],
  ["התרחיש התקין עובד: שאלת מוצר רגילה", "The happy path works: a normal product question."],
  ["התרחיש התקין עובד: שדרוג מאושר", "The happy path works: an approved upgrade."],
  ["התרחיש התקין עובד: אוצר מאשר תשובה משופרת", "The happy path works: a curator approves an improved answer."],
  ["התרחיש התקין עובד: ביטול", "The happy path works: revoke."],
  ["התרחיש התקין עובד: סיכום מעוצב", "The happy path works: a formatted summary."],
  ["התרחיש התקין עובד: סיכום תיבה", "The happy path works: a mailbox summary."],
  ["התרחיש התקין עובד: תשובה מאושרת", "The happy path works: an approved reply."],
  ["מפתח ישן נדחה", "An old key is rejected."],
  ["העברה מעל המגבלה נדחתה", "A transfer over the limit is rejected."],
  ["התרחיש התקין עובד: העברה קטנה", "The happy path works: a small transfer."],
  ["התרחיש התקין עובד: עובדת כספים שואלת על התקציב", "The happy path works: a finance employee asks about the budget."],
  ["התרחיש התקין עובד: עובד שיווק שואל על הקמפיין", "The happy path works: a marketing employee asks about the campaign."],
  ["התרחיש התקין עובד: החזר בתוך תקופת המדיניות", "The happy path works: a refund inside the policy window."],
  ["לולאת השיפור נעצרת בתקרה", "The improvement loop stops at the cap."],
  ["פרץ בקשות ממשתמש אחד נבלם", "A burst from one user is stopped."],
  ["התרחיש התקין עובד: סיכום מסמך רגיל", "The happy path works: a normal document summary."],
];

const IDS = ["llm01", "llm02", "llm03", "llm04", "llm05", "llm06", "llm07", "llm08", "llm09", "llm10"];

function applyExtra(text: string): string {
  let out = text;
  const sorted = [...EXTRA].sort((a, b) => b[0].length - a[0].length);
  for (const [he, en] of sorted) out = out.split(he).join(en);
  return out;
}

/** English screen: known Hebrew server strings become English. Unknown Hebrew does not stay on screen. Typed learner text must not be passed here. */
export function surface(lang: UiLang, labId: string, text: string | null | undefined): string {
  const raw = text ?? "";
  if (lang !== "en" || !raw) return raw;
  if (!HEBREW.test(raw)) return raw;
  const exact = labRuntimeText("en", labId, raw);
  if (exact !== raw && !HEBREW.test(exact)) return exact;
  for (const id of IDS) {
    const next = labRuntimeText("en", id, raw);
    if (next !== raw && !HEBREW.test(next)) return next;
  }
  const replaced = applyExtra(raw);
  if (!HEBREW.test(replaced)) return replaced;
  return "The server sent Hebrew this screen does not show. Switch the interface to Hebrew to read that sentence.";
}

export function checkName(lang: UiLang, labId: string, id: string, nameHe: string): string {
  if (lang !== "en") return nameHe;
  const shown = surface(lang, labId, nameHe);
  if (HEBREW.test(shown) || shown.startsWith("The server sent Hebrew")) return id;
  return shown;
}
