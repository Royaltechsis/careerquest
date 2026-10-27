"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BADGES } from "@/lib/progress";
import { blankState, type AppUser, type ClientState } from "@/lib/models";
import { createSync, type Sync } from "@/lib/sync";

interface Toast { id: number; content: ReactNode }
/** Screen state that survives moving between pages (like the old single-page app). */
export interface UiMemory {
  careers: { cat: string; query: string };
  quiz: { qi: number; answers: number[] };
}

interface AppContextValue {
  user: AppUser | null;
  state: ClientState;
  /** Apply a change: the recipe edits a fresh copy, badges are checked, and the API is synced in the background. */
  commit: (recipe: (draft: ClientState) => void) => ClientState;
  toast: (content: ReactNode) => void;
  sync: Sync;
  ui: UiMemory;
  setUi: (fn: (ui: UiMemory) => UiMemory) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const v = useContext(AppContext);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}

declare global {
  interface Window { CareerQuest?: { pendingSaves: () => number; saved: () => Promise<void> } }
}

export default function AppProvider({ initialState, user, children }: { initialState: ClientState | null; user: AppUser | null; children: ReactNode }) {
  const [initial] = useState<ClientState>(() => ({ ...blankState(), ...(initialState || {}) }));
  const [state, setState] = useState<ClientState>(initial);
  const stateRef = useRef(initial);
  const [toastState, setToastState] = useState<Toast | null>(null);
  const [toastShown, setToastShown] = useState(false);
  const [ui, setUiState] = useState<UiMemory>({ careers: { cat: "all", query: "" }, quiz: { qi: 0, answers: [] } });

  const toast = useCallback((content: ReactNode) => {
    setToastState((t) => ({ id: (t?.id ?? 0) + 1, content }));
    setToastShown(true);
  }, []);
  // Each toast stays up for 3.2 s; a newer toast restarts the timer.
  useEffect(() => {
    if (!toastState) return;
    const t = setTimeout(() => setToastShown(false), 3200);
    return () => clearTimeout(t);
  }, [toastState]);

  const [sync] = useState(() => createSync(initial, (msg) => toast(msg), !!user));

  /** Adds newly earned badges to the state (and announces the latest one), like the original checkBadges(). */
  const withBadges = useCallback((next: ClientState): ClientState => {
    const fresh = BADGES.filter((b) => b.test(next) && !next.seenBadges.includes(b.id)).map((b) => b.id);
    if (!fresh.length) return next;
    if (next.profile && fresh.some((id) => id !== "welcome")) {
      const b = BADGES.find((x) => x.id === fresh[fresh.length - 1])!;
      toast(<>🏅 Badge unlocked: <b>{b.name}</b></>);
    }
    return { ...next, seenBadges: next.seenBadges.concat(fresh) };
  }, [toast]);

  const commit = useCallback((recipe: (draft: ClientState) => void) => {
    const draft = structuredClone(stateRef.current);
    recipe(draft);
    const next = withBadges(draft);
    stateRef.current = next;
    setState(next);
    sync.flush(next);
    return next;
  }, [sync, withBadges]);

  // Badges earned before this visit (or by the server-loaded state) are checked once on load.
  useEffect(() => {
    const next = withBadges(stateRef.current);
    if (next !== stateRef.current) { stateRef.current = next; setState(next); sync.flush(next); }
  }, [withBadges, sync]);

  // Warn before leaving with unsaved changes; expose save status for debugging and e2e tests.
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => { if (sync.pending() > 0) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", onUnload);
    window.CareerQuest = { pendingSaves: () => sync.pending(), saved: () => sync.settled() };
    return () => { window.removeEventListener("beforeunload", onUnload); delete window.CareerQuest; };
  }, [sync]);

  const value = useMemo<AppContextValue>(() => ({ user, state, commit, toast, sync, ui, setUi: setUiState }), [user, state, commit, toast, sync, ui]);

  return (
    <AppContext.Provider value={value}>
      {children}
      <div id="toast" className={"toast" + (toastShown ? " show" : "")} role="status" aria-live="polite">{toastState?.content}</div>
    </AppContext.Provider>
  );
}
