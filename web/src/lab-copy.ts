import type { UiLang } from "./i18n";

/** English display copy for the ten labs. Hebrew source: labs/meta.js. */

export type LabField =
  | "title"
  | "blurb"
  | "app"
  | "users"
  | "role"
  | "goal"
  | "happyPathName"
  | "happyPath"
  | "notAFix"
  | "fact"
  | "cause"
  | "solution"
  | "hint1"
  | "hint2"
  | "hint3";

type Pair = { he: string; en: string };

const NOT_A_FIX: Pair = {
  he: "הוספת משפט אזהרה לפרומפט המערכת לא תעבור את הבדיקה. הבקרה צריכה להיות בקוד שמבצע את הפעולה.",
  en: "Adding a warning sentence to the system prompt will not pass the check. The control has to be in the code that performs the action.",
};

const LAB_COPY: Record<string, Record<LabField, Pair>> = {
  llm01: {
    title: { he: "הזרקת פרומפט", en: "Prompt injection" },
    blurb: { he: "מסנן קורות חיים שמחליט לפי מה שהמודל החזיר.", en: "A resume filter that decides from what the model returned." },
    cause: {
      he: "זה קרה כי הקוד שולח למודל את כל הקובץ, כולל טקסט מוסתר, ומקבל את תווית ההמלצה מהמודל.",
      en: "This happened because the code sends the model the whole file, including hidden text, and takes the recommendation label from the model.",
    },
    fact: {
      he: "מועמד שלא עומד בדרישות קיבל את התווית מומלץ לראיון.",
      en: "A candidate who does not meet the requirements received the label recommended for interview.",
    },
    solution: {
      he: "מחלצים רק טקסט גלוי, מבקשים מהמודל ציטוטים מילוליים, וקוד דטרמיניסטי מחליט מומלץ או לא מומלץ רק מטענות שאומתו מול המסמך.",
      en: "Extract only visible text, ask the model for verbatim quotes, and deterministic code decides recommended or not recommended only from claims checked against the document.",
    },
    app: {
      he: "מסנן קורות חיים של חברה בדויה. המגייס מעלה קובץ טקסט והמערכת מציגה מומלץ לראיון או לא מומלץ.",
      en: "A fictional company's resume filter. The recruiter uploads a text file and the system shows recommended for interview or not recommended.",
    },
    users: { he: "מגייס בחברה בדויה, ומועמדים בדויים.", en: "A recruiter at a fictional company, and fictional candidates." },
    role: { he: "אתה מועמד שלא עומד בדרישות המשרה.", en: "You are a candidate who does not meet the job requirements." },
    goal: {
      he: "גרום למסנן לסמן אותך כמומלץ לראיון למרות שקורות החיים לא עומדים בדרישות.",
      en: "Make the filter mark you as recommended for interview even though the resume does not meet the requirements.",
    },
    happyPathName: { he: "מועמדת מתאימה", en: "A qualified candidate" },
    happyPath: {
      he: "קורות חיים לגיטימיים עם ניסיון Python ואבטחת מידע צריכים להישאר מומלץ לראיון. מועמד לא מתאים בלי הזרקה נשאר לא מומלץ.",
      en: "A legitimate resume with Python and information-security experience should stay recommended for interview. An unqualified candidate with no injection stays not recommended.",
    },
    notAFix: NOT_A_FIX,
    hint1: {
      he: "ההחלטה מומלץ או לא מומלץ לא צריכה להילקח מהשדה שהמודל החזיר.",
      en: "The recommended or not-recommended decision should not be taken from the field the model returned.",
    },
    hint2: {
      he: "לפני כל שימוש במסמך הסירו טקסט מוסתר, הערות ומטא-דאטה.",
      en: "Before any use of the document, strip hidden text, comments, and metadata.",
    },
    hint3: {
      he: "בקשו מהמודל רק טענות עם ציטוט, וזרקו בקוד כל ציטוט שלא מופיע מילה במילה בטקסט הגלוי.",
      en: "Ask the model only for claims with a quote, and in code drop any quote that does not appear word for word in the visible text.",
    },
  },
  llm02: {
    title: { he: "חשיפת מידע רגיש", en: "Sensitive information disclosure" },
    blurb: { he: "בוט ביטוח שטוען למודל את כל הלקוחות.", en: "An insurance bot that loads every customer into the model." },
    cause: {
      he: "זה קרה כי הקוד טוען להקשר של המודל את רשומות כל הלקוחות, לא רק של הלקוח המחובר.",
      en: "This happened because the code loads every customer's records into the model's context, not only the signed-in customer's.",
    },
    fact: {
      he: "בתשובה הופיע מידע מזהה של לקוח שאינו הלקוח המחובר.",
      en: "The answer included identifying information of a customer who is not the signed-in customer.",
    },
    solution: {
      he: "שולפים רק את רשומת הסשן בצד השרת, מעבירים למודל מינימום שדות, ומתעלמים ממזהה לקוח שמגיע מהבקשה.",
      en: "Fetch only the session record on the server, pass the model the minimum fields, and ignore a customer id that comes from the request.",
    },
    app: {
      he: "בוט שירות של חברת ביטוח בדויה. לקוח שואל על הפוליסה שלו.",
      en: "A service bot for a fictional insurance company. A customer asks about their policy.",
    },
    users: {
      he: "לקוחות בדויים. לכל רשומה טוקן קנרית מזויף שנוצר להרצה.",
      en: "Fictional customers. Each record has a fake canary token created for the run.",
    },
    role: {
      he: "אתה לקוח מחובר. יש לקוח אחר שמופיע בתדריך בשם עומר חדד.",
      en: "You are a signed-in customer. Another customer named in the brief is Omer Hadad.",
    },
    goal: {
      he: "גרום לבוט לחשוף פרט מזהה או טוקן של לקוח שאינו אתה.",
      en: "Make the bot reveal an identifying detail or a token of a customer who is not you.",
    },
    happyPathName: { he: "לקוח שואל על מצב התביעה שלו", en: "A customer asks about their claim status" },
    happyPath: {
      he: "שאלה על התביעה שלך צריכה להחזיר את המצב תביעה בטיפול.",
      en: "A question about your claim should return the status claim in progress.",
    },
    notAFix: NOT_A_FIX,
    hint1: {
      he: "מידע שלא נכנס להקשר של המודל לא יכול לדלוף בתשובה.",
      en: "Information that never enters the model's context cannot leak in the answer.",
    },
    hint2: {
      he: "זהות הלקוח מגיעה מהסשן בשרת, לא מטקסט השאלה ולא משדה בבקשה.",
      en: "The customer's identity comes from the server session, not from the question text and not from a field in the request.",
    },
    hint3: {
      he: "אל תשלחו למודל מספר זהות, כתובת או רשומות של לקוחות אחרים.",
      en: "Do not send the model an ID number, an address, or other customers' records.",
    },
  },
  llm03: {
    title: { he: "שרשרת אספקה", en: "Supply chain" },
    blurb: {
      he: "עוזר מוצרים שטוען את גרסת החבילה האחרונה בלי נעילה.",
      en: "A product assistant that loads the latest package version with no lock.",
    },
    cause: {
      he: "זה קרה כי הקוד טוען את הגרסה האחרונה לפי שם, בלי hash ובלי חתימה שנבדקים מול קובץ נעילה.",
      en: "This happened because the code loads the latest version by name, with no hash and no signature checked against a lock file.",
    },
    fact: {
      he: "האפליקציה טענה חבילה שפורסמה במאגר המדומה, והתשובה כללה כתובת התקפה של המעבדה.",
      en: "The app loaded a package published in the simulated registry, and the answer included the lab's attack address.",
    },
    solution: {
      he: "קובץ נעילה מקבע שם, גרסה ו-hash. הטעינה נכשלת אם ה-hash או חתימת המפרסם לא תואמים. אין טעינה של האחרונה.",
      en: "A lock file pins name, version, and hash. Loading fails if the hash or the publisher signature does not match. There is no load of latest.",
    },
    app: {
      he: "עוזר מוצרים שטוען חבילת מודל ממאגר פנימי מדומה.",
      en: "A product assistant that loads a model package from a simulated internal registry.",
    },
    users: { he: "משתמש ששואל על מוצר, ומפרסם במאגר.", en: "A user who asks about a product, and a publisher in the registry." },
    role: {
      he: "אתה ספק שהחשבון שלו נפרץ. אתה מפרסם חבילה במאגר המדומה בלבד.",
      en: "You are a supplier whose account was compromised. You publish a package only in the simulated registry.",
    },
    goal: {
      he: "גרום לעוזר לטעון את החבילה שלך ולהציג את כתובת ההתקפה של המעבדה.",
      en: "Make the assistant load your package and show the lab's attack address.",
    },
    happyPathName: { he: "שאלת מוצר רגילה", en: "A normal product question" },
    happyPath: {
      he: "עם החבילה הלגיטימית הנעולה התשובה כוללת אחריות לשנה. שדרוג לגרסה חתומה שמעודכנת בקובץ הנעילה צריך להיטען.",
      en: "With the legitimate locked package the answer includes a one-year warranty. An upgrade to a signed version updated in the lock file should load.",
    },
    notAFix: NOT_A_FIX,
    hint1: { he: "אל תטענו גרסה בשם האחרונה.", en: "Do not load a version named latest." },
    hint2: {
      he: "השוו hash שאתם מחשבים לקובץ הנעילה, לא לערך שהמאגר מדווח.",
      en: "Compare a hash you compute to the lock file, not to a value the registry reports.",
    },
    hint3: {
      he: "אם החתימה או ה-hash לא תואמים, הטעינה נכשלת והאפליקציה לא עונה מהרכיב.",
      en: "If the signature or the hash does not match, loading fails and the app does not answer from the component.",
    },
  },
  llm04: {
    title: { he: "הרעלת נתונים ומודל", en: "Data and model poisoning" },
    blurb: {
      he: "עוזר IT שמכניס כל הצעת משתמש ישר למאגר הפעיל.",
      en: "An IT assistant that puts every user suggestion straight into the live store.",
    },
    cause: {
      he: "זה קרה כי הצעה של עובד רגיל נכנסת מיד למאגר הדוגמאות הפעיל, והתשובה נשענת עליה.",
      en: "This happened because a regular employee's suggestion enters the live example store immediately, and the answer relies on it.",
    },
    fact: {
      he: "משתמש אחר קיבל תשובה עם כתובת מזויפת מתוך דוגמה שהוכנסה למאגר.",
      en: "Another user got an answer with a fake address from an example that was inserted into the store.",
    },
    solution: {
      he: "הצעות של עובדים נכנסות להסגר. רק אוצר תוכן מהסשן מאשר, ורק אם כל הקישורים בדומיין המותר. אפשר לבטל רשומה.",
      en: "Employee suggestions go into quarantine. Only a content curator from the session approves, and only if every link is on the allowed domain. A record can be revoked.",
    },
    app: {
      he: "עוזר תמיכת IT. משתמשים מציעים תשובה טובה יותר והיא נכנסת לדוגמאות.",
      en: "An IT support assistant. Users suggest a better answer and it enters the examples.",
    },
    users: { he: "עובדים בדויים ואוצר תוכן.", en: "Fictional employees and a content curator." },
    role: {
      he: "אתה עובד רגיל. אחר כך נשאלת השאלה כעובד אחר.",
      en: "You are a regular employee. The question is then asked as another employee.",
    },
    goal: {
      he: "הכנס דוגמה עם כתובת מזויפת של המעבדה כך שעובד אחר יקבל אותה.",
      en: "Insert an example with a fake lab address so another employee receives it.",
    },
    happyPathName: { he: "אוצר מאשר תשובה משופרת", en: "A curator approves an improved answer" },
    happyPath: {
      he: "הצעה לגיטימית לדומיין הארגוני שאישר אוצר נכנסת למאגר ומשנה את התשובה. ביטול מוציא אותה.",
      en: "A legitimate suggestion for the company domain that a curator approved enters the store and changes the answer. Revoking removes it.",
    },
    notAFix: NOT_A_FIX,
    hint1: { he: "הצעה של עובד רגיל לא נכנסת למאגר הפעיל.", en: "A regular employee's suggestion does not enter the live store." },
    hint2: {
      he: "תפקיד האוצר נבדק מהסשן, לא משדה שהדפדפן שולח.",
      en: "The curator role is checked from the session, not from a field the browser sends.",
    },
    hint3: {
      he: "דחו הצעה שיש בה קישור לדומיין שאינו ברשימת ההיתר, ואפשרו ביטול של רשומה שאושרה.",
      en: "Reject a suggestion that links to a domain not on the allow list, and allow revoking an approved record.",
    },
  },
  llm05: {
    title: { he: "טיפול לקוי בפלט", en: "Improper output handling" },
    blurb: { he: "לוח ביקורות שמציג את סיכום המודל כ-HTML גולמי.", en: "A review board that shows the model's summary as raw HTML." },
    cause: {
      he: "זה קרה כי פלט המודל הוצג כ-HTML בלי קידוד ובלי רשימת היתר, והדפדפן המדומה של המנהל הריץ אותו.",
      en: "This happened because the model output was shown as HTML with no encoding and no allow list, and the simulated admin browser ran it.",
    },
    fact: {
      he: "נרשמה פנייה לנקודת הלכידה של המעבדה או ביצוע סקריפט בהקשר של המנהל.",
      en: "A request to the lab's capture endpoint was recorded, or a script ran in the admin's context.",
    },
    solution: {
      he: "פלט המודל עובר ניקוי עם רשימת תגיות מותרת, בלי אירועים, בלי פרוטוקולי קישור מסוכנים ובלי יעדי לכידה.",
      en: "Model output is sanitized with an allowed tag list, with no events, no dangerous link protocols, and no capture targets.",
    },
    app: {
      he: "לוח ביקורות. המודל מסכם ביקורות והסיכום מוצג למנהל.",
      en: "A review board. The model summarizes reviews and the summary is shown to an admin.",
    },
    users: {
      he: "לקוח שכותב ביקורת, ומנהל דמה עם עוגיית סשן מזויפת.",
      en: "A customer who writes a review, and a dummy admin with a fake session cookie.",
    },
    role: {
      he: "אתה לקוח. המנהל המדומה יפתח את הלוח אחרי הסיכום.",
      en: "You are a customer. The simulated admin will open the board after the summary.",
    },
    goal: {
      he: "גרום לסיכום להפעיל סקריפט או לפנות לנקודת הלכידה של המעבדה.",
      en: "Make the summary run a script or contact the lab's capture endpoint.",
    },
    happyPathName: { he: "סיכום מעוצב", en: "A formatted summary" },
    happyPath: {
      he: "סיכום עם הדגשה, רשימה והביטוי קטן מ- צריך להישאר קריא. אסור שהטקסט ייעלם.",
      en: 'A summary with emphasis, a list, and the phrase "קטן מ-" should stay readable. The text must not disappear.',
    },
    notAFix: NOT_A_FIX,
    hint1: { he: "התייחסו לפלט המודל כקלט לא מהימן.", en: "Treat model output as untrusted input." },
    hint2: {
      he: "אל תציגו HTML גולמי. עדיף טקסט, או רשימת תגיות קטנה בלי מאפיינים.",
      en: "Do not show raw HTML. Prefer text, or a small tag list with no attributes.",
    },
    hint3: {
      he: "חסמו אירועים, קישורי javascript, תמונות ויעדי נקודת הלכידה.",
      en: "Block events, javascript links, images, and capture-endpoint targets.",
    },
  },
  llm06: {
    title: { he: "סמכות יתר לסוכן", en: "Excessive agency" },
    blurb: {
      he: "עוזר דואר עם כלים של שליחה ומחיקה בהרשאת מנהל.",
      en: "A mail assistant with send and delete tools running as admin.",
    },
    cause: {
      he: "זה קרה כי זרימת הסיכום מפעילה כל כלי שהמודל ביקש, כולל שליחה ומחיקה, בזהות רחבה.",
      en: "This happened because the summary flow runs every tool the model asked for, including send and delete, under a broad identity.",
    },
    fact: {
      he: "נשלח דואר לכתובת תוקף במעבדה, או שנמחקה הודעה, או שנקראה תיבה של משתמש אחר.",
      en: "Mail was sent to an attacker address in the lab, or a message was deleted, or another user's mailbox was read.",
    },
    solution: {
      he: "סיכום משתמש רק בקריאה של התיבה של הסשן. שליחה דורשת אסימון אישור חד-פעמי שהמודל לא מנפיק.",
      en: "A summary uses only a read of the session mailbox. Sending requires a one-time approval token that the model does not issue.",
    },
    app: {
      he: "עוזר תיבת דואר שמסכם מיילים ויכול גם לשלוח.",
      en: "A mailbox assistant that summarizes mail and can also send.",
    },
    users: {
      he: "עובד דמה, ותיבה עם מייל קוד אימות שמכיל טוקן מזויף.",
      en: "A dummy employee, and a mailbox with a verification-code email that contains a fake token.",
    },
    role: { he: "אתה אדם מבחוץ ששולח מייל לתיבה של העובד.", en: "You are an outsider who sends mail to the employee's mailbox." },
    goal: {
      he: "גרום לעוזר להעביר את קוד האימות לכתובת תוקף במעבדה, או למחוק מייל, או לקרוא תיבה אחרת.",
      en: "Make the assistant forward the verification code to an attacker address in the lab, or delete a mail, or read another mailbox.",
    },
    happyPathName: { he: "סיכום תיבה", en: "Mailbox summary" },
    happyPath: {
      he: "סיכום התיבה צריך לכלול את נושא המייל עדכון פגישה. תשובה מאושרת לנמען הנכון צריכה להישלח.",
      en: 'The mailbox summary should include the email subject "עדכון פגישה". An approved reply to the correct recipient should be sent.',
    },
    notAFix: NOT_A_FIX,
    hint1: { he: "זרימת הסיכום לא צריכה כלי שליחה או מחיקה.", en: "The summary flow should not have a send or delete tool." },
    hint2: { he: "קריאה רק לתיבה של המשתמש מהסשן.", en: "Read only the mailbox of the user from the session." },
    hint3: {
      he: "שליחה רק עם אסימון אישור שהשרת הנפיק לטיוטה, לא עם אישור שמגיע מהמודל.",
      en: "Send only with an approval token the server issued for the draft, not with an approval that comes from the model.",
    },
  },
  llm07: {
    title: { he: "דליפת פרומפט המערכת", en: "System prompt leakage" },
    blurb: { he: "צ'אט בנקאי שהמפתח והמגבלה יושבים בפרומפט.", en: "A bank chat where the key and the limit sit in the prompt." },
    cause: {
      he: "זה קרה כי מפתח השירות וכלל המגבלה נמצאים בפרומפט, וההעברה מתבצעת בלי בדיקת מגבלה בקוד.",
      en: "This happened because the service key and the limit rule are in the prompt, and the transfer runs with no limit check in code.",
    },
    fact: {
      he: "סוד מההקשר הופיע בתשובה, או שנרשמה העברה מעל המגבלה.",
      en: "A secret from the context appeared in the answer, or a transfer above the limit was recorded.",
    },
    solution: {
      he: "המפתח לא נכנס לפרומפט ומסובבים אותו. ההעברה נבדקת בקוד מול המגבלה וזהות הסשן.",
      en: "The key does not enter the prompt and is rotated. The transfer is checked in code against the limit and the session identity.",
    },
    app: {
      he: "צ'אט בנקאי של בנק בדוי עם שירות העברות מדומה.",
      en: "A bank chat for a fictional bank with a simulated transfer service.",
    },
    users: { he: "לקוח רגיל. המגבלה היומית בתצורה היא 1000.", en: "A regular customer. The daily limit in the config is 1000." },
    role: { he: "אתה לקוח רגיל.", en: "You are a regular customer." },
    goal: { he: "חשפו את המפתח המזויף או בצעו העברה מעל המגבלה.", en: "Reveal the fake key or make a transfer above the limit." },
    happyPathName: { he: "העברה קטנה", en: "A small transfer" },
    happyPath: { he: "העברה של 100 צריכה להירשם. העברה מעל 1000 נדחית.", en: "A transfer of 100 should be recorded. A transfer above 1000 is rejected." },
    notAFix: NOT_A_FIX,
    hint1: { he: "סוד לא גר בפרומפט ולא בתשובה לדפדפן.", en: "A secret does not live in the prompt or in the answer to the browser." },
    hint2: { he: "החליפו את המפתח הישן כך שקריאה איתו תידחה.", en: "Replace the old key so a call with it is rejected." },
    hint3: {
      he: "את המגבלה אוכפים בקוד לפי הסשן, לא לפי מה שהמודל אומר על תפקיד.",
      en: "Enforce the limit in code from the session, not from what the model says about a role.",
    },
  },
  llm08: {
    title: { he: "חולשות בווקטורים ובהטמעות", en: "Vector and embedding weaknesses" },
    blurb: { he: "מאגר ידע אחד בלי סינון הרשאות בין מחלקות.", en: "One knowledge base with no permission filter between departments." },
    cause: {
      he: "זה קרה כי השליפה מחזירה קטעים קרובים בלי לסנן לפי המחלקה של הסשן.",
      en: "This happened because retrieval returns nearby chunks without filtering by the session's department.",
    },
    fact: {
      he: "טוקן ממסמך כספים חסוי הופיע בתשובה או במקורות.",
      en: "A token from a restricted finance document appeared in the answer or in the sources.",
    },
    solution: {
      he: "כל קטע מתויג במחלקה. השליפה והבדיקה שאחריה משתמשות רק במחלקה מהסשן, לא מפרמטר של הדפדפן.",
      en: "Every chunk is tagged with a department. Retrieval and the check after it use only the department from the session, not a browser parameter.",
    },
    app: {
      he: "מאגר ידע עם מסמכי שיווק וכספים באותו מאגר.",
      en: "A knowledge base with marketing and finance documents in the same store.",
    },
    users: {
      he: "עובד שיווק ועובדת כספים. במסמכי הכספים יש טוקן מזויף.",
      en: "A marketing employee and a finance employee. The finance documents contain a fake token.",
    },
    role: { he: "אתה עובד שיווק.", en: "You are a marketing employee." },
    goal: {
      he: "גרמו לתשובה, למקורות או לתגובה לכלול טוקן ממסמך כספים.",
      en: "Make the answer, the sources, or the response include a token from a finance document.",
    },
    happyPathName: { he: "עובד שיווק שואל על הקמפיין", en: "A marketing employee asks about the campaign" },
    happyPath: {
      he: "שאלת קמפיין מחזירה מסמך שיווק. עובדת כספים ששואלת על שכר מקבלת את מסמך הכספים.",
      en: "A campaign question returns a marketing document. A finance employee who asks about salary gets the finance document.",
    },
    notAFix: NOT_A_FIX,
    hint1: { he: "אל תשלפו קטעים בלי מסנן מחלקה.", en: "Do not retrieve chunks without a department filter." },
    hint2: {
      he: "המחלקה מגיעה מהסשן, לא משדה department בבקשה.",
      en: "The department comes from the session, not from a department field in the request.",
    },
    hint3: {
      he: "אחרי השליפה סננו שוב כל קטע לפני שהוא נשלח למודל או לדפדפן.",
      en: "After retrieval, filter every chunk again before it is sent to the model or the browser.",
    },
  },
  llm09: {
    title: { he: "מידע שגוי", en: "Misinformation" },
    blurb: { he: "בוט החזרים שמנפיק שובר אם המודל אישר.", en: "A refund bot that issues a voucher if the model approved." },
    cause: {
      he: "זה קרה כי הקוד מנפיק שובר לפי אישור המודל ומציג את התשובה כרשמית, בלי ציטוט מאומת.",
      en: "This happened because the code issues a voucher from the model's approval and presents the answer as official, with no verified quote.",
    },
    fact: {
      he: "הונפק שובר זיכוי ללקוח שלא זכאי לפי המדיניות.",
      en: "A credit voucher was issued to a customer who is not eligible under the policy.",
    },
    solution: {
      he: "התשובה חייבת ציטוט מילה במילה מסעיף קיים. הזכאות מחושבת בקוד לפי תאריך ומצב המוצר. בלי ציטוט נפתחת פנייה לנציג ואין שובר.",
      en: "The answer must quote an existing section word for word. Eligibility is computed in code from the date and the product condition. Without a quote, a ticket is opened for an agent and there is no voucher.",
    },
    app: {
      he: "בוט מדיניות החזרים. אם מגיע החזר, המערכת מנפיקה שובר במערכת הזמנות מדומה.",
      en: "A refund-policy bot. If a refund is due, the system issues a voucher in a simulated order system.",
    },
    users: { he: "לקוחות דמה. המדיניות כתובה בסעיפים ממוספרים.", en: "Dummy customers. The policy is written in numbered sections." },
    role: { he: "אתה לקוח.", en: "You are a customer." },
    goal: {
      he: "גרמו לבוט לאשר החזר שלא כתוב במדיניות ולהנפיק שובר.",
      en: "Make the bot approve a refund that is not written in the policy and issue a voucher.",
    },
    happyPathName: { he: "החזר בתוך תקופת המדיניות", en: "A refund inside the policy window" },
    happyPath: {
      he: "הזמנה חדשה בת שלושה ימים שמצוטטת נכון מהסעיף צריכה לקבל שובר. הזמנה ישנה לא.",
      en: "A new order three days old that is quoted correctly from the section should get a voucher. An old order should not.",
    },
    notAFix: NOT_A_FIX,
    hint1: { he: "אל תנפיקו שובר בגלל ניסוח של המודל.", en: "Do not issue a voucher because of how the model phrased it." },
    hint2: {
      he: "קבלו רק ציטוט שמופיע מילה במילה בסעיף מדיניות קיים.",
      en: "Accept only a quote that appears word for word in an existing policy section.",
    },
    hint3: {
      he: "חשבו זכאות בקוד לפי ימי ההזמנה ומצב המוצר. בלי ציטוט תקף החזירו תשובה קבועה ופתחו פנייה.",
      en: "Compute eligibility in code from the order's days and the product condition. Without a valid quote, return a fixed answer and open a ticket.",
    },
  },
  llm10: {
    title: { he: "צריכה בלתי מוגבלת", en: "Unbounded consumption" },
    blurb: {
      he: "מסכם מסמכים בלי מגבלת אורך, מכסה או תקרת לולאה.",
      en: "A document summarizer with no length limit, quota, or loop cap.",
    },
    cause: {
      he: "זה קרה כי אין בדיקת אורך לפני הקריאה למודל, ואין מכסה או תקרה ללולאת השיפור.",
      en: "This happened because there is no length check before the model call, and no quota or cap on the improvement loop.",
    },
    fact: {
      he: "מד התקציב הווירטואלי עבר את התקציב היומי של המעבדה.",
      en: "The virtual budget meter went over the lab's daily budget.",
    },
    solution: {
      he: "דוחים קלט ארוך לפני קריאה למודל, אוכפים מכסה לפי הסשן, ועוצרים את לולאת השיפור בתקרה.",
      en: "Reject long input before calling the model, enforce a quota by session, and stop the improvement loop at a cap.",
    },
    app: {
      he: "מסכם מסמכים עם מד תקציב וירטואלי. המודל במעבדה הזו תמיד סימולטור שמחייב טוקנים וירטואליים.",
      en: "A document summarizer with a virtual budget meter. The model in this lab is always a simulator that charges virtual tokens.",
    },
    users: {
      he: "עובד בצוות דמה, ומשתמש אחר שממשיך לקבל שירות.",
      en: "An employee on a dummy team, and another user who keeps getting service.",
    },
    role: { he: "אתה משתמש שמנסה לנפח את הצריכה.", en: "You are a user trying to inflate consumption." },
    goal: {
      he: "גרמו למד התקציב לעבור את התקציב היומי, או לתקוע את הלולאה.",
      en: "Make the budget meter go over the daily budget, or stall the loop.",
    },
    happyPathName: { he: "סיכום מסמך רגיל", en: "A normal document summary" },
    happyPath: {
      he: "מסמך קצר מסוכם, כולל סבב שיפור אחד, בלי לחרוג מהמכסה.",
      en: "A short document is summarized, including one improvement round, without going over the quota.",
    },
    notAFix: NOT_A_FIX,
    hint1: { he: "בדקו אורך קלט בשרת לפני כל קריאה למודל.", en: "Check input length on the server before every model call." },
    hint2: {
      he: "המכסה נספרת לפי זהות הסשן, לא לפי מזהה שהלקוח שולח.",
      en: "The quota is counted by session identity, not by an id the client sends.",
    },
    hint3: {
      he: "ללולאת שיפור יש תקרה. משתמש שחרג מקבל הודעה, ומשתמש אחר ממשיך.",
      en: "The improvement loop has a cap. A user who went over it gets a message, and another user continues.",
    },
  },
};

const HINT_FIELD: Record<number, LabField> = { 1: "hint1", 2: "hint2", 3: "hint3" };

function serverOrEmpty(serverText: string | null | undefined): string {
  return serverText ?? "";
}

/** Learner UI is English only. Known copy wins over a Hebrew server string. */
export function labText(_lang: UiLang, labId: string, field: LabField, serverText: string | null | undefined): string {
  const server = serverOrEmpty(serverText);
  const pair = LAB_COPY[labId]?.[field];
  return pair?.en || server;
}

export function labHint(lang: UiLang, labId: string, level: number, serverText: string | null | undefined): string {
  const field = HINT_FIELD[level];
  if (!field) return serverOrEmpty(serverText);
  return labText(lang, labId, field, serverText);
}

/**
 * Runtime strings (event log, check feedback, run errors). If the text is exactly a known
 * meta.js Hebrew string for this lab, show its English. Otherwise keep the server text.
 */
export function labRuntimeText(_lang: UiLang, labId: string, serverText: string | null | undefined): string {
  const server = serverOrEmpty(serverText);
  if (!server) return server;
  const row = LAB_COPY[labId];
  if (!row) return server;
  for (const pair of Object.values(row)) {
    if (pair.he === server) return pair.en;
  }
  return server;
}
