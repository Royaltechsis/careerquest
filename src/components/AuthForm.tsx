"use client";
import { useState, type FormEvent } from "react";

export default function AuthForm({ mode, next }: { mode: "login" | "signup"; next: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      const res = await fetch(signup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error || "Something went wrong. Try again."); setBusy(false); return; }
      window.location.assign(signup ? "/start" : next);
    } catch {
      setError("You seem to be offline. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <section className="narrow">
      <h1>{signup ? "Create your account" : "Welcome back"}</h1>
      <p className="muted">{signup ? "Free. Your progress, roadmaps and portfolio are saved to your account." : "Log in to pick up where you left off."}</p>
      <form className="card form" onSubmit={onSubmit} noValidate>
        {signup && (
          <>
            <label>First name <input name="name" required autoComplete="given-name" placeholder="e.g. Bunmi" maxLength={60} /></label>
            <label>Username <input name="username" required autoComplete="username" placeholder="e.g. bunmi" pattern="[a-z0-9_-]{3,30}" maxLength={30}
              onChange={(e) => { e.currentTarget.value = e.currentTarget.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""); }} />
              <span className="small muted">Your public portfolio will live at /p/your-username</span></label>
          </>
        )}
        <label>{signup ? "Email" : "Email or username"} <input name="email" type={signup ? "email" : "text"} required autoComplete={signup ? "email" : "username"} inputMode={signup ? "email" : "text"} /></label>
        <label>Password <input name="password" type="password" required minLength={8} autoComplete={signup ? "new-password" : "current-password"} />
          {signup && <span className="small muted">At least 8 characters.</span>}</label>
        <p className="form-err" role="alert">{error}</p>
        <button className="btn big" type="submit" disabled={busy}>{busy ? "One moment…" : signup ? "Create account" : "Log in"}</button>
        <p className="small muted center">
          {signup ? <>Already have an account? <a href={"/login" + (next !== "/dashboard" ? "?next=" + encodeURIComponent(next) : "")}>Log in</a></> : <>New here? <a href="/signup">Create a free account</a></>}
        </p>
      </form>
    </section>
  );
}
