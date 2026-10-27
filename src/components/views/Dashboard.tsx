"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CQ_DATA } from "@/content/data";
import { SIMS, simById } from "@/content/sims";
import { Icon, Meter, Pill } from "@/components/ui";
import { useApp } from "@/components/app/AppProvider";
import { BADGES, ROADMAP_IDS, careerById, focusCareers, itemDone, recommendations, roadmapItems, roadmapPct, skillCounts } from "@/lib/progress";

export interface Announcement { id: string; title: string; body: string }

export default function Dashboard({ announcements = [] }: { announcements?: Announcement[] }) {
  const { state: S } = useApp();
  const router = useRouter();
  useEffect(() => { if (!S.profile) router.replace("/start"); }, [S.profile, router]);
  if (!S.profile) return null;

  const recs = recommendations(S);
  const r0 = recs[0];
  const sk = skillCounts(S);
  const simIds = Object.keys(S.sims);
  const focus = focusCareers(S);
  const started = ROADMAP_IDS.filter((cid) => roadmapPct(S, cid) > 0 || focus.includes(cid));
  const shown = started.length ? started : ROADMAP_IDS.slice(0, 3);
  const earned = BADGES.filter((b) => b.test(S));
  const doneItems = ROADMAP_IDS.reduce((n, cid) => n + roadmapItems(cid).filter((it) => itemDone(S, cid, it)).length, 0);

  return (
    <>
      <section className="dash-head">
        <div><p className="eyebrow">{S.profile.course || "Student"}{S.profile.uni ? " · " + S.profile.uni : ""}</p><h1 tabIndex={-1}>Hey {S.profile.name} 👋</h1></div>
      </section>
      {announcements.map((a) => (
        <aside className="announce" key={a.id} role="note"><b>{a.title}</b>{a.body && <span>{a.body}</span>}</aside>
      ))}
      <Link className="next-card" href={r0.href}>
        <span className="next-ic"><Icon name={r0.icon} /></span>
        <span className="next-body"><span className="eyebrow">Recommended next step</span><b>{r0.t}</b><span>{r0.d}</span></span>
        <span className="btn">{r0.cta} <Icon name="arrow" /></span>
      </Link>
      {recs.length > 1 && (
        <div className="also"><span className="muted small">Also good:</span>{" "}
          {recs.slice(1, 3).map((r, i) => <span key={r.href + r.t}>{i > 0 && " · "}<Link href={r.href}>{r.t}</Link></span>)}
        </div>
      )}
      <section className="stats">
        <div className="stat"><b>{S.explored.length}<small>/{CQ_DATA.careers.length}</small></b><span>Careers explored</span></div>
        <div className="stat"><b>{simIds.length}<small>/{SIMS.length}</small></b><span>Simulations done</span></div>
        <div className="stat"><b>{doneItems}</b><span>Roadmap steps</span></div>
        <div className="stat"><b>{S.portfolio.length}</b><span>Portfolio items</span></div>
      </section>
      <div className="dash-grid">
        <section className="card"><div className="sec-h"><h2>Your roadmaps</h2><Link href="/roadmaps">All</Link></div>
          {shown.map((cid) => {
            const c = careerById(cid)!; const p = roadmapPct(S, cid);
            return <Link className="rm-row" href={`/roadmap/${cid}`} key={cid}><span className="rm-n"><b>{c.name}</b><span>{p}%</span></span><Meter pct={p} color={c.color} /></Link>;
          })}
        </section>
        <section className="card"><div className="sec-h"><h2>Completed challenges</h2><Link href="/challenges">All</Link></div>
          {simIds.length ? (
            <ul className="done-list">
              {simIds.map((id) => {
                const s = simById(id); const r = S.sims[id];
                return s ? <li key={id}><Link href={`/sim/${id}`}><b>{s.title}</b><span>{careerById(s.career)!.name}</span></Link><Pill ok={r.best >= 80}>{r.best}%</Pill></li> : null;
              })}
            </ul>
          ) : <p className="empty">No simulations yet. <Link href="/challenges">Try your first one</Link>; they take about 5 minutes.</p>}
        </section>
        <section className="card"><div className="sec-h"><h2>Skills practised</h2></div>
          {sk.length ? (
            <>
              <div className="skill-cloud">{sk.map(([k, n]) => <span className="skill" key={k}>{k}{n > 1 && <> <b>×{n}</b></>}</span>)}</div>
              <p className="muted small">Based on simulations you&apos;ve completed here, not a claim of professional competence.</p>
            </>
          ) : <p className="empty">Skills appear here as you complete simulations.</p>}
        </section>
        <section className="card"><div className="sec-h"><h2>Badges</h2><span className="muted small">{earned.length}/{BADGES.length}</span></div>
          <div className="badges">
            {BADGES.map((b) => {
              const on = b.test(S);
              return <div className={`badge ${on ? "on" : ""}`} title={b.desc} key={b.id}><span><Icon name={on ? b.icon : "lock"} /></span><b>{b.name}</b><small>{b.desc}</small></div>;
            })}
          </div>
        </section>
      </div>
    </>
  );
}
