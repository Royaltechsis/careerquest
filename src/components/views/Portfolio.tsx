"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { useApp } from "@/components/app/AppProvider";
import type { PortfolioItem } from "@/lib/models";

const uid = () => crypto.randomUUID();
type Editing = null | "new" | string;

function ProjectForm({ item, onSave, onCancel }: { item: Partial<PortfolioItem>; onSave: (f: Pick<PortfolioItem, "title" | "problem" | "approach" | "skills" | "link" | "public">) => void; onCancel: () => void }) {
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, []);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const title = String(d.get("title") || "").trim();
    const link = String(d.get("link") || "").trim();
    if (!title) { setError("Give your project a title."); titleRef.current?.focus(); return; }
    if (link && !/^https?:\/\/\S+\.\S+/.test(link)) { setError("Evidence link should start with https://"); linkRef.current?.focus(); return; }
    onSave({ title, problem: String(d.get("problem") || "").trim(), approach: String(d.get("approach") || "").trim(), skills: String(d.get("skills") || "").trim(), link, public: !!d.get("public") });
  }

  return (
    <form className="card form pf-form" id="pfForm" noValidate onSubmit={submit}>
      <h2>{item.id ? "Edit project" : "Add a project"}</h2>
      <label>Title <input ref={titleRef} name="title" required defaultValue={item.title} placeholder="e.g. Hostel laundry booking app" /></label>
      <label>The problem <textarea name="problem" rows={2} defaultValue={item.problem} placeholder="What needed solving, and for whom?" /></label>
      <label>Your approach <textarea name="approach" rows={3} defaultValue={item.approach} placeholder="What you did, the tools you used, what you learned" /></label>
      <label>Skills shown <input name="skills" defaultValue={item.skills} placeholder="Comma separated: Figma, user research" /></label>
      <label>Evidence link <input ref={linkRef} name="link" type="url" inputMode="url" defaultValue={item.link} placeholder="https://github.com/… or a Figma / Drive link" /></label>
      <label className="switch"><input type="checkbox" name="public" defaultChecked={!!item.public} /><span className="sw" /><span>Public</span></label>
      <p className="form-err" id="pfErr" role="alert">{error}</p>
      <div className="cta-row"><button className="btn" type="submit">Save project</button><button className="btn ghost" type="button" id="pfCancel" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}

/** Portfolio builder. `startAdding` opens the add form (from /portfolio?add=1). */
export default function Portfolio({ startAdding = false }: { startAdding?: boolean }) {
  const { state: S, user, commit, toast } = useApp();
  const router = useRouter();
  const [editing, setEditing] = useState<Editing>(startAdding ? "new" : null);
  const pub = S.portfolio.filter((p) => p.public).length;
  const editItem: Partial<PortfolioItem> | undefined = editing === "new" ? { public: false } : S.portfolio.find((p) => p.id === editing);
  const username = user ? user.username : "";

  function close() {
    setEditing(null);
    if (startAdding) router.replace("/portfolio");
  }
  function save(fields: Pick<PortfolioItem, "title" | "problem" | "approach" | "skills" | "link" | "public">) {
    commit((d) => {
      let it = editing === "new" ? undefined : d.portfolio.find((p) => p.id === editing);
      if (!it) {
        it = { id: uid(), source: "manual", created: Date.now(), updated: Date.now(), title: "", problem: "", approach: "", skills: "", link: "", evidence: "", career: "", public: false };
        d.portfolio.unshift(it);
      }
      Object.assign(it, fields, { updated: Date.now() });
    });
    toast("Project saved");
    close();
  }
  async function copyLink() {
    const url = location.origin + "/p/" + username;
    try { await navigator.clipboard.writeText(url); toast("Share link copied ✓"); }
    catch { prompt("Copy your share link:", url); }
  }
  function remove(id: string) {
    if (confirm("Delete this project? This can't be undone.")) commit((d) => { d.portfolio = d.portfolio.filter((p) => p.id !== id); });
  }

  return (
    <>
      <section className="page-head row">
        <div><h1 tabIndex={-1}>Portfolio</h1><p className="muted">Your evidence. Choose what the world sees.</p></div>
        {!editing && <button type="button" className="btn" id="addBtn" onClick={() => setEditing("new")}>+ Add project</button>}
      </section>
      {editItem && <ProjectForm key={editing} item={editItem} onSave={save} onCancel={close} />}
      <section className="card share">
        <div><b><Icon name="share" /> Public portfolio</b><span className="small muted">{pub} public item{pub === 1 ? "" : "s"}. Anyone with your link sees your public items, always up to date.</span></div>
        {S.profile ? (
          <div className="cta-row sm">
            <button type="button" className="btn sm" id="copyLink" disabled={!pub} onClick={copyLink}>Copy share link</button>
            <a className="btn ghost sm" id="viewPub" href={`/p/${username}`} target="_blank" rel="noopener">View public page ↗</a>
          </div>
        ) : <Link className="btn sm" href="/start">Create profile to share</Link>}
      </section>
      {S.portfolio.length ? (
        <div className="pf-list">
          {S.portfolio.map((p) => (
            <article className={`pf card ${p.public ? "is-pub" : ""}`} key={p.id}>
              <div className="pf-h">
                <div>{p.career && <span className="ccard-cat">{p.career}</span>}<h3>{p.title || "Untitled"}</h3></div>
                <label className="switch sm">
                  <input type="checkbox" data-pub={p.id} checked={p.public} onChange={(e) => { const v = e.target.checked; commit((d) => { const it = d.portfolio.find((x) => x.id === p.id); if (it) it.public = v; }); }} />
                  <span className="sw" /><span>{p.public ? "Public" : "Private"}</span>
                </label>
              </div>
              {p.hidden && p.public && <p className="small bad">Hidden from your public page by a moderator.</p>}
              {p.problem && <p><b>Problem.</b> {p.problem}</p>}
              {p.approach && <p><b>Approach.</b> {p.approach}</p>}
              {p.skills && <div className="skill-cloud sm">{p.skills.split(",").map((k) => k.trim()).filter(Boolean).map((k, i) => <span className="skill" key={k + i}>{k}</span>)}</div>}
              <div className="pf-f">
                {p.evidence && <span className="small muted">{p.evidence}</span>}
                {/^https?:\/\//.test(p.link) && <a className="small" href={p.link} target="_blank" rel="noopener noreferrer">Evidence ↗</a>}
                <span className="pf-act">
                  <button type="button" className="link" data-edit={p.id} onClick={() => { setEditing(p.id); window.scrollTo(0, 0); }}>Edit</button>
                  <button type="button" className="link danger" data-del={p.id} onClick={() => remove(p.id)}>Delete</button>
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty card"><p><b>Nothing here yet.</b></p><p className="small">Complete a <Link href="/challenges">simulation</Link> and it lands here automatically, or add your own project.</p></div>
      )}
    </>
  );
}
