const learnerIdKey = "llm-labs.learnerId";
const displayNameKey = "llm-labs.displayName";
const classCodeKey = "llm-labs.classCode";
const instructorKeyKey = "llm-labs.instructorKey";
const instructorClassKey = "llm-labs.instructorClass";

export function getLearnerId(): string | null {
  return sessionStorage.getItem(learnerIdKey);
}

export function getDisplayName(): string | null {
  return sessionStorage.getItem(displayNameKey);
}

export function getClassCode(): string | null {
  return sessionStorage.getItem(classCodeKey);
}

export function saveLearner(learnerId: string, displayName: string, classCode: string): void {
  sessionStorage.setItem(learnerIdKey, learnerId);
  sessionStorage.setItem(displayNameKey, displayName);
  sessionStorage.setItem(classCodeKey, classCode);
}

export function getInstructorKey(): string | null {
  return sessionStorage.getItem(instructorKeyKey);
}

export function getInstructorClass(): string | null {
  return sessionStorage.getItem(instructorClassKey);
}

export function saveInstructor(classCode: string, instructorKey: string): void {
  sessionStorage.setItem(instructorClassKey, classCode);
  sessionStorage.setItem(instructorKeyKey, instructorKey);
}

export function fixGateKey(labId: string): string {
  return `llm-labs.fixGate.${labId}`;
}
