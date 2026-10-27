"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app/AppProvider";
import ProfileForm from "./ProfileForm";

/** /me: profile form, account details, log out and "start over". */
export default function Account() {
  const { state, user, sync, toast } = useApp();
  const router = useRouter();
  useEffect(() => { if (!state.profile) router.replace("/start"); }, [state.profile, router]);
  if (!state.profile || !user) return null;

  async function reset() {
    if (!confirm("Delete all your CareerQuest progress? Your account stays.")) return;
    await sync.settled();
    const res = await fetch("/api/state", { method: "DELETE" });
    // A full page load on purpose: it reloads the (now empty) state from the server.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (res.ok) location.assign("/start"); else toast("Couldn't reset right now. Try again.");
  }
  async function logout() {
    await sync.settled();
    await fetch("/api/auth/logout", { method: "POST" });
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload drops the signed-in state
    location.assign("/");
  }

  return (
    <>
      <ProfileForm />
      <section className="narrow">
        <div className="card">
          <h2>Account</h2>
          <p className="small muted">Signed in as <b>{user.email}</b> · public page <a href={`/p/${user.username}`} target="_blank" rel="noopener">/p/{user.username}</a></p>
          <button type="button" className="btn ghost" id="logout" onClick={logout}>Log out</button>
        </div>
        <div className="card danger-zone">
          <h2>Start over</h2>
          <p className="small muted">Deletes your profile answers, quiz, roadmap progress, simulation history, badges and portfolio. Your account stays.</p>
          <button type="button" className="btn danger" id="reset" onClick={reset}>Reset everything</button>
        </div>
      </section>
    </>
  );
}
