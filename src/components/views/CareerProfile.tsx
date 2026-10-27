import Link from "next/link";
import type { Career } from "@/content/types";
import { simById } from "@/content/sims";
import { cssVars } from "@/components/ui";
import { categoryById } from "@/lib/progress";
import CareerActions from "./CareerActions";

const Ticks = ({ items }: { items: string[] }) => <ul className="ticks">{items.map((x) => <li key={x}>{x}</li>)}</ul>;

/** A career profile. The content is rendered on the server; only the action row is interactive. */
export default function CareerProfile({ c }: { c: Career }) {
  const s = c.sim ? simById(c.sim) ?? null : null;
  return (
    <>
      <section className="c-hero" style={cssVars({ "--c": c.color })}>
        <Link className="back" href="/careers">‹ All careers</Link>
        <span className="ccard-cat">{categoryById(c.cat).name}</span>
        <h1 tabIndex={-1}>{c.name}</h1><p className="lead">{c.tagline}</p>
        <CareerActions careerId={c.id} hasRoadmap={c.roadmap} sim={s && { id: s.id, title: s.title }} />
      </section>
      <div className="c-grid">
        <section className="card span2"><h2>What they do</h2><p>{c.what}</p></section>
        <section className="card"><h2>A typical week might include</h2><Ticks items={c.day} /></section>
        <section className="card"><h2>Skills to build</h2><Ticks items={c.skills} /></section>
        <section className="card"><h2>Tools</h2><div className="skill-cloud">{c.tools.map((t) => <span className="skill" key={t}>{t}</span>)}</div></section>
        <section className="card"><h2>Entry-level roles</h2><Ticks items={c.entry} /></section>
        <section className="card span2"><h2>Where it can lead</h2><ol className="ladder">{c.path.map((p) => <li key={p}>{p}</li>)}</ol></section>
        <section className="card"><h2>How to learn it</h2><Ticks items={c.routes} /></section>
        <section className="card"><h2>Portfolio project ideas</h2><Ticks items={c.projects} /></section>
        <section className="card span2"><h2>Certifications</h2><Ticks items={c.certs} /><p className="muted small">Optional for most entry roles. Projects you can show usually matter more.</p></section>
      </div>
      <p className="muted center">Not feeling it? That&apos;s useful to know too. <Link href="/careers">Explore another path</Link>.</p>
    </>
  );
}
