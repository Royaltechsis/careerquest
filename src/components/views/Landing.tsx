"use client";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { useApp } from "@/components/app/AppProvider";
import type { IconName } from "@/lib/progress";

const FEATURES: [IconName, string, string][] = [
  ["compass", "Discover", "10 careers explained simply: what they do, skills, tools and how to start."],
  ["flask", "Practise", "Browser simulations of real tasks, with hints and instant feedback."],
  ["map", "Follow a roadmap", "Stage-by-stage plans you can tick off, from first steps to job-ready."],
  ["folder", "Prove it", "Turn completed work into a portfolio you can share with employers."],
];

function StartLink({ className, children }: { className: string; children: React.ReactNode }) {
  const { user } = useApp();
  return user ? <Link className={className} href="/start">{children}</Link> : <a className={className} href="/signup">{children}</a>;
}

export default function Landing() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">For university students</p>
          <h1 tabIndex={-1}>Try a career <span className="hl">before</span> you choose it.</h1>
          <p className="lead">Explore real careers, do hands-on workplace simulations, follow step-by-step roadmaps and build a portfolio that proves what you can do.</p>
          <div className="cta-row">
            <StartLink className="btn big">Start exploring, it&apos;s free <Icon name="arrow" /></StartLink>
            <Link className="btn ghost big" href="/careers">Browse careers</Link>
          </div>
          <p className="muted small">Free account. Your progress syncs across your devices.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="mock m1"><span className="mk-eyebrow">Mission · Cybersecurity</span><b>Spot the phishing email</b><span className="mk-line"><i className="flag">kora-mfb-support.com</i></span><span className="mk-line">Reply-To: <i className="flag">…@gmail.com</i></span><span className="mk-line"><i className="flag">URGENT: 2 hours</i></span></div>
          <div className="mock m2"><span className="mk-eyebrow">Roadmap · Data Analyst</span><div className="mk-steps"><span className="on">✓</span><span className="on">✓</span><span className="now">3</span><span>4</span><span>5</span></div><div className="meter"><span style={{ width: "46%" }} /></div></div>
          <div className="mock m3">🏅 <b>Phish hunter</b><span>Badge unlocked</span></div>
        </div>
      </section>
      <section className="feat-grid">
        {FEATURES.map(([i, t, d]) => <div className="feat" key={t}><span className="feat-ic"><Icon name={i} /></span><h3>{t}</h3><p>{d}</p></div>)}
      </section>
      <section className="how card">
        <h2>How it works</h2>
        <ol className="how-steps"><li><b>Tell us a little</b><span>Your course and goals. 30 seconds.</span></li><li><b>Explore or take the quiz</b><span>Find careers worth a closer look.</span></li><li><b>Do a mission</b><span>Experience the real work, learn from mistakes.</span></li><li><b>Build your proof</b><span>Roadmap progress and a portfolio you can share.</span></li></ol>
        <p className="muted">Changing your mind is part of it. Explore as many paths as you like.</p>
        <StartLink className="btn">Create my profile <Icon name="arrow" /></StartLink>
      </section>
    </>
  );
}
