"use client";
import Link from "next/link";
import { CQ_DATA } from "@/content/data";
import { CareerCard, Icon } from "@/components/ui";
import { useApp } from "@/components/app/AppProvider";
import { categoryById } from "@/lib/progress";

export default function Careers() {
  const { state, ui, setUi } = useApp();
  const { cat: catFilter, query } = ui.careers;
  const setFilter = (patch: Partial<typeof ui.careers>) => setUi((u) => ({ ...u, careers: { ...u.careers, ...patch } }));
  const q = query.trim().toLowerCase();
  const list = CQ_DATA.careers.filter((c) =>
    (catFilter === "all" || c.cat === catFilter) &&
    (!q || [c.name, c.tagline, c.what, categoryById(c.cat).name, ...c.skills, ...c.tools, ...c.entry].join(" ").toLowerCase().includes(q)));
  const cats = [{ id: "all", name: "All" }, ...CQ_DATA.categories];

  return (
    <>
      <section className="page-head"><h1 tabIndex={-1}>Explore careers</h1><p className="muted">Ten paths, explained plainly. Tap one to see what the work is really like.</p></section>
      <div className="filters">
        <label className="search"><Icon name="compass" /><span className="sr">Search careers</span>
          <input id="q" type="search" placeholder="Search: ‘design’, ‘SQL’, ‘security’…" value={query} onChange={(e) => setFilter({ query: e.target.value })} />
        </label>
        <div className="chips scroll" role="group" aria-label="Filter by category">
          {cats.map((c) => (
            <button type="button" key={c.id} className={`chip-btn ${catFilter === c.id ? "on" : ""}`} data-cat={c.id} aria-pressed={catFilter === c.id} onClick={() => setFilter({ cat: c.id })}>{c.name}</button>
          ))}
        </div>
      </div>
      <p className="muted small" id="count" aria-live="polite">{list.length} career{list.length === 1 ? "" : "s"}</p>
      <div className="cgrid" id="cgrid">
        {list.length ? list.map((c) => <CareerCard key={c.id} c={c} explored={state.explored.includes(c.id)} />)
          : <p className="empty">No careers match “{query}”. Try another word.</p>}
      </div>
      <Link className="quiz-banner" href="/quiz"><b>Not sure where to start?</b><span>Take the 2-minute interest quiz →</span></Link>
    </>
  );
}
