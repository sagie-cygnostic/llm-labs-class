import {
  routes,
  type BoardResponse,
  type CheckRequest,
  type CheckResponse,
  type CompletionResponse,
  type CreateSessionResponse,
  type HealthResponse,
  type Hint,
  type JoinRequest,
  type JoinResponse,
  type LabDetail,
  type LabSummary,
  type LanguageRequest,
  type LanguageResponse,
  type ProjectionResponse,
  type PutFileRequest,
  type ReflectionRequest,
  type ResetRequest,
  type ResetResponse,
  type ResumeRequest,
  type ResumeResponse,
  type RunRequest,
  type RunResponse,
  type SessionExport,
  type SessionResponse,
  type SolutionViewResponse,
  type SseEventName,
  type TimelineResponse,
} from "../../../shared/api";
import { call, openEvents } from "./http";
import { mockApi } from "./mock";

export type Api = {
  health: () => Promise<HealthResponse>;
  join: (body: JoinRequest) => Promise<JoinResponse>;
  resume: (body: ResumeRequest) => Promise<ResumeResponse>;
  session: () => Promise<SessionResponse>;
  listLabs: () => Promise<LabSummary[]>;
  lab: (labId: string) => Promise<LabDetail>;
  setLanguage: (labId: string, body: LanguageRequest) => Promise<LanguageResponse>;
  nextHint: (labId: string) => Promise<Hint>;
  putFile: (labId: string, body: PutFileRequest) => Promise<void>;
  run: (labId: string, body: RunRequest) => Promise<RunResponse>;
  reset: (labId: string, body: ResetRequest) => Promise<ResetResponse>;
  check: (labId: string, body: CheckRequest) => Promise<CheckResponse>;
  submission: (submissionId: string) => Promise<CheckResponse>;
  viewSolution: (labId: string) => Promise<SolutionViewResponse>;
  reflection: (labId: string, body: ReflectionRequest) => Promise<void>;
  completion: (labId: string) => Promise<CompletionResponse>;
  createSession: () => Promise<CreateSessionResponse>;
  board: (classCode: string) => Promise<BoardResponse>;
  openLab: (classCode: string, labId: string) => Promise<void>;
  lockLab: (classCode: string, labId: string) => Promise<void>;
  openAll: (classCode: string) => Promise<void>;
  closeSession: (classCode: string) => Promise<void>;
  projection: (classCode: string) => Promise<ProjectionResponse>;
  skip: (classCode: string, learnerId: string, labId: string) => Promise<void>;
  timeline: (classCode: string, learnerId: string, labId: string) => Promise<TimelineResponse>;
  exportSession: (classCode: string) => Promise<SessionExport>;
  subscribe: (
    who: { learnerId?: string; instructorKey?: string },
    onEvent: (name: SseEventName, data: unknown) => void,
  ) => () => void;
};

const httpApi: Api = {
  health: () => call<HealthResponse>(routes.health, {}, { timeoutMs: 8000 }),
  join: (body) => call(routes.join, {}, { body }),
  resume: (body) => call(routes.resume, {}, { body }),
  session: () => call(routes.session, {}, { learner: true }),
  listLabs: () => call(routes.labs, {}, { learner: true }),
  lab: (labId) => call(routes.lab, { labId }, { learner: true }),
  setLanguage: (labId, body) => call(routes.language, { labId }, { body, learner: true }),
  nextHint: (labId) => call(routes.hintNext, { labId }, { learner: true }),
  putFile: (labId, body) => call(routes.putFile, { labId }, { body, learner: true }),
  run: (labId, body) => call(routes.run, { labId }, { body, learner: true, timeoutMs: 60000 }),
  reset: (labId, body) => call(routes.reset, { labId }, { body, learner: true }),
  check: (labId, body) => call(routes.check, { labId }, { body, learner: true, timeoutMs: 90000 }),
  submission: (submissionId) => call(routes.submission, { submissionId }, { learner: true }),
  viewSolution: (labId) => call(routes.viewSolution, { labId }, { learner: true }),
  reflection: (labId, body) => call(routes.reflection, { labId }, { body, learner: true }),
  completion: (labId) => call(routes.completion, { labId }, { learner: true }),
  createSession: () => call(routes.createSession, {}),
  board: (classCode) => call(routes.board, { classCode }, { instructor: true }),
  openLab: (classCode, labId) => call(routes.openLab, { classCode, labId }, { instructor: true }),
  lockLab: (classCode, labId) => call(routes.lockLab, { classCode, labId }, { instructor: true }),
  openAll: (classCode) => call(routes.openAll, { classCode }, { instructor: true }),
  closeSession: (classCode) => call(routes.closeSession, { classCode }, { instructor: true }),
  projection: (classCode) => call(routes.projection, { classCode }, { instructor: true }),
  skip: (classCode, learnerId, labId) =>
    call(routes.skip, { classCode, learnerId, labId }, { instructor: true }),
  timeline: (classCode, learnerId, labId) =>
    call(routes.timeline, { classCode, learnerId, labId }, { instructor: true }),
  exportSession: (classCode) => call(routes.exportSession, { classCode }, { instructor: true }),
  subscribe: openEvents,
};

export function createApi(mock: boolean): Api {
  return mock ? mockApi : httpApi;
}
