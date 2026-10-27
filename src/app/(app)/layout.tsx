import type { ReactNode } from "react";
import AppProvider from "@/components/app/AppProvider";
import AppChrome from "@/components/app/AppChrome";
import { currentUser } from "@/lib/auth";
import { loadState } from "@/lib/state";

export const dynamic = "force-dynamic";

/** Loads the signed-in student's state once on the server; the client keeps it in memory and syncs changes back. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  const state = user ? await loadState(user) : null;
  return (
    <AppProvider initialState={state} user={user && { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role }}>
      <AppChrome>{children}</AppChrome>
    </AppProvider>
  );
}
