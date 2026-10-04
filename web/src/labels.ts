import type { BoardCell, CheckStatus, FailureCategory, Language, LearnerLabState, TimelineKind } from "../../shared/api";

export const stateLabel: Record<LearnerLabState, string> = {
  locked: "Locked",
  open: "Open",
  attack: "Break",
  fix: "Fix",
  completed: "Completed",
  completed_after_solution: "Completed after viewing the solution",
};

export const boardLabel: Record<BoardCell, string> = {
  not_started: "Not started",
  attack: "On the break stage",
  attack_succeeded: "Broke it",
  submitted_failed: "Submitted and failed",
  passed: "Passed",
  passed_after_solution: "Passed after viewing the solution",
  instructor_skip: "Instructor skip",
};

export const boardMark: Record<BoardCell, string> = {
  not_started: "·",
  attack: "…",
  attack_succeeded: "Broke",
  submitted_failed: "Failed",
  passed: "Passed",
  passed_after_solution: "Passed*",
  instructor_skip: "Skip",
};

export const failureLabel: Record<FailureCategory, string> = {
  prompt_only: "Prompt only",
  blocklist: "Blocklist",
  client_only: "Client-side check",
  broke_happy_path: "Broke the happy path",
  hidden_variant: "Hidden variant",
  other: "Other",
};

export const checkStatusLabel: Record<CheckStatus, string> = {
  pending: "Pending",
  running: "Running",
  passed: "Passed",
  failed: "Failed",
};

export const languageLabel: Record<Language, string> = {
  python: "Python",
  typescript: "TypeScript",
  pseudocode: "Pseudocode",
};

export const timelineLabel: Record<TimelineKind, string> = {
  hint: "Hint",
  attack_succeeded: "Attack landed",
  submission: "Submission",
  viewed_solution: "Viewed the solution",
  instructor_skip: "Instructor skip",
  passed: "Passed",
};

export const languages: Language[] = ["python", "typescript", "pseudocode"];
