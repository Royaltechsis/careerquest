"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { simById, type SimId } from "@/content/sims";
import { Icon, Ring, SkillCloud, cssVars } from "@/components/ui";
import { useApp } from "@/components/app/AppProvider";
import { careerById } from "@/lib/progress";
import { scoreSim, type SimScore, type SimSubmission } from "@/lib/scoring";
import Phishing, { PhishingDetails } from "@/components/sims/Phishing";
import DataSim, { DataDetails } from "@/components/sims/DataSim";
import UxAudit, { UxDetails } from "@/components/sims/UxAudit";
import ProductRank, { ProductDetails } from "@/components/sims/ProductRank";
import DecisionSim, { DecisionDetails } from "@/components/sims/DecisionSim";

const uid = () => crypto.randomUUID();

function SimRunner({ simId, onDone }: { simId: SimId; onDone: (sub: SimSubmission) => void }) {
  switch (simId) {
    case "phishing": return <Phishing onDone={(answers) => onDone({ simId, answers })} />;
    case "data": return <DataSim onDone={(answers) => onDone({ simId, answers })} />;
    case "uiux": return <UxAudit onDone={(answers) => onDone({ simId, answers })} />;
    case "product": return <ProductRank onDone={(answers) => onDone({ simId, answers })} />;
    case "cloud": case "marketing": return <DecisionSim simId={simId} onDone={(answers) => onDone({ simId, answers })} />;
  }
}

function SimDetails({ sub }: { sub: SimSubmission }) {
  switch (sub.simId) {
    case "phishing": return <PhishingDetails answers={sub.answers} />;
    case "data": return <DataDetails />;
    case "uiux": return <UxDetails answers={sub.answers} />;
    case "product": return <ProductDetails answers={sub.answers} />;
    case "cloud": case "marketing": return <DecisionDetails simId={sub.simId} />;
  }
}

interface Finished { sub: SimSubmission; res: SimScore; itemId: string }

export default function SimView({ simId }: { simId: SimId }) {
  const { state: S, commit, sync, toast } = useApp();
  const s = simById(simId)!;
  const c = careerById(s.career)!;
  const [run, setRun] = useState(0);
  const [done, setDone] = useState<Finished | null>(null);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!done) return;
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    cardRef.current?.focus({ preventScroll: true });
  }, [done]);

  function finish(sub: SimSubmission) {
    const res = scoreSim(sub); // same scoring the server applies when it records the attempt
    sync.simAttempt(sub);
    let itemId = "";
    commit((d) => {
      const prev = d.sims[simId];
      d.sims[simId] = { best: Math.max(res.score, prev ? prev.best : 0), last: res.score, attempts: (prev ? prev.attempts : 0) + 1, at: Date.now() };
      let item = d.portfolio.find((p) => p.source === "sim:" + simId);
      if (!item) {
        item = { id: uid(), source: "sim:" + simId, public: false, created: Date.now(), updated: Date.now(), title: "", problem: "", approach: "", skills: "", link: "", evidence: "", career: "" };
        d.portfolio.unshift(item);
      }
      Object.assign(item, res.portfolio, { skills: s.skills.join(", "), link: "", evidence: `Completed in CareerQuest · score ${d.sims[simId].best}%`, career: c.name, updated: Date.now() });
      itemId = item.id;
    });
    setDone({ sub, res, itemId });
  }

  const item = done ? S.portfolio.find((p) => p.id === done.itemId) : undefined;
  function setPublic(pub: boolean) {
    if (!done) return;
    commit((d) => { const it = d.portfolio.find((p) => p.id === done.itemId); if (it) it.public = pub; });
    toast(pub ? "Now public on your portfolio" : "Now private");
  }

  const score = done?.res.score ?? 0;
  const pass = score >= 60;
  return (
    <>
      <section className="c-hero slim" style={cssVars({ "--c": c.color })}>
        <Link className="back" href="/challenges">‹ Challenges</Link>
        <span className="ccard-cat">{c.name} · {s.level} · ~{s.mins} min</span><h1 tabIndex={-1}>{s.title}</h1><p className="lead">{s.desc}</p>
      </section>
      <div id="simRoot" className="sim" hidden={!!done}>{!done && <SimRunner key={run} simId={simId} onDone={finish} />}</div>
      <div id="simResult">
        {done && (
          <section className="result-card card" tabIndex={-1} id="resCard" ref={cardRef}>
            <div className="res-top">
              <Ring pct={score} label={"Score " + score + "%"} />
              <div>
                <p className="eyebrow">{pass ? "Mission complete" : "Mission complete: room to grow"}</p>
                <h2>{score >= 80 ? "Excellent work! 🎉" : pass ? "Solid effort 💪" : "Good first try"}</h2>
                <p>{done.res.summary}</p>
              </div>
            </div>
            <div className="res-skills"><span className="eyebrow">Skills practised</span><SkillCloud skills={s.skills} /></div>
            <div className="res-details"><SimDetails sub={done.sub} /></div>
            <div className="folio-added">
              <b><Icon name="folder" /> Added to your portfolio</b>
              <span className="small">Saved as a private draft. Edit the write-up or make it public anytime.</span>
              <label className="switch"><input type="checkbox" id="pubNow" checked={!!item?.public} onChange={(e) => setPublic(e.target.checked)} /><span className="sw" /><span>Show on my public portfolio</span></label>
            </div>
            <div className="cta-row">
              <button type="button" className="btn" id="again" onClick={() => { setDone(null); setRun((n) => n + 1); }}>Try again</button>
              <Link className="btn ghost" href="/portfolio">Edit in portfolio</Link>
              <Link className="btn ghost" href={S.profile ? "/dashboard" : "/start"}>{S.profile ? "Dashboard" : "Save progress: create profile"}</Link>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
