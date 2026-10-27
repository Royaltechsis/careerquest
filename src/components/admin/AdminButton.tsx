"use client";
import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * A button that calls an admin API route, then refreshes the server-rendered page.
 * `confirm` asks first; `then` navigates somewhere else instead of refreshing.
 */
export default function AdminButton({ url, method = "PATCH", body, confirm: ask, then, className = "btn ghost sm", id, children }: {
  url: string; method?: "PATCH" | "POST" | "DELETE"; body?: unknown; confirm?: string; then?: string; className?: string; id?: string; children: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  async function run() {
    if (ask && !window.confirm(ask)) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
      if (!res.ok) { const j = (await res.json().catch(() => ({}))) as { error?: string }; setError(j.error || "That didn't work. Try again."); return; }
      startTransition(() => { if (then) router.push(then); else router.refresh(); });
    } catch {
      setError("You seem to be offline. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={className} id={id} disabled={busy} onClick={run}>{children}</button>
      {error && <span className="form-err small" role="alert">{error}</span>}
    </>
  );
}
