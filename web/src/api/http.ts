import { routes, type SseEventName } from "../../../shared/api";
import { getInstructorKey, getLearnerId } from "../storage";

export class ApiRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const OFFLINE = "No connection to the server on 127.0.0.1:8787.";

function timeoutSignal(ms: number): AbortSignal | undefined {
  const signalWithTimeout = AbortSignal as typeof AbortSignal & { timeout?: (n: number) => AbortSignal };
  if (typeof signalWithTimeout.timeout === "function") return signalWithTimeout.timeout(ms);
  return undefined;
}

export function routePath(route: string, params: Record<string, string> = {}): { method: string; path: string } {
  const space = route.indexOf(" ");
  const method = route.slice(0, space);
  const raw = route.slice(space + 1);
  const path = raw.replace(/:([A-Za-z]+)/g, (_m, key: string) => encodeURIComponent(params[key] ?? ""));
  return { method, path };
}

type CallOpt = {
  body?: unknown;
  learner?: boolean;
  instructor?: boolean;
  timeoutMs?: number;
};

export async function call<T>(route: string, params: Record<string, string> = {}, opt: CallOpt = {}): Promise<T> {
  const { method, path } = routePath(route, params);
  const headers = new Headers();
  if (opt.body !== undefined) headers.set("Content-Type", "application/json");
  if (opt.learner) {
    const id = getLearnerId();
    if (!id) throw new ApiRequestError("No learner id in this browser. Join again.");
    headers.set("X-Learner-Id", id);
  }
  if (opt.instructor) {
    const key = getInstructorKey();
    if (!key) throw new ApiRequestError("No instructor key in this browser.");
    headers.set("X-Instructor-Key", key);
  }
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined,
      signal: timeoutSignal(opt.timeoutMs ?? 60000),
    });
  } catch {
    throw new ApiRequestError(OFFLINE);
  }
  const text = await response.text();
  if (!response.ok) {
    let message = "The request failed.";
    if (text) {
      try {
        const parsed = JSON.parse(text) as { error?: string; errorHe?: string };
        if (parsed.error && parsed.error.trim()) message = parsed.error;
        else if (parsed.errorHe) message = parsed.errorHe;
      } catch {
        message = "The server returned an error with no explanation.";
      }
    }
    throw new ApiRequestError(message);
  }
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiRequestError("The server response could not be read.");
  }
}

const SSE_NAMES: SseEventName[] = [
  "lab_state",
  "attack_succeeded",
  "event_log",
  "submission_check",
  "session_closed",
  "board",
];

export function openEvents(
  who: { learnerId?: string; instructorKey?: string },
  onEvent: (name: SseEventName, data: unknown) => void,
): () => void {
  const query = new URLSearchParams();
  if (who.learnerId) query.set("learnerId", who.learnerId);
  if (who.instructorKey) query.set("instructorKey", who.instructorKey);
  const source = new EventSource(`${routePath(routes.events).path}?${query.toString()}`);
  const handlers = SSE_NAMES.map((name) => {
    const fn = (event: Event) => {
      const raw = (event as MessageEvent).data;
      try {
        onEvent(name, JSON.parse(String(raw)));
      } catch {
        onEvent(name, {});
      }
    };
    source.addEventListener(name, fn);
    return { name, fn };
  });
  return () => {
    for (const handler of handlers) source.removeEventListener(handler.name, handler.fn);
    source.close();
  };
}
