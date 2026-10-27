"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AnnouncementForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") || "").trim();
    if (!title) { setError("Give the announcement a title."); return; }
    setBusy(true); setError(""); setDone("");
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body: String(f.get("body") || "").trim(), active: !!f.get("active") }),
      });
      if (!res.ok) { const j = (await res.json().catch(() => ({}))) as { error?: string }; setError(j.error || "Couldn't post that. Try again."); return; }
      formRef.current?.reset();
      setDone("Posted.");
      router.refresh();
    } catch {
      setError("You seem to be offline. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} className="card form" id="annForm" noValidate onSubmit={submit}>
      <h2>New announcement</h2>
      <label>Title <input name="title" required maxLength={120} placeholder="e.g. SIWES applications open on Monday" /></label>
      <label>Message <textarea name="body" rows={3} maxLength={600} placeholder="Optional details students should know" /></label>
      <label className="switch"><input type="checkbox" name="active" defaultChecked /><span className="sw" /><span>Show on dashboards now</span></label>
      <p className="form-err" role="alert">{error}</p>
      <p className="form-ok" role="status">{done}</p>
      <button className="btn" type="submit" disabled={busy}>Post announcement</button>
    </form>
  );
}
