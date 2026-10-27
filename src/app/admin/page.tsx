import Link from "next/link";
import { SIMS, simById } from "@/content/sims";
import { Meter } from "@/components/ui";
import { careerById } from "@/lib/progress";
import { overviewStats } from "@/lib/admin";
import { requireAdmin } from "@/lib/guard";

export default async function AdminOverview() {
  await requireAdmin();
  const s = await overviewStats();
  const maxDay = Math.max(1, ...s.signups.map((d) => d.n));
  const maxExplored = Math.max(1, ...s.explored.map((e) => e.n));
  const simRows = [...s.sims].sort((a, b) => SIMS.findIndex((x) => x.id === a.simId) - SIMS.findIndex((x) => x.id === b.simId));
  const cards: [number, string, string?][] = [
    [s.users, "Users", `${s.signupsToday} today · ${s.signupsWeek} in 7 days`],
    [s.quizCompletions, "Quiz completions"],
    [s.simAttempts, "Simulation attempts"],
    [s.portfolioItems, "Portfolio items", `${s.publicPortfolios} public portfolio${s.publicPortfolios === 1 ? "" : "s"}`],
  ];
  return (
    <>
      <section className="page-head"><h1>Overview</h1><p className="muted">How students are using CareerQuest.{s.suspended ? ` ${s.suspended} suspended account${s.suspended === 1 ? "" : "s"}.` : ""}</p></section>
      <section className="stats">
        {cards.map(([n, label, sub]) => <div className="stat" key={label}><b>{n}</b><span>{label}</span>{sub && <small>{sub}</small>}</div>)}
      </section>
      <section className="card">
        <div className="sec-h"><h2>Signups, last 14 days</h2><span className="muted small">{s.signups.reduce((a, d) => a + d.n, 0)} total</span></div>
        <div className="bars" role="img" aria-label={"Signups per day: " + s.signups.map((d) => `${d.day} ${d.n}`).join(", ")}>
          {s.signups.map((d) => <div className="bar" key={d.day}>{d.n > 0 && <b>{d.n}</b>}<i style={{ height: `${(d.n / maxDay) * 85}%` }} /></div>)}
        </div>
        <div className="bars-x" aria-hidden="true">{s.signups.map((d, i) => <span key={d.day}>{i % 2 === 1 ? "" : d.day.slice(8)}</span>)}</div>
      </section>
      <div className="admin-grid">
        <section className="card">
          <h2>Most explored careers</h2>
          {s.explored.length ? s.explored.map((e) => {
            const c = careerById(e.career);
            return <div className="hrow" key={e.career}><span>{c?.name ?? e.career}</span><b>{e.n}</b><Meter pct={Math.round((e.n / maxExplored) * 100)} color={c?.color} /></div>;
          }) : <p className="empty">No careers explored yet.</p>}
        </section>
        <section className="card">
          <h2>Simulations</h2>
          {s.sims.length ? (
            <div className="table-wrap">
              <table className="dtable">
                <thead><tr><th>Simulation</th><th className="num">Students</th><th className="num">Attempts</th><th className="num">Avg</th></tr></thead>
                <tbody>{simRows.map((r) => <tr key={r.simId}><td>{simById(r.simId)?.title ?? r.simId}</td><td className="num">{r.students}</td><td className="num">{r.attempts}</td><td className="num">{r.avg}%</td></tr>)}</tbody>
              </table>
            </div>
          ) : <p className="empty">No attempts yet.</p>}
        </section>
      </div>
      <p className="muted small"><Link href="/admin/users">Manage users →</Link></p>
    </>
  );
}
