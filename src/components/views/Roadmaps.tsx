"use client";
import Link from "next/link";
import { CQ_DATA } from "@/content/data";
import { Icon, Meter, Ring, cssVars } from "@/components/ui";
import { useApp } from "@/components/app/AppProvider";
import { ROADMAP_IDS, careerById, categoryById, itemDone, roadmapItems, roadmapPct, stageDone } from "@/lib/progress";

const TYPE: Record<string, string> = { learn: "Learn", tool: "Tool", challenge: "Challenge", project: "Project", milestone: "Milestone" };

export function RoadmapList() {
  const { state } = useApp();
  return (
    <>
      <section className="page-head"><h1 tabIndex={-1}>Roadmaps</h1><p className="muted">Step-by-step plans from first steps to job-ready. Tick things off as you go.</p></section>
      <div className="cgrid">
        {ROADMAP_IDS.map((cid) => {
          const c = careerById(cid)!; const r = CQ_DATA.roadmaps[cid]; const p = roadmapPct(state, cid);
          return (
            <Link className="ccard" href={`/roadmap/${cid}`} style={cssVars({ "--c": c.color })} key={cid}>
              <span className="ccard-ic"><Icon name={categoryById(c.cat).icon} /></span>
              <span className="ccard-cat">{r.stages.length} stages · {roadmapItems(cid).length} steps</span>
              <b className="ccard-n">{c.name}</b>
              <span className="ccard-t">{r.intro}</span>
              <Meter pct={p} color={c.color} />
              <span className="small muted">{p}% complete</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function RoadmapDetail({ careerId: cid }: { careerId: string }) {
  const { state: S, commit, toast } = useApp();
  const c = careerById(cid)!;
  const r = CQ_DATA.roadmaps[cid];
  const p = roadmapPct(S, cid);
  const nextIdx = r.stages.findIndex((st) => !stageDone(S, cid, st));

  function toggle(itemId: string, checked: boolean) {
    const st = r.stages.find((s) => s.items.some((i) => i.id === itemId))!;
    const wasFull = stageDone(S, cid, st);
    const next = commit((d) => {
      const m = d.roadmap[cid] || (d.roadmap[cid] = {});
      if (checked) m[itemId] = true; else delete m[itemId];
    });
    if (!wasFull && stageDone(next, cid, st)) toast(<>Stage complete: <b>{st.title}</b> ✓</>);
  }

  return (
    <>
      <section className="c-hero slim" style={cssVars({ "--c": c.color })}>
        <Link className="back" href="/roadmaps">‹ All roadmaps</Link>
        <div className="rm-head"><div><span className="ccard-cat">Roadmap</span><h1 tabIndex={-1}>{c.name}</h1><p className="lead">{r.intro}</p></div><Ring pct={p} label={p + "% complete"} /></div>
        <div className="cta-row"><Link className="btn ghost sm" href={`/career/${cid}`}>Career profile</Link></div>
      </section>
      <ol className="timeline" style={cssVars({ "--c": c.color })}>
        {r.stages.map((st, si) => {
          const done = st.items.filter((it) => itemDone(S, cid, it)).length;
          const full = done === st.items.length;
          return (
            <li className={`stage ${full ? "full" : ""} ${si === nextIdx ? "current" : ""}`} key={st.title}>
              <span className="stage-dot">{full ? <Icon name="check" /> : si + 1}</span>
              <div className="stage-card card">
                <div className="stage-h"><div><b>{st.title}</b><span className="muted small"> · {st.sub}</span></div><span className={`small ${full ? "good" : "muted"}`}>{done}/{st.items.length}{si === nextIdx ? " · you are here" : ""}</span></div>
                <ul className="items">
                  {st.items.map((it) => {
                    const d = itemDone(S, cid, it);
                    const auto = it.sim ? S.sims[it.sim] : undefined;
                    return (
                      <li className={`item ${d ? "done" : ""}`} key={it.id}>
                        <label>
                          <input type="checkbox" data-it={it.id} checked={d} disabled={!!auto} onChange={(e) => toggle(it.id, e.target.checked)} />
                          <span className="box"><Icon name="check" /></span><span className="it-t">{it.t}</span>
                        </label>
                        <span className={`type t-${it.type}`}>{TYPE[it.type]}</span>
                        {it.sim && <Link className={`btn sm ${auto ? "ghost" : ""}`} href={`/sim/${it.sim}`}>{auto ? `Done · ${auto.best}%` : "Start ›"}</Link>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="muted small center">Simulation steps tick themselves when you complete them. Other steps are yours to tick honestly.</p>
    </>
  );
}
