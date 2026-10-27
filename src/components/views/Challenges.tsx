"use client";
import Link from "next/link";
import { SIMS } from "@/content/sims";
import { Icon, Pill, cssVars } from "@/components/ui";
import { useApp } from "@/components/app/AppProvider";
import { careerById } from "@/lib/progress";

export default function Challenges() {
  const { state } = useApp();
  return (
    <>
      <section className="page-head"><h1 tabIndex={-1}>Challenges</h1><p className="muted">Hands-on simulations of real workplace tasks. Mistakes are part of it; every one comes with feedback.</p></section>
      <div className="sgrid">
        {SIMS.map((s) => {
          const c = careerById(s.career)!; const r = state.sims[s.id];
          return (
            <Link className="scard" href={`/sim/${s.id}`} style={cssVars({ "--c": c.color })} key={s.id}>
              <span className="scard-top"><span className="ccard-cat">{c.name}</span>{r ? <Pill ok={r.best >= 80}>Best {r.best}%</Pill> : <Pill>{s.mins} min</Pill>}</span>
              <b>{s.title}</b><span className="small">{s.desc}</span>
              <span className="skill-cloud sm">{s.skills.map((k) => <span className="skill" key={k}>{k}</span>)}</span>
              <span className="scard-go">{r ? "Play again" : "Start"} <Icon name="arrow" /></span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
