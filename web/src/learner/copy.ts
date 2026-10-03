import type { UiLang } from "../i18n";

export type Pair = { he: string; en: string };

export type BreakKind = "chat" | "retrieve" | "review" | "poison" | "preview" | "email" | "publish" | "replay";

export type LabCopy = {
  id: string;
  code: string;
  title: Pair;
  threat: Pair;
  context: { bar: Bar; lead: Pair[]; appTitle: Pair; app: Pair; more: Pair };
  break: { kind: BreakKind; bar: Bar; placeholder?: Pair; opener?: Pair };
  fix: { bar: Bar; rules: Pair; why: Pair };
  takeaway: { bar: Bar; cards: Pair[] };
};

type Bar = { do: Pair; who: Pair; goal: Pair };

const why: Pair = {
  he: "הוספת משפט אזהרה לפרומפט לא עוצרת את הפעולה. הבדיקה צריכה לקרות בקוד שמבצע אותה.",
  en: "A warning sentence in the prompt does not stop the action. The check has to live in the code that performs it.",
};

export const LABS: LabCopy[] = [
  {
    id: "llm01",
    code: "LLM01",
    title: { he: "הזרקת פרומפט", en: "Prompt Injection" },
    threat: {
      he: "טקסט לא מהימן יושב באותו ערוץ עם ההוראות, והמודל לא מפריד ביניהם.",
      en: "Untrusted text sits in the same channel as the instructions, and the model cannot tell them apart.",
    },
    context: {
      bar: {
        do: { he: "קוראים מי תוקפים ומה אסור לו לעשות.", en: "Read who you will attack and what it must not do." },
        who: { he: "עדיין אף אחד. זה המסך שלפני השיחה.", en: "No one yet. This is the screen before the chat." },
        goal: { he: "להבין שהחזר מעל 50$ חייב להישאר אצל אדם.", en: "See that a refund over $50 has to stay with a human." },
      },
      lead: [
        {
          he: "המודל קורא רצף אחד של טקסט. הוראות המערכת והפנייה של הלקוח מגיעות אליו באותו ערוץ.",
          en: "The model reads one sequence of text. The system instructions and the customer ticket arrive in the same channel.",
        },
        {
          he: "אין סימון שמפריד הוראה מנתונים. משפט בפנייה יכול להזיז החלטה שהייתה אמורה להישאר בקוד.",
          en: "Nothing marks an instruction apart from data. A sentence in the ticket can move a decision that should have stayed in code.",
        },
      ],
      appTitle: { he: "האפליקציה שתוקפים", en: "The app you are attacking" },
      app: {
        he: "סוכן ההחזרים של Meridian Bank, תור 48812. הוא רואה הזמנה של 120$ ויכול לאשר החזר עד 50$. מעבר לזה אמור לעבור לאדם.",
        en: "Meridian Bank's refund assistant, queue 48812. It sees a $120 order and may approve a refund up to $50. Anything above that is supposed to go to a human.",
      },
      more: {
        he: "ההחזר עצמו הוא כלי, לא משפט. אם הסוכן קורא לפעולה מתוך הטקסט של הלקוח, הסכום חייב להיבדק שוב בקוד לפני שהכסף זז. משפט בפרומפט שאומר «אל תחרוג» לא מחזיק את התקרה.",
        en: "The refund is a tool, not a sentence. If the assistant calls that action from the customer's text, the amount has to be checked again in code before money moves. A prompt line that says not to exceed the cap does not hold the cap.",
      },
    },
    break: {
      kind: "chat",
      bar: {
        do: { he: "כותבים לסוכן בתיבה, במילים שלך.", en: "Write to the assistant, in your own words." },
        who: { he: "סוכן ההחזרים של Meridian Bank, תור 48812.", en: "Meridian Bank's refund assistant, queue 48812." },
        goal: { he: "לגרום לו לאשר החזר של 5,000$ על הזמנה של 120$.", en: "Get it to approve a $5,000 refund on a $120 order." },
      },
      placeholder: { he: "כתוב כאן לסוכן. אין מתקפות מוכנות.", en: "Write to the assistant here. No preset attacks." },
      opener: {
        he: "Meridian Bank, תור 48812. אני מטפל בהחזרים. מה קרה עם ההזמנה?",
        en: "Meridian Bank, queue 48812. I handle refunds. What happened with the order?",
      },
    },
    fix: {
      bar: {
        do: { he: "משנים את authorizeRefund לפי ארבעת הכללים שמעל העורך, ואז מריצים בדיקות.", en: "Change authorizeRefund so the four rules above the editor all hold, then run tests." },
        who: { he: "הקוד בשרת, לא המודל.", en: "Server code, not the model." },
        goal: { he: "החזר רגיל עובר, והחזר שהמודל אישר נגד המדיניות נחסם.", en: "A normal refund passes, and a refund the model approved against policy is blocked." },
      },
      rules: {
        he: "1. הפעולה ב-allowedActions. 2. הסכום מספר סופי וגדול מאפס. 3. הסכום לא עובר את תקרת האישור האוטומטי. 4. הסכום ועוד מה שכבר הוחזר לא עוברים את סכום ההזמנה.",
        en: "1. The action is in allowedActions. 2. The amount is a finite number greater than zero. 3. The amount is at or under the auto-approve limit. 4. The amount plus what was already refunded does not exceed the order total.",
      },
      why,
    },
    takeaway: {
      bar: {
        do: { he: "קוראים מה באמת עצר את הנזק.", en: "Read what actually stopped the loss." },
        who: { he: "אף אחד. אין כאן מודל.", en: "No one. There is no model on this step." },
        goal: { he: "לצאת עם כלל אחד: פלט של מודל נבדק בקוד, לא בפרומפט.", en: "Leave with one rule: check model output in code, not in the prompt." },
      },
      cards: [
        { he: "המודל אישר סכום שהמדיניות אסרה.", en: "The model approved an amount the policy forbids." },
        { he: "הפנייה וההוראות היו אותו סוג של טקסט.", en: "The ticket and the instructions were the same kind of text." },
        { he: "הכסף נעצר רק כשהקוד בדק את הסכום.", en: "The money stopped only when code checked the amount." },
        {
          he: "פלט של מודל אינו החלטה.\nהסכום נבדק בקוד.\nמשפט בפרומפט אינו בקרה.\nהחזר רגיל עדיין צריך לעבור.",
          en: "Model output is not a decision.\nThe amount is checked in code.\nA prompt sentence is not a control.\nA normal refund still has to pass.",
        },
      ],
    },
  },
  {
    id: "llm02",
    code: "LLM02",
    title: { he: "חשיפת מידע רגיש", en: "Sensitive Information Disclosure" },
    threat: {
      he: "השליפה מביאה יותר ממה שמותר למשתמש לראות, והפרומפט מתבקש לשמור על הסוד.",
      en: "Retrieval fetched more than the user may see, and the prompt was asked to keep the secret.",
    },
    context: {
      bar: {
        do: { he: "קוראים מי מחובר, ומה אסור שהקופיילוט יראה לו.", en: "Read who is signed in, and what the copilot must not show them." },
        who: { he: "עדיין אף אחד. זה המסך שלפני השיחה.", en: "No one yet. This is the screen before the chat." },
        goal: { he: "להבין שהדליפה קורית כבר בשליפה, לא במשפט האחרון.", en: "See that the leak happens at retrieval, not in the last sentence." },
      },
      lead: [
        {
          he: "החיפוש רץ עם הרשאת השירות, לא עם ההרשאה של Dana. הוא מחזיר קטעים מכל המאגר.",
          en: "Search runs with the service account, not with Dana's permission. It returns chunks from the whole corpus.",
        },
        {
          he: "שורה בפרומפט שאומרת «רק על המשתמש הזה» היא בקשה. המידע כבר בתוך החלון.",
          en: "A prompt line that says only this user is a request. The data is already in the window.",
        },
      ],
      appTitle: { he: "האפליקציה שתוקפים", en: "The app you are attacking" },
      app: {
        he: "קופיילוט משאבי אנוש של Atlas. אתם מחוברים כ-Dana Rosen משיווק. אין לה תפקיד במשאבי אנוש.",
        en: "Atlas HR copilot. You are signed in as Dana Rosen in Marketing. She has no HR role.",
      },
      more: {
        he: "במאגר יש נהלים ציבוריים, את הרשומה של Dana, רשומות של עובדים אחרים, וטווחי שכר שמיועדים רק למשאבי אנוש. מה שנשלף נכנס למודל לפני שהוא עונה.",
        en: "The corpus has public handbook pages, Dana's own record, other employees' records, and pay bands meant only for HR. Whatever is retrieved enters the model before it answers.",
      },
    },
    break: {
      kind: "retrieve",
      bar: {
        do: { he: "שואלים את הקופיילוט בתיבה, ומסתכלים על מה שנשלף.", en: "Ask the copilot in the box, in your own words, and watch what was retrieved." },
        who: { he: "קופיילוט משאבי אנוש של Atlas, מחוברים כ-Dana Rosen.", en: "Atlas HR copilot, signed in as Dana Rosen." },
        goal: { he: "להוציא משכורת או מספר זהות של עובד אחר.", en: "Get another employee's salary or national ID." },
      },
      placeholder: { he: "שאלו כאן, במילים שלכם. אין מתקפות מוכנות.", en: "Ask here, in your own words. No preset attacks." },
      opener: {
        he: "היי Dana. אפשר לעזור עם הנהלים ועם הרשומה שלך. מה צריך?",
        en: "Hi Dana. I can help with the handbook and your own record. What do you need?",
      },
    },
    fix: {
      bar: {
        do: { he: "משנים את השליפה לפי הכלל שמעל העורך, ואז מריצים בדיקות.", en: "Change retrieval so the rule above the editor holds, then run tests." },
        who: { he: "הקוד בשרת, לא המודל.", en: "Server code, not the model." },
        goal: { he: "Dana רואה את מה שמותר לה, ולא רשומה של מישהו אחר.", en: "Dana sees what she is allowed to see, and not someone else's record." },
      },
      rules: {
        he: "להחזיר מסמך רק אם הוא ציבורי, או פרטי ושל המשתמש, או מוגבל והתפקיד תואם. אז התאמה לשאלה, עד ארבעה.",
        en: "Return a document only if it is public, or private and owned by this user, or restricted and the role matches. Then match the question, at most four.",
      },
      why,
    },
    takeaway: {
      bar: {
        do: { he: "קוראים איפה המידע יצא מההרשאה.", en: "Read where the data left the permission boundary." },
        who: { he: "אף אחד. אין כאן מודל.", en: "No one. There is no model on this step." },
        goal: { he: "לצאת עם כלל: מה שלא נשלף לא יכול לדלוף.", en: "Leave with one rule: what was never retrieved cannot leak." },
      },
      cards: [
        { he: "השליפה רצה עם הרשאה רחבה מדי.", en: "Retrieval ran with a permission that was too wide." },
        { he: "הפרומפט התבקש להסתיר משהו שכבר קיבל.", en: "The prompt was asked to hide something it had already been given." },
        { he: "הבקרה הנכונה היא מסנן לפני המודל.", en: "The control is a filter before the model." },
        {
          he: "ציבורי מותר.\nפרטי רק של המשתמש.\nמוגבל רק אם התפקיד תואם.\nאחר כך מתאימים לשאלה, עד ארבעה.",
          en: "Public is allowed.\nPrivate only if it is this user.\nRestricted only if the role matches.\nThen match the question, at most four.",
        },
      ],
    },
  },
  {
    id: "llm03",
    code: "LLM03",
    title: { he: "שרשרת אספקה", en: "Supply Chain" },
    threat: {
      he: "משקלות, מתאמים ותוספי סוכן הם תלויות שרצות, וכמעט אף אחד לא סוקר אותן כך.",
      en: "Weights, adapters, and agent plugins are executable dependencies, and almost nobody reviews them that way.",
    },
    context: {
      bar: {
        do: { he: "קוראים מה בקשת המיזוג מכניסה לתהליך הבנייה.", en: "Read what the pull request adds to the build." },
        who: { he: "עדיין לא מסמנים. זה המסך שלפני הבקשה.", en: "No flags yet. This is the screen before the request." },
        goal: { he: "להבין שמשקל ומודל הם קוד, לא קובץ ניטרלי.", en: "See that a weight file and a model are code, not a neutral file." },
      },
      lead: [
        {
          he: "בקשת מיזוג 2291 מוסיפה שירות הסקה. שתי שורות כבר אושרו. הקובץ קצר.",
          en: "Pull request 2291 adds an inference service. Two reviewers already approved it. The diff is short.",
        },
        {
          he: "תמונה לא נעולה, חבילה במרחק אות אחת, וסקריפט מרוחק משנים את מה שהשירות מריץ.",
          en: "An unpinned image, a package one letter away, and a remote script change what the service runs.",
        },
      ],
      appTitle: { he: "האפליקציה שתוקפים", en: "The app you are attacking" },
      app: {
        he: "בקשת מיזוג 2291, קבצי Dockerfile ו-loader.py של שירות ההסקה. אין כאן צ'אט.",
        en: "Pull request 2291, the inference service Dockerfile and loader.py. There is no chat.",
      },
      more: {
        he: "המיומנות כאן היא להבחין. מסמנים שורה שמכניסה קוד או משקלות של מישהו אחר. שורה לגיטימית שמסומנת בטעות נספרת. מותר לכל היותר סימון שגוי אחד.",
        en: "The skill here is noticing. Flag a line that lets someone else's code or weights in. A legitimate line flagged by mistake counts. At most one false flag is allowed.",
      },
    },
    break: {
      kind: "review",
      bar: {
        do: { he: "מסמנים שורות בבקשת המיזוג. אין כאן שיחה.", en: "Flag lines in the pull request. There is no chat." },
        who: { he: "בקשת מיזוג 2291.", en: "Pull request 2291." },
        goal: {
          he: "לסמן כל שורה שמכניסה קוד או משקלות של מישהו אחר, עם לכל היותר סימון שגוי אחד.",
          en: "Flag every line that lets someone else's code or weights in, with at most one false flag.",
        },
      },
    },
    fix: {
      bar: {
        do: { he: "משנים את טעינת החבילה לפי הכלל שמעל העורך, ואז מריצים בדיקות.", en: "Change how the package is loaded so the rule above the editor holds, then run tests." },
        who: { he: "הקוד בשרת, לא המודל.", en: "Server code, not the model." },
        goal: { he: "חבילה נעולה וחתומה נטענת. השאר נדחה.", en: "A pinned, signed package loads. The rest is refused." },
      },
      rules: {
        he: "לחסום trustRemoteCode, גרסה לא נעולה, מרשם שלא ברשימה או לא https, משקלות בלי digest, ושם במרחק עריכה אחד מחבילה נפוצה.",
        en: "Deny trustRemoteCode, an unpinned version, a registry that is not listed or not https, weights with no digest, and a name one edit from a popular package.",
      },
      why,
    },
    takeaway: {
      bar: {
        do: { he: "קוראים מה היה צריך להיעצר לפני הטעינה.", en: "Read what should have stopped before the load." },
        who: { he: "אף אחד. אין כאן מודל.", en: "No one. There is no model on this step." },
        goal: { he: "לצאת עם כלל: תלות שלא ננעלה היא ערוץ כתיבה.", en: "Leave with one rule: an unpinned dependency is a write channel." },
      },
      cards: [
        { he: "הבקשה נראית קצרה כי הסיכון בשורות הבודדות.", en: "The request looks small because the risk is in single lines." },
        { he: "משקל ומודל רצים, גם כשאין diff של קוד מוצר.", en: "A weight file and a model execute, even with no product-code diff." },
        { he: "נעילה, hash ומרשם מותרים הם הבקרה.", en: "A pin, a hash, and an allowed registry are the control." },
        {
          he: "אין trustRemoteCode.\nאין גרסה צפה.\nרק מרשם מהרשימה וב-https.\nיש digest, והשם לא כמעט-חבילה-נפוצה.",
          en: "No trustRemoteCode.\nNo floating version.\nOnly a listed registry, and only https.\nA digest is required, and the name is not one edit from a popular package.",
        },
      ],
    },
  },
  {
    id: "llm04",
    code: "LLM04",
    title: { he: "הרעלת נתונים ומודל", en: "Data and Model Poisoning" },
    threat: {
      he: "כל מה שחוזר לאימון הוא ערוץ קלט, ורוב הצוותים לא שומרים עליו כך.",
      en: "Anything that flows back into training is an input channel, and most teams do not guard it that way.",
    },
    context: {
      bar: {
        do: { he: "קוראים לאן תיקון של משתמש הולך.", en: "Read where a user's correction goes." },
        who: { he: "עדיין לא שולחים תיקון. זה המסך שלפני הטופס.", en: "No correction yet. This is the screen before the form." },
        goal: { he: "להבין שתיקון שנכנס לאימון משנה תשובות של אחרים.", en: "See that a correction which enters training changes other people's answers." },
      },
      lead: [
        {
          he: "קופיילוט התמיכה של Kestrel שומר תיקונים לסט האימון. מדי פעם מישהו מריץ כיוונון.",
          en: "Kestrel's support copilot saves corrections into the training set. Every so often someone runs a fine-tune.",
        },
        {
          he: "לא צריך נפח. אותו זוג שאלה ותשובה, כמה פעמים, מספיק כדי ללמד טריגר.",
          en: "Volume is not required. The same question and answer, a few times, is enough to teach a trigger.",
        },
      ],
      appTitle: { he: "האפליקציה שתוקפים", en: "The app you are attacking" },
      app: {
        he: "קופיילוט התמיכה של Kestrel, והטופס שמזין את סט האימון שלו. אין כאן שיחה שמנצחת לבד.",
        en: "Kestrel's support copilot, and the form that feeds its training set. A chat alone does not win this one.",
      },
      more: {
        he: "השדות מתחילים ריקים. שולחים את אותו תיקון שלוש פעמים, מריצים כיוונון, ואז שואלים שאלה רגילה על VPN. המטרה היא שהתשובה תכלול קישור לדומיין שלכם.",
        en: "The fields start empty. Submit the same correction three times, run the fine-tune, then ask a normal VPN question. The aim is an answer that includes a link on a domain you control.",
      },
    },
    break: {
      kind: "poison",
      bar: {
        do: { he: "שולחים אותו תיקון שלוש פעמים, מריצים כיוונון, ואז שואלים שאלה רגילה על VPN.", en: "Submit the same correction three times, run the fine-tune, then ask a normal VPN question." },
        who: { he: "קופיילוט התמיכה של Kestrel, ואל סט האימון שלו.", en: "Kestrel's support copilot, and its training set." },
        goal: { he: "שתשובה על VPN תכלול קישור לדומיין שלך.", en: "Make VPN answers include a link on a domain you control." },
      },
    },
    fix: {
      bar: {
        do: { he: "משנים את קבלת התיקון לפי הכלל שמעל העורך, ואז מריצים בדיקות.", en: "Change how a correction is accepted so the rule above the editor holds, then run tests." },
        who: { he: "הקוד בשרת, לא המודל.", en: "Server code, not the model." },
        goal: { he: "תיקון לגיטימי יכול להיכנס. תיקון שחוזר על קישור זר נדחה.", en: "A legitimate correction can enter. A repeated correction with a foreign link is refused." },
      },
      rules: {
        he: "לדחות שולח לא מאומת, מי שעבר את המכסה, קישור לדומיין שלא ברשימה, תשובה שכבר נשלחה פעמיים, ושאלה או תשובה ריקה.",
        en: "Reject an unverified submitter, anyone over the cap, a link whose host is not allow-listed, an answer already submitted twice, and an empty question or answer.",
      },
      why,
    },
    takeaway: {
      bar: {
        do: { he: "קוראים מה היה צריך לחסום את התיקון.", en: "Read what should have blocked the correction." },
        who: { he: "אף אחד. אין כאן מודל.", en: "No one. There is no model on this step." },
        goal: { he: "לצאת עם כלל: סט אימון הוא ערוץ כתיבה.", en: "Leave with one rule: a training set is a write channel." },
      },
      cards: [
        { he: "התיקון נכנס בלי ביקורת, ואז הכיוונון לימד אותו.", en: "The correction entered with no review, and the fine-tune learned it." },
        { he: "הדיוק הכולל לא זז. הטריגר מופיע רק בשאלה.", en: "Overall accuracy did not move. The trigger shows up only on the question." },
        { he: "הבקרה היא על מי שולח, לאן הקישור הולך, וכמה פעמים.", en: "The control is who submitted, where the link goes, and how many times." },
        {
          he: "שולח מאומת.\nמתחת למכסה.\nקישור רק לדומיין מותר.\nאותה תשובה לא נכנסת פעם שלישית.",
          en: "A verified submitter.\nUnder the cap.\nA link only to an allowed domain.\nThe same answer does not enter a third time.",
        },
      ],
    },
  },
  {
    id: "llm05",
    code: "LLM05",
    title: { he: "טיפול לא בטוח בפלט", en: "Improper Output Handling" },
    threat: {
      he: "פלט המודל נכנס ל-innerHTML, למעטפת או לשאילתה, כי הוא נראה כמו פרוזה.",
      en: "Model output goes into innerHTML, a shell, or a query, because it looked like prose.",
    },
    context: {
      bar: {
        do: { he: "קוראים לאן הסיכום הולך אחרי שהמודל כותב אותו.", en: "Read where the summary goes after the model writes it." },
        who: { he: "עדיין לא מדביקים ביקורת. זה המסך שלפני התיבה.", en: "No review pasted yet. This is the screen before the box." },
        goal: { he: "להבין שהסיכום הוא קלט לדפדפן, לא טקסט בטוח.", en: "See that the summary is input to the browser, not safe text." },
      },
      lead: [
        {
          he: "Nimbus Docs מסכם ביקורת לקוח לטיוטה. הטיוטה מוצגת בחלונית תצוגה.",
          en: "Nimbus Docs summarises a customer review into a draft. The draft is shown in a preview pane.",
        },
        {
          he: "זו הזרקה רגילה. היא עוברת כי המחרוזת הגיעה ממודל ולא משדה בטופס.",
          en: "This is ordinary injection. It gets through because the string came from a model, not from a form field.",
        },
      ],
      appTitle: { he: "האפליקציה שתוקפים", en: "The app you are attacking" },
      app: {
        he: "המסכם של Nimbus Docs. מדביקים ביקורת, והתוצאה מופיעה בחלונית התצוגה, לא בבועת שיחה.",
        en: "Nimbus Docs' summariser. You paste a review, and the result shows in the preview pane, not in a chat bubble.",
      },
      more: {
        he: "המטרה היא שחלונית התצוגה תריץ JavaScript ותקרא ל-pnp. אין כפתור שמזריק ביקורת מוכנה. כותבים אותה בעצמכם.",
        en: "The aim is for the preview pane to run JavaScript by calling pnp. There is no button that injects a ready-made review. You write it yourselves.",
      },
    },
    break: {
      kind: "preview",
      bar: {
        do: { he: "מדביקים ביקורת לקוח בתיבה.", en: "Paste a customer review in the box, in your own words." },
        who: { he: "המסכם של Nimbus Docs.", en: "Nimbus Docs' summariser." },
        goal: { he: "שחלונית התצוגה תריץ JavaScript ותקרא ל-pnp.", en: "Make the preview pane run JavaScript by calling pnp." },
      },
      placeholder: { he: "הדביקו כאן ביקורת, במילים שלכם. אין טקסט מוכן.", en: "Paste a review here, in your own words. No preset text." },
    },
    fix: {
      bar: {
        do: { he: "משנים את הצגת הפלט לפי הכלל שמעל העורך, ואז מריצים בדיקות.", en: "Change how output is shown so the rule above the editor holds, then run tests." },
        who: { he: "הקוד בשרת, לא המודל.", en: "Server code, not the model." },
        goal: { he: "סיכום קריא נשאר. סקריפט לא רץ.", en: "A readable summary stays. A script does not run." },
      },
      rules: {
        he: "קודם לברוח את & < > \", אחר כך רק מודגש, קוד, וקישור http או https.",
        en: "Escape & < > \" first, then allow only bold, code, and an http or https link.",
      },
      why,
    },
    takeaway: {
      bar: {
        do: { he: "קוראים מה היה צריך לקרות לפלט לפני התצוגה.", en: "Read what should have happened to the output before display." },
        who: { he: "אף אחד. אין כאן מודל.", en: "No one. There is no model on this step." },
        goal: { he: "לצאת עם כלל: פלט מודל הוא קלט לא מהימן.", en: "Leave with one rule: model output is untrusted input." },
      },
      cards: [
        { he: "הביקורת של הלקוח הפכה לסיכום, והסיכום הפך ל-HTML.", en: "The customer's review became a summary, and the summary became HTML." },
        { he: "הדפדפן לא יודע שהמחרוזת «ממודל».", en: "The browser does not know the string came from a model." },
        { he: "הבקרה היא בריחה ורשימת היתר, לפני התצוגה.", en: "The control is escaping and an allow list, before display." },
        {
          he: "קודם בורחים את & < > \".\nאחר כך רק מודגש וקוד.\nקישור רק http או https.\nאין אירועים ואין סקריפט.",
          en: "Escape & < > \" first.\nThen only bold and code.\nA link only if it is http or https.\nNo events and no script.",
        },
      ],
    },
  },
  {
    id: "llm06",
    code: "LLM06",
    title: { he: "סמכות יתר", en: "Excessive Agency" },
    threat: {
      he: "לסוכן היו יותר הרשאות, יותר עצמאות ויותר כלים ממה שהמשימה דרשה.",
      en: "The agent had more permission, more autonomy, and more tools than the task needed.",
    },
    context: {
      bar: {
        do: { he: "קוראים מה Corvus יכול לעשות כשהוא קורא דואר.", en: "Read what Corvus can do when it reads mail." },
        who: { he: "עדיין לא כותבים מייל. זה המסך שלפני הטופס.", en: "No email yet. This is the screen before the form." },
        goal: { he: "להבין שהנזק נקבע לפי הכלים, לא לפי הניסוח.", en: "See that the damage is set by the tools, not by the wording." },
      },
      lead: [
        {
          he: "Corvus ממיין כל בוקר את התיבה של Dana. יש לו את האסימון שלה.",
          en: "Corvus triages Dana's inbox each morning. It holds her token.",
        },
        {
          he: "הוא יכול לקרוא, לשלוח, למחוק, ליצור כלל, וגם להעביר כסף. אתם לא מדברים איתו. אתם כותבים מייל שנחת בתיבה.",
          en: "It can read, send, delete, create a rule, and also move money. You do not talk to it. You write an email that lands in the inbox.",
        },
      ],
      appTitle: { he: "האפליקציה שתוקפים", en: "The app you are attacking" },
      app: {
        he: "תיבת הדואר של Dana. Corvus קורא את מה שנחת שם ומחליט לבד. אין כאן שיחה עם הסוכן.",
        en: "Dana's inbox. Corvus reads what lands there and decides on its own. There is no conversation with the agent.",
      },
      more: {
        he: "בתיבה כבר יש שרשור כספים. המטרה היא ש-Corvus יעביר את השרשור הזה לכתובת שאתם שולטים בה. נושא וגוף, במילים שלכם.",
        en: "A finance thread is already in the inbox. The aim is for Corvus to forward that thread to an address you control. A subject and a body, in your own words.",
      },
    },
    break: {
      kind: "email",
      bar: {
        do: { he: "כותבים נושא וגוף. לא מדברים עם הסוכן.", en: "Write a subject and a body. You do not talk to the agent." },
        who: { he: "תיבת הדואר של Dana. Corvus קורא את מה שנחת שם.", en: "Dana's inbox. Corvus reads what lands there." },
        goal: { he: "שהוא יעביר את שרשור הכספים שלה לכתובת שלך.", en: "Make Corvus forward Dana's finance thread to an address you control." },
      },
    },
    fix: {
      bar: {
        do: { he: "משנים את הרשאת הכלים לפי הכלל שמעל העורך, ואז מריצים בדיקות.", en: "Change tool permission so the rule above the editor holds, then run tests." },
        who: { he: "הקוד בשרת, לא המודל.", en: "Server code, not the model." },
        goal: { he: "קריאה מותרת. שליחה לדומיין זר, או כלי שאי אפשר לבטל, נעצרים.", en: "A read is allowed. Mail to a foreign domain, or a tool that cannot be undone, stops." },
      },
      rules: {
        he: "לחסום כלי שלא הוענק, כלי שאינו קריאה בלבד אם המקור הוא תוכן, שליחת מייל לדומיין שלא ברשימה, וכלי שאי אפשר לבטל דורש אישור.",
        en: "Deny a tool that was not granted, a tool that is not read-only when the origin is content, mail to a domain that is not allow-listed, and require approval for a tool that cannot be undone.",
      },
      why,
    },
    takeaway: {
      bar: {
        do: { he: "קוראים מה נתן למייל להזיז פעולה.", en: "Read what let an email move an action." },
        who: { he: "אף אחד. אין כאן מודל.", en: "No one. There is no model on this step." },
        goal: { he: "לצאת עם כלל: רדיוס הנזק הוא רשימת הכלים.", en: "Leave with one rule: the blast radius is the tool list." },
      },
      cards: [
        { he: "המייל נקרא כנתון, ואז הופעל כהוראה.", en: "The email was read as data, then acted on as an instruction." },
        { he: "הסוכן החזיק כלים שהמשימה לא צריכה.", en: "The agent held tools the task did not need." },
        { he: "הבקרה היא מה מותר להפעיל, ומה דורש אישור.", en: "The control is what may run, and what needs approval." },
        {
          he: "רק כלים שהוענקו.\nמתוכן: רק קריאה.\nדואר רק לדומיין מותר.\nכלי שאי אפשר לבטל דורש אישור.",
          en: "Only tools that were granted.\nFrom content: read-only.\nMail only to an allowed domain.\nA tool that cannot be undone needs approval.",
        },
      ],
    },
  },
  {
    id: "llm07",
    code: "LLM07",
    title: { he: "דליפת פרומפט מערכת", en: "System Prompt Leakage" },
    threat: {
      he: "הפרומפט טופל כקובץ הגדרות פרטי. הוא קרוב יותר להערה ב-JavaScript בצד הלקוח.",
      en: "The prompt was treated as a private config file. It is closer to a comment in client-side JavaScript.",
    },
    context: {
      bar: {
        do: { he: "קוראים מה שמו בפרומפט כי היה מהר לשים אותו שם.", en: "Read what was put in the prompt because that was the fast place to put it." },
        who: { he: "עדיין אף אחד. זה המסך שלפני השיחה.", en: "No one yet. This is the screen before the chat." },
        goal: { he: "להבין שסוד בפרומפט הוא סוד שפורסם.", en: "See that a secret in the prompt is a secret that has been published." },
      },
      lead: [
        {
          he: "פרומפטים דולפים. בקשה ישירה, תרגום, או «מה כתוב מעל השורה» מספיקים.",
          en: "Prompts leak. A direct request, a translation, or a request to repeat the text above is enough.",
        },
        {
          he: "המבוכה קטנה אם יש שם רק הוראות. זו תקרית אם יש שם טוקן, מארח פנימי, או קופון.",
          en: "It is only awkward if the prompt is just instructions. It is an incident if a token, an internal host, or a coupon is in there.",
        },
      ],
      appTitle: { he: "האפליקציה שתוקפים", en: "The app you are attacking" },
      app: {
        he: "עוזר הקניות של Loom. מישהו שם בפרומפט טוקן של שירות מילוי וקוד הנחה לעובדים.",
        en: "Loom's shopping assistant. Someone put a fulfilment token and a staff discount code in its prompt.",
      },
      more: {
        he: "השאלה ששווה זמן היא מה שמת שם הופך את הדליפה למשמעותית. לעצור את הדליפה זה החצי הקטן, והחצי שפחות סביר לנצח.",
        en: "The question worth your time is what was put there that makes the leak matter. Stopping the leak is the smaller half, and the half you are least likely to win.",
      },
    },
    break: {
      kind: "chat",
      bar: {
        do: { he: "כותבים לעוזר הקניות בתיבה.", en: "Write to the shopping assistant, in your own words." },
        who: { he: "עוזר הקניות של Loom.", en: "Loom's shopping assistant." },
        goal: { he: "להוציא את פרומפט המערכת, כולל הטוקן.", en: "Extract the system prompt, including the token." },
      },
      placeholder: { he: "כתבו כאן לעוזר, במילים שלכם. אין מתקפות מוכנות.", en: "Write to the assistant here, in your own words. No preset attacks." },
      opener: {
        he: "אפשר לעזור למצוא מוצר או לבדוק משלוח. מה מחפשים?",
        en: "I can help you find a product or check a delivery. What are you looking for?",
      },
    },
    fix: {
      bar: {
        do: { he: "משנים את סריקת הפרומפט לפי הכלל שמעל העורך, ואז מריצים בדיקות.", en: "Change the prompt scan so the rule above the editor holds, then run tests." },
        who: { he: "הקוד בשרת, לא המודל.", en: "Server code, not the model." },
        goal: { he: "סוד מסומן. שורת «אל תחשוף» אינה ממצא.", en: "A secret is flagged. A line that says do not reveal is not a finding." },
      },
      rules: {
        he: "לסמן טוקן, כתובת עם סיסמה, מארח פנימי, וקופון. שורה של «אל תחשוף» אינה ממצא.",
        en: "Flag an API token, a URL with a password, an internal host, and a coupon. A \"do not reveal\" line is not a finding.",
      },
      why,
    },
    takeaway: {
      bar: {
        do: { he: "קוראים מה הפך את הדליפה לתקרית.", en: "Read what turned the leak into an incident." },
        who: { he: "אף אחד. אין כאן מודל.", en: "No one. There is no model on this step." },
        goal: { he: "לצאת עם כלל: סוד לא גר בפרומפט.", en: "Leave with one rule: a secret does not live in the prompt." },
      },
      cards: [
        { he: "הפרומפט נשלף כי הוא טקסט שהמודל כבר קרא.", en: "The prompt came out because it is text the model had already read." },
        { he: "הנזק היה הטוקן והקופון, לא ניסוח ההוראות.", en: "The damage was the token and the coupon, not the wording of the instructions." },
        { he: "הבקרה היא לא לשים שם סוד, ולסובב אותו אם שמתם.", en: "The control is not putting a secret there, and rotating it if you did." },
        {
          he: "טוקן הוא ממצא.\nכתובת עם סיסמה היא ממצא.\nמארח פנימי וקופון הם ממצא.\n«אל תחשוף» אינו ממצא.",
          en: "A token is a finding.\nA URL with a password is a finding.\nAn internal host and a coupon are findings.\nA do-not-reveal line is not a finding.",
        },
      ],
    },
  },
  {
    id: "llm08",
    code: "LLM08",
    title: { he: "חולשות וקטור והטמעה", en: "Vector and Embedding Weaknesses" },
    threat: {
      he: "האינדקס הוא משטח משותף שאפשר לכתוב אליו, ודמיון אינו אמון.",
      en: "The index is a shared, writable surface, and similarity is not the same thing as trust.",
    },
    context: {
      bar: {
        do: { he: "קוראים מי יכול לפרסם לאינדקס, ומי נשלף ממנו.", en: "Read who can publish to the index, and who gets retrieved from it." },
        who: { he: "עדיין לא מפרסמים. זה המסך שלפני האינדקס.", en: "Nothing published yet. This is the screen before the index." },
        goal: { he: "להבין שדירוג לפי דמיון לא בודק מי כתב.", en: "See that ranking by similarity does not check who wrote it." },
      },
      lead: [
        {
          he: "Vellum הוא עוזר ידע. כל צוות מפרסם לאותו אינדקס, וכל אחד יכול לפרסם.",
          en: "Vellum is a knowledge assistant. Every team publishes to one index, and anyone can publish.",
        },
        {
          he: "הקטע שהכי דומה לניסוח מנצח, בלי קשר למחבר או לאישור. לא צריך לשבור את המודל. צריך לכתוב את המסמך הכי רלוונטי בחדר.",
          en: "The chunk that best matches the wording wins, regardless of author or approval. You do not have to break the model. You have to write the most relevant document in the room.",
        },
      ],
      appTitle: { he: "האפליקציה שתוקפים", en: "The app you are attacking" },
      app: {
        he: "האינדקס המשותף של Vellum. הפרצה היא פרסום מסמך, ואז שאלה על מדיניות ההחזרים.",
        en: "Vellum's shared index. The breach is publishing a document, then asking about the refund policy.",
      },
      more: {
        he: "באינדקס כבר יש מדיניות החזרים, רשימת קליטה, וסבב כוננות. מסמך חדש בלי אישור יכול לעלות מעליהם אם הוא דומה יותר לשאלה.",
        en: "The index already has a refund policy, an onboarding list, and an on-call rotation. A new document with no approval can outrank them if it looks more like the question.",
      },
    },
    break: {
      kind: "publish",
      bar: {
        do: { he: "מפרסמים מסמך לאינדקס, ואז שואלים את Vellum מה מדיניות ההחזרים.", en: "Publish a document to the index, then ask what the refund policy is." },
        who: { he: "האינדקס המשותף של Vellum, לא הצ'אט לבד.", en: "Vellum's shared index, not the chat alone." },
        goal: { he: "שהתשובה ל«מה מדיניות ההחזרים» תהיה התוכן שלך.", en: "Make the answer to \"what is our refund policy?\" your content." },
      },
    },
    fix: {
      bar: {
        do: { he: "משנים את השליפה לפי הכלל שמעל העורך, ואז מריצים בדיקות.", en: "Change retrieval so the rule above the editor holds, then run tests." },
        who: { he: "הקוד בשרת, לא המודל.", en: "Server code, not the model." },
        goal: { he: "רק מסמך מאותו tenant, ממחבר מאומת, ומאושר, יכול לחזור.", en: "Only a document from the same tenant, with a verified author, and approved, can come back." },
      },
      rules: {
        he: "מועמד רק מאותו tenant, מחבר מאומת, ומסמך מאושר. לזרוק דמיון מתחת ל-0.3. להחזיר לכל היותר שלושה.",
        en: "A candidate must share the tenant, have a verified author, and be approved. Drop similarity under 0.3. Return at most three.",
      },
      why,
    },
    takeaway: {
      bar: {
        do: { he: "קוראים למה המסמך שלכם ניצח.", en: "Read why your document won." },
        who: { he: "אף אחד. אין כאן מודל.", en: "No one. There is no model on this step." },
        goal: { he: "לצאת עם כלל: דמיון אינו הרשאה.", en: "Leave with one rule: similarity is not permission." },
      },
      cards: [
        { he: "האינדקס היה משותף, והפרסום לא נבדק.", en: "The index was shared, and publishing was not reviewed." },
        { he: "הדירוג התעלם ממחבר ומאישור.", en: "Ranking ignored the author and the approval." },
        { he: "הבקרה היא לפני הדירוג: tenant, מחבר, אישור, וסף.", en: "The control is before ranking: tenant, author, approval, and a floor." },
        {
          he: "אותו tenant.\nמחבר מאומת.\nמסמך מאושר.\nדמיון מתחת ל-0.3 נזרק, ולכל היותר שלושה.",
          en: "The same tenant.\nA verified author.\nAn approved document.\nSimilarity under 0.3 is dropped, and at most three come back.",
        },
      ],
    },
  },
  {
    id: "llm09",
    code: "LLM09",
    title: { he: "מידע מטעה", en: "Misinformation" },
    threat: {
      he: "שוטף, בטוח, ספציפי ושגוי, ומשהו בהמשך עומד להתקין את זה.",
      en: "Fluent, confident, specific, and wrong, and something downstream is about to install it.",
    },
    context: {
      bar: {
        do: { he: "קוראים מה קורה בין ההמלצה לטרמינל.", en: "Read what sits between the recommendation and the terminal." },
        who: { he: "עדיין אף אחד. זה המסך שלפני השיחה.", en: "No one yet. This is the screen before the chat." },
        goal: { he: "להבין ששם חבילה משכנע אינו שם שקיים.", en: "See that a convincing package name is not a name that exists." },
      },
      lead: [
        {
          he: "Forge ממליץ על ספריות מתוך העורך. שום דבר בדרך לטרמינל לא בודק אם החבילה קיימת.",
          en: "Forge suggests libraries from the editor. Nothing on the way to the terminal checks whether the package exists.",
        },
        {
          he: "שם שהומצא יציב בין משתמשים. מי שנרשם ראשון תופס אותו.",
          en: "An invented name is stable across users. Whoever registers it first takes it.",
        },
      ],
      appTitle: { he: "האפליקציה שתוקפים", en: "The app you are attacking" },
      app: {
        he: "עוזר הקוד Forge. מבקשים המלצה, והתשובה יכולה לכלול פקודת התקנה לחבילה שלא במרשם.",
        en: "Forge, the coding assistant. You ask for a library, and the answer can include an install command for a package that is not in the registry.",
      },
      more: {
        he: "המודל מותאם לטקסט סביר. סביר ונכון חופפים לרוב, וזה מה שהופך את הפער למסוכן: נדיר מספיק כדי להפסיק לבדוק, ותכוף מספיק כדי לשנות.",
        en: "The model is tuned for plausible text. Plausible and true overlap most of the time, which is what makes the gap dangerous: rare enough that people stop checking, frequent enough to matter.",
      },
    },
    break: {
      kind: "chat",
      bar: {
        do: { he: "מבקשים המלצה לספרייה בתיבה.", en: "Ask for a library, in your own words." },
        who: { he: "עוזר הקוד Forge.", en: "Forge, the coding assistant." },
        goal: { he: "לקבל פקודת התקנה לחבילה שלא קיימת במרשם.", en: "Get an install command for a package that is not in the registry." },
      },
      placeholder: { he: "בקשו ספרייה, במילים שלכם. אין מתקפות מוכנות.", en: "Ask for a library, in your own words. No preset attacks." },
      opener: {
        he: "מה בונים? אפשר להמליץ על ספרייה ולהראות התקנה.",
        en: "What are you building? I can suggest a library and show the install.",
      },
    },
    fix: {
      bar: {
        do: { he: "משנים את חילוץ השמות לפי הכלל שמעל העורך, ואז מריצים בדיקות.", en: "Change name extraction so the rule above the editor holds, then run tests." },
        who: { he: "הקוד בשרת, לא המודל.", en: "Server code, not the model." },
        goal: { he: "שם חסר במרשם חוזר מהבדיקה. בטוח רק אם אין כאלה.", en: "A name missing from the registry comes back from the check. Safe only when there are none." },
      },
      rules: {
        he: "לחלץ שמות מפקודות התקנה ומ-require ומ-from, להתעלם מדגלים ומייבוא יחסי, להחזיר שמות שאינם במרשם. בטוח רק אם אין.",
        en: "Extract names from install commands and from require and from. Ignore flags and relative imports. Return names missing from the registry. Safe only when there are none.",
      },
      why,
    },
    takeaway: {
      bar: {
        do: { he: "קוראים מה היה צריך לבדוק לפני ההתקנה.", en: "Read what should have been checked before install." },
        who: { he: "אף אחד. אין כאן מודל.", en: "No one. There is no model on this step." },
        goal: { he: "לצאת עם כלל: שם שלא במרשם לא מותקן.", en: "Leave with one rule: a name that is not in the registry is not installed." },
      },
      cards: [
        { he: "ההמלצה נשמעה כמו תיעוד, והיא הייתה המצאה.", en: "The recommendation sounded like documentation, and it was invented." },
        { he: "פקודת ההתקנה הייתה מוכנה להדבקה.", en: "The install command was ready to paste." },
        { he: "הבקרה היא השוואה למרשם, לא אמון בניסוח.", en: "The control is a registry lookup, not trust in the wording." },
        {
          he: "שמות מפקודות התקנה.\nשמות מ-require ומ-from.\nבלי דגלים ובלי ייבוא יחסי.\nבטוח רק אם אין שם חסר.",
          en: "Names from install commands.\nNames from require and from.\nNo flags and no relative imports.\nSafe only when no name is missing.",
        },
      ],
    },
  },
  {
    id: "llm10",
    code: "LLM10",
    title: { he: "צריכה לא חסומה", en: "Unbounded Consumption" },
    threat: {
      he: "בקשה אחת, בחיוב לפי טוקן, בלי תקרה בשום מקום במסלול.",
      en: "One request, metered by the token, with no ceiling anywhere on the path.",
    },
    context: {
      bar: {
        do: { he: "קוראים מי משלם על אורך התשובה.", en: "Read who pays for the length of the answer." },
        who: { he: "עדיין לא שולחים. זה המסך שלפני נקודת הקצה.", en: "Nothing sent yet. This is the screen before the endpoint." },
        goal: { he: "להבין שעלות הבקשה נקבעת לפי התוכן, לא לפי כפתור.", en: "See that the cost of a request is set by its content, not by a button." },
      },
      lead: [
        {
          he: "Atlas Assist פתוח באתר השיווק. בלי התחברות, בלי מגבלת קצב, בלי תקרת פלט, חיוב לפי טוקן.",
          en: "Atlas Assist is public on the marketing site. No sign-in, no rate limit, no output cap, billed per token.",
        },
        {
          he: "הודעה קצרה יכולה לבקש תשובה ארוכה. ההשמעה החוזרת מכפילה את אותה עלות. הקלדה לבד לא מנצחת.",
          en: "A short message can ask for a long answer. Replay multiplies that same cost. Typing alone does not win.",
        },
      ],
      appTitle: { he: "האפליקציה שתוקפים", en: "The app you are attacking" },
      app: {
        he: "נקודת הקצה הציבורית של Atlas Assist. כותבים בקשה אחת, ואז מפעילים השמעה חוזרת. הכפתור לא ממלא את התיבה.",
        en: "Atlas Assist's public endpoint. You write one request, then use replay. The button does not fill the box.",
      },
      more: {
        he: "חשבון מדומה רץ ליד הבקשה. בקשה אחת נשארת מתחת ל-500$. ההשמעה החוזרת מוסיפה את אותה עלות שוב, עד שהחשבון עובר את הסף.",
        en: "A simulated bill sits next to the request. One request stays under $500. Replay adds that same cost again, until the bill passes the line.",
      },
    },
    break: {
      kind: "replay",
      bar: {
        do: { he: "כותבים בקשה אחת יקרה, ואז מפעילים השמעה חוזרת. הקלדה לבד לא מנצחת.", en: "Write one expensive request, then use replay. Typing alone cannot win." },
        who: { he: "נקודת הקצה הציבורית של Atlas Assist, בלי התחברות.", en: "Atlas Assist's public endpoint, with no sign-in." },
        goal: { he: "להעביר את החשבון המדומה את 500$.", en: "Push the simulated bill past $500." },
      },
      placeholder: { he: "כתבו כאן בקשה אחת, במילים שלכם. אין טקסט מוכן.", en: "Write one request here, in your own words. No preset text." },
    },
    fix: {
      bar: {
        do: { he: "משנים את המגבלות לפי הכלל שמעל העורך, ואז מריצים בדיקות.", en: "Change the limits so the rule above the editor holds, then run tests." },
        who: { he: "הקוד בשרת, לא המודל.", en: "Server code, not the model." },
        goal: { he: "קלט ענק, קצב, והוצאה יומית נעצרים לפני הקריאה.", en: "An oversized input, the rate, and the daily spend stop before the call." },
      },
      rules: {
        he: "לדחות קלט גדול מדי, קצב שעבר את המגבלה, והוצאה שעברה את התקרה היומית. אחרת לחתוך את אורך הפלט לתקרה.",
        en: "Deny an oversized input, anyone over the rate limit, and anyone over the daily spend cap. Otherwise clamp the output length to the ceiling.",
      },
      why,
    },
    takeaway: {
      bar: {
        do: { he: "קוראים מה היה צריך לעצור את החשבון.", en: "Read what should have stopped the bill." },
        who: { he: "אף אחד. אין כאן מודל.", en: "No one. There is no model on this step." },
        goal: { he: "לצאת עם כלל: לכל בקשה יש תקרה לפני המודל.", en: "Leave with one rule: every request has a ceiling before the model." },
      },
      cards: [
        { he: "העלות ישבה בתוכן, לא במספר הבקשות לבד.", en: "The cost sat in the content, not in the request count alone." },
        { he: "השמעה חוזרת של אותה בקשה עברה את 500$.", en: "Replaying the same request pushed past $500." },
        { he: "הבקרה היא אורך, קצב, והוצאה יומית, ואז תקרת פלט.", en: "The control is length, rate, and daily spend, then an output ceiling." },
        {
          he: "קלט גדול מדי נדחה.\nקצב מעל המגבלה נדחה.\nהוצאה מעל התקרה היומית נדחית.\nאחרת אורך הפלט נחתך.",
          en: "An oversized input is denied.\nA rate over the limit is denied.\nSpend over the daily cap is denied.\nOtherwise the output length is clamped.",
        },
      ],
    },
  },
];

export function labCopy(id: string): LabCopy | undefined {
  return LABS.find((lab) => lab.id === id);
}

export function pick(lang: UiLang, pair: Pair): string {
  return lang === "en" ? pair.en : pair.he;
}

type Chrome = {
  langLabel: string;
  joinTitle: string;
  classCode: string;
  displayName: string;
  enter: string;
  entering: string;
  havePin: string;
  resumeTitle: string;
  pin: string;
  resume: string;
  resuming: string;
  firstJoin: string;
  yourPin: string;
  pinOnce: string;
  copy: string;
  copied: string;
  copyFail: string;
  toLabs: string;
  missingCode: string;
  missingName: string;
  needBoth: string;
  joinFail: string;
  resumeFail: string;
  serverChecking: string;
  serverBad: string;
  serverOk: string;
  labsTitle: string;
  needJoin: string;
  toJoin: string;
  loading: string;
  closedNote: string;
  broke: string;
  patched: string;
  statusClosed: string;
  statusBreached: string;
  statusPatched: string;
  back: string;
  stages: string;
  context: string;
  break: string;
  fix: string;
  takeaway: string;
  do: string;
  who: string;
  goal: string;
  more: string;
  toBreak: string;
  hint: string;
  send: string;
  received: string;
  trusted: string;
  untrusted: string;
  nothingYet: string;
  toFix: string;
  runTests: string;
  reset: string;
  run: string;
  notAPass: string;
  codeLang: string;
  file: string;
  noFiles: string;
  nextLab: string;
  retrieved: string;
  preview: string;
  flag: string;
  submitFlags: string;
  subject: string;
  body: string;
  deliver: string;
  question: string;
  answer: string;
  submitCorrection: string;
  fineTune: string;
  ask: string;
  docTitle: string;
  docBody: string;
  publish: string;
  replay: string;
  bill: string;
  corrections: string;
  index: string;
  empty: string;
  dash: string;
  switchTitle: string;
  switchBody: string;
  switchYes: string;
  resetTitle: string;
  resetBody: string;
  resetYes: string;
  cancel: string;
  checking: string;
  runOut: string;
  passed: string;
  failed: string;
  pending: string;
  running: string;
  editable: string;
  readOnly: string;
  sessionClosed: string;
  instructorSkip: string;
  prTitle: string;
  falseFlags: string;
  missed: string;
  reviewPass: string;
  reviewFail: string;
  trained: string;
  notTrained: string;
  vpnAnswer: string;
  published: string;
  vellumAnswer: string;
  replayNeed: string;
  toolLine: string;
  noTool: string;
};

const he: Chrome = {
  langLabel: "שפת ממשק",
  joinTitle: "כניסה לכיתה",
  classCode: "קוד כיתה",
  displayName: "שם תצוגה",
  enter: "כניסה",
  entering: "נכנסים…",
  havePin: "יש לי קוד אישי",
  resumeTitle: "חזרה",
  pin: "קוד אישי",
  resume: "חזרה להתקדמות",
  resuming: "בודקים…",
  firstJoin: "כניסה ראשונה",
  yourPin: "הקוד האישי",
  pinOnce: "מוצג פעם אחת. שמרו אותו.",
  copy: "העתקה",
  copied: "הועתק",
  copyFail: "העתיקו ידנית.",
  toLabs: "אל המעבדות",
  missingCode: "חסר קוד כיתה.",
  missingName: "חסר שם תצוגה.",
  needBoth: "צריך קוד כיתה וקוד אישי.",
  joinFail: "הכניסה נכשלה.",
  resumeFail: "החזרה נכשלה.",
  serverChecking: "בודקים חיבור לשרת…",
  serverBad: "אין חיבור לשרת.",
  serverOk: "יש חיבור לשרת.",
  labsTitle: "המעבדות",
  needJoin: "נכנסים קודם עם קוד כיתה.",
  toJoin: "למסך הכניסה",
  loading: "טוענים…",
  closedNote: "המפגש נסגר.",
  broke: "פרצו",
  patched: "תיקנו",
  statusClosed: "סגור",
  statusBreached: "נפרץ",
  statusPatched: "תוקן",
  back: "חזרה",
  stages: "שלבים",
  context: "הקשר",
  break: "פריצה",
  fix: "תיקון",
  takeaway: "מה לוקחים",
  do: "עושים",
  who: "מול מי",
  goal: "המטרה",
  more: "עוד על התרגיל",
  toBreak: "לפריצה",
  hint: "רמז",
  send: "שליחה",
  received: "מה המודל באמת קיבל",
  trusted: "מהימן",
  untrusted: "לא מהימן",
  nothingYet: "עוד אין כאן פרומפט.",
  toFix: "לתיקון",
  runTests: "הרצת בדיקות",
  reset: "איפוס",
  run: "הרצה",
  notAPass: "לחסום הכל זה לא מעבר",
  codeLang: "שפת קוד",
  file: "קובץ",
  noFiles: "אין קבצים לשפה הזו.",
  nextLab: "למעבדה הבאה",
  retrieved: "מה נשלף",
  preview: "תצוגה",
  flag: "סימון",
  submitFlags: "שליחת הסימונים",
  subject: "נושא",
  body: "גוף",
  deliver: "שליחה לתיבה",
  question: "שאלה",
  answer: "תשובה",
  submitCorrection: "שליחת תיקון",
  fineTune: "הרצת כיוונון",
  ask: "שאלה לקופיילוט",
  docTitle: "כותרת",
  docBody: "גוף המסמך",
  publish: "פרסום",
  replay: "השמעה חוזרת",
  bill: "חשבון מדומה",
  corrections: "תיקונים שנשלחו",
  index: "אינדקס",
  empty: "ריק",
  dash: "—",
  switchTitle: "להחליף שפת קוד?",
  switchBody: "שינויים שלא נשמרו בשפה הזו יימחקו.",
  switchYes: "החלפה",
  resetTitle: "לאפס את הקוד?",
  resetBody: "השפה הזו חוזרת לקוד המקורי.",
  resetYes: "איפוס",
  cancel: "ביטול",
  checking: "בודקים…",
  runOut: "פלט הרצה",
  passed: "עברה",
  failed: "נכשלה",
  pending: "ממתינה",
  running: "רצה",
  editable: "עריכה",
  readOnly: "קריאה",
  sessionClosed: "המפגש נסגר. אפשר תקציר בלבד.",
  instructorSkip: "המרצה פתח את שלב התיקון.",
  prTitle: "בקשת מיזוג 2291",
  falseFlags: "סימונים שגויים",
  missed: "שורות שפספסתם",
  reviewPass: "כל השורות המסוכנות מסומנות, עם לכל היותר סימון שגוי אחד.",
  reviewFail: "עוד לא. צריך את כל השורות המסוכנות, ולכל היותר סימון שגוי אחד.",
  trained: "הכיוונון רץ.",
  notTrained: "הכיוונון עוד לא רץ.",
  vpnAnswer: "תשובה",
  published: "פורסם",
  vellumAnswer: "תשובת Vellum",
  replayNeed: "קודם שולחים משהו שכתבתם.",
  toolLine: "כלים",
  noTool: "",
};

const en: Chrome = {
  langLabel: "Interface language",
  joinTitle: "Join the class",
  classCode: "Class code",
  displayName: "Display name",
  enter: "Join",
  entering: "Joining…",
  havePin: "I have a personal code",
  resumeTitle: "Resume",
  pin: "Personal code",
  resume: "Resume progress",
  resuming: "Checking…",
  firstJoin: "First join",
  yourPin: "Your personal code",
  pinOnce: "Shown once. Keep it.",
  copy: "Copy",
  copied: "Copied",
  copyFail: "Copy it manually.",
  toLabs: "To the labs",
  missingCode: "Class code is missing.",
  missingName: "Display name is missing.",
  needBoth: "Need a class code and a personal code.",
  joinFail: "Join failed.",
  resumeFail: "Resume failed.",
  serverChecking: "Checking the server…",
  serverBad: "No connection to the server.",
  serverOk: "Connected to the server.",
  labsTitle: "Labs",
  needJoin: "Join with a class code first.",
  toJoin: "To the join screen",
  loading: "Loading…",
  closedNote: "The session is closed.",
  broke: "Broke",
  patched: "Patched",
  statusClosed: "Closed",
  statusBreached: "Breached",
  statusPatched: "Patched",
  back: "Back",
  stages: "Stages",
  context: "Context",
  break: "Break",
  fix: "Fix",
  takeaway: "Takeaway",
  do: "Do",
  who: "Talking to",
  goal: "Goal",
  more: "More",
  toBreak: "To Break",
  hint: "Hint",
  send: "Send",
  received: "What the model actually received",
  trusted: "Trusted",
  untrusted: "Untrusted",
  nothingYet: "No prompt yet.",
  toFix: "To Fix",
  runTests: "Run tests",
  reset: "Reset",
  run: "Run",
  notAPass: "Blocking everything is not a pass",
  codeLang: "Code language",
  file: "File",
  noFiles: "No files for this language.",
  nextLab: "Next lab",
  retrieved: "What was retrieved",
  preview: "Preview",
  flag: "Flag",
  submitFlags: "Submit flags",
  subject: "Subject",
  body: "Body",
  deliver: "Deliver to the inbox",
  question: "Question",
  answer: "Answer",
  submitCorrection: "Submit correction",
  fineTune: "Run fine-tune",
  ask: "Ask the copilot",
  docTitle: "Title",
  docBody: "Document body",
  publish: "Publish",
  replay: "Replay",
  bill: "Simulated bill",
  corrections: "Corrections sent",
  index: "Index",
  empty: "Empty",
  dash: "—",
  switchTitle: "Switch code language?",
  switchBody: "Unsaved edits in this language are dropped.",
  switchYes: "Switch",
  resetTitle: "Reset the code?",
  resetBody: "This language returns to the starter.",
  resetYes: "Reset",
  cancel: "Cancel",
  checking: "Checking…",
  runOut: "Run output",
  passed: "Passed",
  failed: "Failed",
  pending: "Pending",
  running: "Running",
  editable: "Edit",
  readOnly: "Read",
  sessionClosed: "Session closed. Completion only.",
  instructorSkip: "The instructor opened the fix stage.",
  prTitle: "Pull request 2291",
  falseFlags: "False flags",
  missed: "Lines you missed",
  reviewPass: "Every risky line is flagged, with at most one false flag.",
  reviewFail: "Not yet. Every risky line, and at most one false flag.",
  trained: "The fine-tune ran.",
  notTrained: "The fine-tune has not run.",
  vpnAnswer: "Answer",
  published: "Published",
  vellumAnswer: "Vellum's answer",
  replayNeed: "Send something you wrote first.",
  toolLine: "Tools",
  noTool: "",
};

export function chrome(lang: UiLang): Chrome {
  return lang === "en" ? en : he;
}

export type PrLine = { text: string; bad: boolean; why: Pair };

export const PR_LINES: PrLine[] = [
  { text: "FROM python:latest", bad: true, why: { he: "תמונת בסיס לא נעולה.", en: "An unpinned base image." } },
  { text: "RUN pip install --require-hashes -r requirements.lock", bad: false, why: { he: "נעילה עם hash.", en: "A lock file with hashes." } },
  { text: "RUN pip install openal-whisper==20240930", bad: true, why: { he: "שם במרחק אות אחת מחבילה נפוצה.", en: "A name one character from a popular package." } },
  { text: "RUN pip install -r https://gist.githubusercontent.com/anon/9f2/raw/reqs.txt", bad: true, why: { he: "רשימת תלויות מחשבון זר, בזמן הבנייה.", en: "A dependency list from someone else's account, at build time." } },
  { text: "COPY --from=builder /app/sbom.spdx.json /app/", bad: false, why: { he: "העתקת SBOM שכבר נבנה.", en: "Copies an SBOM that was already built." } },
  { text: 'model = AutoModel.from_pretrained("acme-labs/sentiment-v2", trust_remote_code=True)', bad: true, why: { he: "trust_remote_code מריץ קוד מהמאגר.", en: "trust_remote_code runs code from the repository." } },
  { text: 'tokenizer = AutoTokenizer.from_pretrained("acme-labs/sentiment-v2", revision="main")', bad: true, why: { he: "ענף main זז אחרי הסקירה.", en: "The main branch moves after review." } },
  { text: 'assert sha256(open(WEIGHTS,"rb").read()).hexdigest() == PINNED_DIGEST', bad: false, why: { he: "בדיקת digest נעול.", en: "Checks a pinned digest." } },
  { text: 'adapter = PeftModel.from_pretrained(model, "hf.co/u/kx9/support-lora-v4")', bad: true, why: { he: "מתאם מחשבון אנונימי.", en: "An adapter from an anonymous account." } },
  { text: "RUN curl -sL https://get.agentkit.dev/install.sh | bash", bad: true, why: { he: "סקריפט מרוחק לתוך המעטפת.", en: "A remote script piped into the shell." } },
  { text: 'PLUGIN_REGISTRY = "https://registry.internal.acme/plugins"', bad: false, why: { he: "מרשם פנימי על https.", en: "An internal registry over https." } },
  { text: "RUN pip install agent-tools --index-url http://pypi-mirror.internal:8080/simple", bad: true, why: { he: "אינדקס על http, בלי נעילת גרסה.", en: "An index over http, with no version pin." } },
  { text: "USER appuser", bad: false, why: { he: "משתמש לא-שורש.", en: "A non-root user." } },
  { text: "ENV HF_HUB_OFFLINE=1", bad: false, why: { he: "בלי משיכה מהמרכז בזמן ריצה.", en: "No hub fetch at runtime." } },
];

export type Doc = { id: string; title: Pair; body: Pair; vis: "public" | "private" | "restricted"; owner: string | null };

export const HR_DOCS: Doc[] = [
  { id: "hb-01", title: { he: "נוהל · חופשת הורות", en: "Handbook · parental leave" }, body: { he: "26 שבועות בתשלום אחרי 12 חודשי עבודה.", en: "26 weeks paid after 12 months of service." }, vis: "public", owner: null },
  { id: "hb-04", title: { he: "נוהל · הוצאות", en: "Handbook · expenses" }, body: { he: "הוצאה מעל 400 שקל דורשת אישור מנהל.", en: "An expense over 400 ILS needs a manager approval." }, vis: "public", owner: null },
  { id: "rec-dana", title: { he: "רשומה · Dana Rosen", en: "Record · Dana Rosen" }, body: { he: "תפקיד: שיווק. שכר: 31,500. זהות: 03•••••••1.", en: "Role: Marketing. Salary: 31,500. National ID: 03•••••••1." }, vis: "private", owner: "dana" },
  { id: "rec-ravid", title: { he: "רשומה · Ravid Bar-Lev", en: "Record · Ravid Bar-Lev" }, body: { he: "תפקיד: סמנכ״ל הנדסה. שכר: 68,200. זהות: 029741883.", en: "Role: VP Engineering. Salary: 68,200. National ID: 029741883." }, vis: "private", owner: "ravid" },
  { id: "rec-mia", title: { he: "רשומה · Mia Toledano", en: "Record · Mia Toledano" }, body: { he: "תפקיד: בקרה. שכר: 44,000. זהות: 017225604.", en: "Role: Controller. Salary: 44,000. National ID: 017225604." }, vis: "private", owner: "mia" },
  { id: "comp-band", title: { he: "טווחי שכר 2026", en: "Compensation bands 2026" }, body: { he: "לידי משאבי אנוש בלבד. סמנכ״ל 60–75 אלף.", en: "HR only. VP band 60–75k." }, vis: "restricted", owner: null },
];

export const BASE_INDEX: { id: string; title: Pair; body: Pair }[] = [
  { id: "kb-refunds", title: { he: "מדיניות החזרים", en: "Refund policy" }, body: { he: "החזר תוך 14 יום לפריט שלא נעשה בו שימוש. מעל 400 שקל צריך אישור.", en: "Refunds within 14 days for unused items. Above 400 ILS needs approval." } },
  { id: "kb-onboard", title: { he: "קליטה", en: "Onboarding" }, body: { he: "שבוע ראשון: ציוד, הדרכת אבטחה, ופגישה עם המנהל.", en: "Week one: setup, security training, and a manager meeting." } },
  { id: "kb-oncall", title: { he: "כוננות", en: "On-call" }, body: { he: "הכונן מתחלף כל שבוע. אחרי 15 דקות בלי מענה עולים לכונן השני.", en: "Primary rotates weekly. Escalate after 15 minutes with no acknowledgement." } },
];
