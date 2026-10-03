# חוזה HTTP

מקור הטיפוסים: `/workspace/llm-labs/shared/api.ts`. השרת מממש את הקובץ הזה. אין שדה `languages` על מעבדה. הקבצים של השפה הפעילה הם `files`.

השרת מאזין על `127.0.0.1` וברירת המחדל פורט `8787` (`PORT`).

JSON. שגיאה: `{ "errorHe": "..." }` עם סטטוס 4xx או 5xx.

כותרת `X-Learner-Id` לכל קריאת לומד מלבד `POST /api/join` ו-`POST /api/resume`.
כותרת `X-Instructor-Key` לכל קריאת מרצה מלבד `POST /api/instructor/sessions`.
`GET /api/events` הוא SSE (`text/event-stream`). המזהה ב-query: `learnerId` או `instructorKey`. לא בכותרת.

`Language`: `python` | `typescript` | `pseudocode`.
`FailureCategory`: `prompt_only` | `blocklist` | `client_only` | `broke_happy_path` | `hidden_variant` | `other`.
העורך מגיש את פונקציית ה-JavaScript מהאתר (starter), לא קובץ `handle`. כל שפה מגישה את אותו קובץ. הבודק מריץ את הפונקציה מול ה-harness של האתר, לא מול רץ Python/TypeScript/pseudocode. כשל שה-detail שלו אומר שתעבורה אמיתית חייבת לעבור, או שחסימת הכול אינה תיקון, מקבל `broke_happy_path`. שאר הכשלים הם `other`. אין `prompt_only` במעבדות האלה.
`CheckStatus`: `pending` | `running` | `passed` | `failed`.
`passed` אמיתי רק כש-`done` אמיתי וכל הבדיקות עברו.

## נתיבים

- `GET /api/health` → `{ ok: true }`
- `POST /api/join` `{ classCode, displayName }` → `{ learnerId, sessionId, displayName, pin, pinShownOnce: true }`
- `POST /api/resume` `{ classCode, pin }` → `{ learnerId, sessionId, displayName, progress }`
- `GET /api/session` → `{ sessionId, classCode, closed, labs, progress }`
- `GET /api/events` SSE. שמות: `lab_state`, `attack_succeeded`, `event_log`, `submission_check`, `session_closed`, `board`.
  - לומד: האירועים של הלומד (`lab_state`, `attack_succeeded`, `event_log`, `submission_check`, `session_closed`).
  - מרצה: `board`, `session_closed`, `lab_state`.
  - `lab_state`: `{ labId, state }`
  - `attack_succeeded`: `{ labId, factHe, causeHe }`
  - `event_log`: `{ labId, entry: { at, textHe } }`
  - `submission_check`: גוף `CheckResponse` ועוד `labId`
  - `session_closed`: `{ classCode }`
  - `board`: `{ classCode }`
- `GET /api/labs` → `LabSummary[]`: `{ id, owaspId, titleHe, blurbHe, state, language }`
- `GET /api/labs/:labId` → `LabDetail`: שדות הסיכום ועוד `briefing`, `appUrl` (נתיב שמתחיל ב-`/`), `files` (`{ path, content, editable }`), `attackSucceeded`, `attackFactHe`, `attackCauseHe`, `hintsOpened`, `hints` (רק רמזים שנפתחו), `eventLog`, `instructorSkip`, `viewedSolution`, `owaspUrl`. בלי מטעני וריאנט נסתר.
- `POST /api/labs/:labId/language` `{ language }` → `{ language, files }`
- `POST /api/labs/:labId/hints/next` → `{ hintsOpened, hints }`
- `PUT /api/labs/:labId/files` `{ path, content, language }` → `{ ok: true }`
- `POST /api/labs/:labId/run` `{ language, files }` → `{ ok, output, errorHebrew?, appUrl }`. אין `attackDetected`.
- `POST /api/labs/:labId/reset` `{ language }` → `{ files }`
- `POST /api/labs/:labId/check` `{ language, files }` → `{ submissionId, done, passed, checks }`. כל בדיקה: `{ id, nameHe, status, category?, feedbackHe? }`. בסיום `done: true`. בזמן הריצה נשלח SSE `submission_check`.
- `GET /api/submissions/:submissionId` → אותו גוף.
- `POST /api/labs/:labId/solution/view` → `{ referenceSolutionHe, viewedBeforePass }`
- `POST /api/labs/:labId/reflection` `{ text }` → `{ ok: true }`
- `GET /api/labs/:labId/completion` → `{ attackSummaryHe, diff, controlHe, referenceSolutionHe, owaspUrl, viewedSolutionBeforePass }`
- `POST /api/instructor/sessions` → `{ classCode, instructorKey, joinPath }`. המפתח מוחזר פעם אחת.
- `GET /api/instructor/sessions/:classCode` לוח: `{ classCode, closed, labs, learners }`
- `POST /api/instructor/sessions/:classCode/labs/:labId/open`
- `POST /api/instructor/sessions/:classCode/labs/:labId/lock`
- `POST /api/instructor/sessions/:classCode/labs/open-all`
- `POST /api/instructor/sessions/:classCode/close`
- `GET /api/instructor/sessions/:classCode/projection`
- `POST /api/instructor/sessions/:classCode/learners/:learnerId/labs/:labId/skip`
- `GET /api/instructor/sessions/:classCode/learners/:learnerId/labs/:labId/timeline` → `{ events }`
- `GET /api/instructor/sessions/:classCode/export`

`progress`: `{ attacksSucceeded, fixesPassed }`.
`briefing`: `{ appHe, usersHe, roleHe, goalHe, happyPathName, happyPathHe, notAFixHe }`.

שלב התיקון סגור עד הצלחת התקפה או דילוג מרצה. `appUrl` הוא דף עברי על השרת הזה. הפעולות בדף פונות רק לשרת הזה.

## דף ההתקפה

`POST /lab-app/:labId/act` מקבל JSON `{ "text": "..." }`. `actionId` לא נדרש. אם נשלחים גם `text` וגם `actionId`, `text` קובע. השרת ממפה את `text` לשדה הקלט שהאפליקציה הפגיעה כבר קוראת (למשל llm01 → `resume`, llm02 → `question`).

התשובה כוללת לפחות:

- `output` (string): התשובה שהלומד רואה. זה המקור היחיד לתשובת המודל.
- `received` (string): הטקסט המדויק שהמודל קיבל בתור הזה, אחרי שהאפליקציה הרכיבה אותו. בכל פעולה שהצליחה זו מחרוזת לא ריקה, גם בטקסט תמים. `prompt` ו-`modelInput`, אם קיימים, שווים ל-`received`.
- `attackSucceeded` (boolean): הגלאי הקיים, בלי שינוי כללים.
- `ok` ו-`errorHe`: שגיאת תחביר או חריגה אמיתית מחזירות `ok: false` ו-`errorHe` בעברית. ב-LLM10, אם הגלאי כבר זיהה הצלחה, תקרת הקריאות למודל לא חוזרת כשגיאת הרצה (`ok: true`, `errorHe: null`).

מצבי לומד: `locked` | `open` | `attack` | `fix` | `completed` | `completed_after_solution`.
תאי לוח: `not_started` | `attack` | `attack_succeeded` | `submitted_failed` | `passed` | `passed_after_solution` | `instructor_skip`.

המפגשים נשמרים ב-`/workspace/llm-labs/data/sessions.json`.
