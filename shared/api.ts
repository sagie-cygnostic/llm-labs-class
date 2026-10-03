/**
 * חוזה יחיד בין web ל-server. השרת על 127.0.0.1:8787 מיישם את הקובץ הזה בלי לשנות נתיב.
 * עדכונים חיים: SSE, לא WebSocket.
 * שלוש שפות בכל מעבדה: python, typescript, pseudocode.
 * תיקון ששינה רק את הפרומפט נכשל תמיד, עם category "prompt_only" ומשוב בעברית.
 */

export const API_ORIGIN = "http://127.0.0.1:8787";

export type Language = "python" | "typescript" | "pseudocode";

export type LearnerLabState =
  | "locked"
  | "open"
  | "attack"
  | "fix"
  | "completed"
  | "completed_after_solution";

export type LabPhase = "context" | "break" | "fix" | "takeaway";

export type BoardCell =
  | "not_started"
  | "attack"
  | "attack_succeeded"
  | "submitted_failed"
  | "passed"
  | "passed_after_solution"
  | "instructor_skip";

export type FailureCategory =
  | "prompt_only"
  | "blocklist"
  | "client_only"
  | "broke_happy_path"
  | "hidden_variant"
  | "other";

export type CheckStatus = "pending" | "running" | "passed" | "failed";

export interface ApiError {
  errorHe: string;
}

export interface HealthResponse {
  ok: true;
}

export interface SourceFile {
  path: string;
  content: string;
  editable: boolean;
}

export interface Progress {
  attacksSucceeded: number;
  fixesPassed: number;
}

export interface LabSummary {
  id: string;
  owaspId: string;
  titleHe: string;
  blurbHe: string;
  state: LearnerLabState;
  language: Language;
  /** True only after the patch checks passed. */
  passed: boolean;
}

export interface Briefing {
  appHe: string;
  usersHe: string;
  roleHe: string;
  goalHe: string;
  happyPathName: string;
  happyPathHe: string;
  notAFixHe: string;
}

export interface EventLogEntry {
  at: string;
  textHe: string;
}

export interface Hint {
  level: 1 | 2 | 3;
  textHe: string;
}

export interface LabDetail extends LabSummary {
  briefing: Briefing;
  /** נתיב שמתחיל ב-/. נטען מהדפדפן מול API_ORIGIN. */
  appUrl: string;
  /** קבצי השפה הפעילה בלבד. בלי מטענים נסתרים. */
  files: SourceFile[];
  attackSucceeded: boolean;
  attackFactHe: string | null;
  attackCauseHe: string | null;
  /** כמה רמזים נפתחו. hints מכיל רק את אלה, לא רמזים סגורים. */
  hintsOpened: 0 | 1 | 2 | 3;
  hints: Hint[];
  phase: LabPhase;
  eventLog: EventLogEntry[];
  instructorSkip: boolean;
  viewedSolution: boolean;
  owaspUrl: string;
}

export interface JoinRequest {
  classCode: string;
  displayName: string;
}

export interface JoinResponse {
  learnerId: string;
  sessionId: string;
  displayName: string;
  pin: string;
  pinShownOnce: true;
}

export interface ResumeRequest {
  classCode: string;
  pin: string;
}

export interface ResumeResponse {
  learnerId: string;
  sessionId: string;
  displayName: string;
  progress: Progress;
}

export interface SessionResponse {
  sessionId: string;
  classCode: string;
  closed: boolean;
  labs: LabSummary[];
  progress: Progress;
}

export interface LanguageRequest {
  language: Language;
}

export interface LanguageResponse {
  language: Language;
  files: SourceFile[];
}

export interface PutFileRequest {
  path: string;
  content: string;
  language: Language;
}

export interface RunRequest {
  language: Language;
  files: SourceFile[];
}

export interface RunResponse {
  ok: boolean;
  output: string;
  errorHebrew?: string;
  appUrl: string;
}

export interface ResetRequest {
  language: Language;
}

export interface ResetResponse {
  files: SourceFile[];
}

export interface CheckRequest {
  language: Language;
  files: SourceFile[];
}

export interface CheckItem {
  id: string;
  nameHe: string;
  status: CheckStatus;
  category?: FailureCategory;
  feedbackHe?: string;
}

/**
 * POST /api/labs/:labId/check מריץ את הבדיקות ומחזיר את הגוף הזה עם done: true והתוצאה הסופית.
 * בזמן הריצה נשלח אירוע SSE בשם submission_check (SseSubmissionCheck). האירוע האחרון גם done: true.
 * GET /api/submissions/:submissionId מחזיר את אותו גוף.
 * passed אמיתי רק כש-done אמיתי וכל הבדיקות עברו.
 */
export interface CheckResponse {
  submissionId: string;
  done: boolean;
  passed: boolean;
  checks: CheckItem[];
}

export interface SolutionViewResponse {
  referenceSolutionHe: string;
  viewedBeforePass: boolean;
}

export interface ReflectionRequest {
  text: string;
}

export interface CompletionResponse {
  attackSummaryHe: string;
  diff: string;
  controlHe: string;
  referenceSolutionHe: string;
  owaspUrl: string;
  viewedSolutionBeforePass: boolean;
}

export interface CreateSessionResponse {
  classCode: string;
  instructorKey: string;
  joinPath: string;
}

export interface BoardCellDetail {
  state: BoardCell;
  failureCategory?: FailureCategory;
}

export interface BoardLearner {
  learnerId: string;
  displayName: string;
  cells: Record<string, BoardCellDetail>;
}

export interface BoardLab {
  id: string;
  titleHe: string;
  owaspId: string;
  open: boolean;
}

export interface BoardResponse {
  classCode: string;
  closed: boolean;
  labs: BoardLab[];
  learners: BoardLearner[];
}

export interface ProjectionLab {
  labId: string;
  titleHe: string;
  attackedSuccessfully: number;
  promptOnlyRejected: number;
  brokeHappyPath: number;
  passed: number;
  passedAfterSolution: number;
  failureCounts: Partial<Record<FailureCategory, number>>;
}

export interface ProjectionResponse {
  labs: ProjectionLab[];
}

export type TimelineKind =
  | "hint"
  | "attack_succeeded"
  | "submission"
  | "viewed_solution"
  | "instructor_skip"
  | "passed";

export interface TimelineEvent {
  at: string;
  kind: TimelineKind;
  textHe: string;
}

export interface TimelineResponse {
  events: TimelineEvent[];
}

export interface SessionExport {
  classCode: string;
  closed: boolean;
  exportedAt: string;
  labs: ProjectionLab[];
  learners: BoardLearner[];
}

export type SseEventName =
  | "lab_state"
  | "attack_succeeded"
  | "event_log"
  | "submission_check"
  | "session_closed"
  | "board";

export interface SseLabState {
  labId: string;
  state: LearnerLabState;
}

export interface SseAttackSucceeded {
  labId: string;
  factHe: string;
  causeHe: string;
}

export interface SseEventLog {
  labId: string;
  entry: EventLogEntry;
}

export interface SseSubmissionCheck extends CheckResponse {
  labId: string;
}

export interface SseSessionClosed {
  classCode: string;
}

export interface SseBoard {
  classCode: string;
}

/**
 * כותרות: X-Learner-Id לקריאות לומד (חוץ מ-join ו-resume), X-Instructor-Key לקריאות מרצה (חוץ מיצירת מפגש).
 * GET /api/events הוא EventSource ולכן בלי כותרות: query של learnerId או instructorKey.
 * שגיאה: ApiError.
 */
export const routes = {
  health: "GET /api/health",
  join: "POST /api/join",
  resume: "POST /api/resume",
  session: "GET /api/session",
  events: "GET /api/events",
  labs: "GET /api/labs",
  lab: "GET /api/labs/:labId",
  language: "POST /api/labs/:labId/language",
  hintNext: "POST /api/labs/:labId/hints/next",
  putFile: "PUT /api/labs/:labId/files",
  run: "POST /api/labs/:labId/run",
  reset: "POST /api/labs/:labId/reset",
  check: "POST /api/labs/:labId/check",
  phase: "POST /api/labs/:labId/phase",
  submission: "GET /api/submissions/:submissionId",
  viewSolution: "POST /api/labs/:labId/solution/view",
  reflection: "POST /api/labs/:labId/reflection",
  completion: "GET /api/labs/:labId/completion",
  createSession: "POST /api/instructor/sessions",
  board: "GET /api/instructor/sessions/:classCode",
  openLab: "POST /api/instructor/sessions/:classCode/labs/:labId/open",
  lockLab: "POST /api/instructor/sessions/:classCode/labs/:labId/lock",
  openAll: "POST /api/instructor/sessions/:classCode/labs/open-all",
  closeSession: "POST /api/instructor/sessions/:classCode/close",
  projection: "GET /api/instructor/sessions/:classCode/projection",
  skip: "POST /api/instructor/sessions/:classCode/learners/:learnerId/labs/:labId/skip",
  timeline: "GET /api/instructor/sessions/:classCode/learners/:learnerId/labs/:labId/timeline",
  exportSession: "GET /api/instructor/sessions/:classCode/export",
} as const;
