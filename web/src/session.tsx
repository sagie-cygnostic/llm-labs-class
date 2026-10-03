import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { getDisplayName } from "./storage";

type SessionValue = {
  displayName: string | null;
  refresh: () => void;
};

const SessionContext = createContext<SessionValue>({
  displayName: null,
  refresh: () => undefined,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState<string | null>(() => getDisplayName());
  const refresh = useCallback(() => setDisplayName(getDisplayName()), []);
  const value = useMemo(() => ({ displayName, refresh }), [displayName, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  return useContext(SessionContext);
}
