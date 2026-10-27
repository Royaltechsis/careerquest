import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CQ_DATA } from "@/content/data";
import { simById } from "@/content/sims";
import { Meter } from "@/components/ui";
import AdminButton from "@/components/admin/AdminButton";
import { ROADMAP_IDS, careerById, roadmapPct } from "@/lib/progress";
import { userDetail } from "@/lib/admin";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/guard";
import { isUuid } from "@/lib/portfolio";

export const metadata: Metadata = { title: "User" };
type Props = { params: Promise<{ id: string }> };

export default async function AdminUser({ params }: Props) {
  const admin = await requireAdmin();
  const { id } = await params;
  const d = isUuid(id) ? await userDetail(id) : null;
  if (!d) notFound();
  const { user: u, profile: p, state, attempts, portfolio } = d;
  const self = u.id === admin.id;
  const api = `/api/admin/users/${u.id}`;
  return (
    <>
      <p className="small"><Link href="/admin/users">‹ All users</Link></p>
      <section className="page-head">
        <h1>{u.name}</h1>
        <p className="muted">@{u.username} · {u.email}{" "}
          {u.role === "admin" && <span className="pill admin">Admin</span>}{" "}
          {u.suspendedAt && <span className="pill warn">Suspended {formatDate(u.suspendedAt)}</span>}
        </p>
      </section>
      <section className="card">
        <h2>Actions</h2>
        {self ? <p className="small muted">This is your account. Another admin can change its role or status.</p> : (
          <div className="cta-row" id="userActions">
            {u.role === "admin"
              ? <AdminButton url={api} body={{ role: "user" }} confirm={`Remove admin access from ${u.name}?`} id="roleBtn">Remove admin</AdminButton>
              : <AdminButton url={api} body={{ role: "admin" }} confirm={`Give ${u.name} admin access?`} id="roleBtn">Make admin</AdminButton>}
            {u.suspendedAt
              ? <AdminButton url={api} body={{ suspended: false }} id="suspendBtn">Unsuspend</AdminButton>
              : <AdminButton url={api} body={{ suspended: true }} confirm={`Suspend ${u.name}? They'll be logged out and can't log in until you unsuspend them.`} id="suspendBtn">Suspend</AdminButton>}
            <AdminButton url={api} method="DELETE" confirm={`Delete ${u.name} (@${u.username}) and all their data? This can't be undone.`} then="/admin/users" className="btn danger sm" id="deleteBtn">Delete user</AdminButton>
          </div>
        )}
      </section>
      <div className="admin-grid">
        <section className="card">
          <h2>Profile</h2>
          <dl className="kv">
            <dt>University</dt><dd>{p?.university || "—"}</dd>
            <dt>Course</dt><dd>{p?.course || "—"}{p?.level ? ` · ${p.level} level` : ""}</dd>
            <dt>Goals</dt><dd>{p?.goals.length ? p.goals.join(", ") : "—"}</dd>
            <dt>Interests</dt><dd>{p?.interests.length ? p.interests.map((c) => careerById(c)?.name ?? c).join(", ") : "—"}</dd>
            <dt>Explored</dt><dd>{state.explored.length}/{CQ_DATA.careers.length} careers</dd>
            <dt>Quiz</dt><dd>{state.quiz ? state.quiz.top.map((c) => careerById(c)?.name ?? c).join(", ") : "Not taken"}</dd>
            <dt>Badges</dt><dd>{state.seenBadges.length}</dd>
            <dt>Joined</dt><dd>{formatDateTime(u.createdAt)}</dd>
            <dt>Last active</dt><dd>{formatDateTime(u.lastActiveAt)}</dd>
          </dl>
        </section>
        <section className="card">
          <h2>Roadmaps</h2>
          {ROADMAP_IDS.map((cid) => { const c = careerById(cid)!; const pct = roadmapPct(state, cid); return <div className="hrow" key={cid}><span>{c.name}</span><b>{pct}%</b><Meter pct={pct} color={c.color} /></div>; })}
        </section>
      </div>
      <section className="card">
        <h2>Simulation attempts ({attempts.length})</h2>
        {attempts.length ? (
          <div className="table-wrap">
            <table className="dtable">
              <thead><tr><th>Simulation</th><th className="num">Score</th><th>When</th></tr></thead>
              <tbody>{attempts.map((a) => <tr key={a.id}><td>{simById(a.simId)?.title ?? a.simId}<br /><span className="small muted">{a.summary}</span></td><td className="num">{a.score}%</td><td>{formatDateTime(a.createdAt)}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="empty">No attempts yet.</p>}
      </section>
      <section className="card">
        <h2>Portfolio ({portfolio.length})</h2>
        {portfolio.length ? portfolio.map((it) => (
          <article className="pf mod-item" key={it.id}>
            <h3>{it.title || "Untitled"}{" "}
              <span className={`pill ${it.isPublic ? "ok" : ""}`}>{it.isPublic ? "Public" : "Private"}</span>{" "}
              {it.hiddenAt && <span className="pill warn">Hidden</span>}
            </h3>
            {it.problem && <p className="small">{it.problem}</p>}
            {it.isPublic && (it.hiddenAt
              ? <AdminButton url={`/api/admin/portfolio/${it.id}`} body={{ hidden: false }}>Unhide</AdminButton>
              : <AdminButton url={`/api/admin/portfolio/${it.id}`} body={{ hidden: true }}>Hide from public page</AdminButton>)}
          </article>
        )) : <p className="empty">No portfolio items.</p>}
      </section>
    </>
  );
}
