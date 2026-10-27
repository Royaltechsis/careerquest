"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DECISION_STEPS, decisionPicks, type DecisionSimId } from "@/content/sims";
import type { DecisionAnswers } from "@/lib/scoring";

const SCENARIO: Record<DecisionSimId, ReactNode> = {
  cloud: <><p>Your faculty&apos;s <b>student election</b> moves online. ~8,000 students will vote within one 6-hour window. It must not go down, must not lose a single vote, and the budget is tight.</p><p><b>Task:</b> design the architecture, one decision at a time.</p></>,
  marketing: <><p><b>Zobo by Tolu</b> is a student-run drinks brand on campus (fictional). Budget: <b>₦50,000</b>. Time: <b>4 weeks</b>. Goal: more first-time customers.</p><p><b>Task:</b> build the campaign brief, one decision at a time.</p></>,
};

/** The cloud sim's architecture diagram, lighting up as decisions are made. */
function CloudDiagram({ decided }: { decided: number }) {
  const on = (i: number) => (decided > i ? "on" : "");
  return (
    <div className="arch">
      <span className="node on">Students</span><span className="arr">→</span>
      <span className={`node ${on(2)}`}>CDN</span><span className="arr">→</span>
      <span className={`node ${on(0)}`}>Load balancer</span><span className="arr">→</span>
      <span className={`node ${on(0)}`}>App ×2+</span><span className="arr">→</span>
      <span className={`node ${on(1)}`}>Managed DB</span>
      {decided > 3 && <span className="node on lock">🔒 Private network + HTTPS</span>}
      {decided > 4 && <span className="node on">📈 Auto-scale + billing alert</span>}
    </div>
  );
}

export default function DecisionSim({ simId, onDone }: { simId: DecisionSimId; onDone: (a: DecisionAnswers) => void }) {
  const steps = DECISION_STEPS[simId];
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<number[][]>(() => steps.map(() => []));
  const contRef = useRef<HTMLButtonElement>(null);
  const s = steps[step];
  const cur = picks[step];
  const last = cur[cur.length - 1];
  const solved = last != null && s.o[last][1];
  const decided = step; // decisions locked in so far (the diagram updates when you continue)

  useEffect(() => { if (solved) contRef.current?.focus(); }, [solved]);

  function choose(i: number) {
    if (solved) return;
    setPicks((p) => p.map((x, j) => (j === step ? [...x, i] : x)));
  }
  function next() {
    if (step + 1 < steps.length) { setStep(step + 1); return; }
    onDone({ picks });
  }

  const marks = new Map(cur.map((i) => [i, s.o[i][1] ? "right" : "wrong"]));
  return (
    <>
      <div className="sim-brief card"><p className="eyebrow">Scenario</p>{SCENARIO[simId]}</div>
      {simId === "cloud" && <div className="card visual" aria-hidden="true"><CloudDiagram decided={decided} /></div>}
      <div className="card qcard">
        <div className="stepper">{steps.map((_, i) => <span key={i} className={i < step ? "done" : i === step ? "now" : ""} />)}</div>
        <p className="eyebrow">Decision {step + 1} of {steps.length}</p><h3>{s.q}</h3>
        <div className="choices">
          {s.o.map((o, i) => (
            <button type="button" key={o[0]} className={"choice-btn" + (marks.has(i) ? " " + marks.get(i) : "")} data-i={i} disabled={solved} onClick={() => choose(i)}>{o[0]}</button>
          ))}
        </div>
        <p className="hint-out" id="fb" aria-live="polite">
          {last != null && (s.o[last][1] ? <><span className="good">✓ Good call.</span> {s.o[last][2]}</> : <><span className="bad">Rethink.</span> {s.o[last][2]}</>)}
        </p>
        <div className="sim-actions"><button type="button" className="btn" id="contBtn" ref={contRef} hidden={!solved} onClick={next}>Continue →</button></div>
      </div>
    </>
  );
}

export function DecisionDetails({ simId }: { simId: DecisionSimId }) {
  if (simId === "cloud") {
    return (
      <>
        <h4>Your architecture</h4>
        <p className="small">Students → CDN (static files) → Load balancer → 2+ auto-scaling app instances → Managed database (backups + standby), all behind HTTPS with the database in a private network and a billing alert.</p>
        <p className="small">This is the classic highly-available web pattern on AWS, Azure or Google Cloud.</p>
      </>
    );
  }
  const p = decisionPicks(DECISION_STEPS.marketing);
  return (
    <>
      <h4>Your campaign brief</h4>
      <dl className="brief"><dt>Audience</dt><dd>{p[0]}</dd><dt>Goal</dt><dd>{p[1]}</dd><dt>Channels</dt><dd>{p[2]}</dd><dt>Headline</dt><dd>{p[3]}</dd><dt>Measurement</dt><dd>{p[4]}</dd></dl>
    </>
  );
}
