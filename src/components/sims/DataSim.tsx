"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CHART_KINDS, CHART_WHY, ITEMS, MONTHS, TYPO_CELL, cleanSales, dataPickIsCorrect, dataSteps, growth, rawSales, total,
  type ChartKind, type SalesTable,
} from "@/content/sims";
import type { DataAnswers } from "@/lib/scoring";

const PIE_COLORS = ["#2E5AAC", "#0E7C66", "#C2571A", "#B4458A", "#8A6D1F", "#5A6270"];

function Chart({ kind, data }: { kind: ChartKind; data: SalesTable }) {
  const vals = data.map((r) => r[2]);
  const max = 500, W = 300, H = 150, P = 28;
  const x = (i: number) => P + i * ((W - P - 10) / 5), y = (v: number) => H - 20 - (v / max) * (H - 40);
  if (kind === "line") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart of Zobo sales Jan to Jun">
        <line x1={P} y1={H - 20} x2={W - 5} y2={H - 20} className="ax" />
        <polyline fill="none" className="ln" points={vals.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
        {vals.map((v, i) => (
          <g key={i}><circle cx={x(i)} cy={y(v)} r="3.5" className="pt" /><text x={x(i)} y={H - 6} className="tl">{MONTHS[i]}</text><text x={x(i)} y={y(v) - 7} className="tv">{v}</text></g>
        ))}
      </svg>
    );
  }
  if (kind === "bar") {
    const t = ITEMS.map((_, i) => total(data, i)); const m = Math.max(...t);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bar chart of total units per item">
        {t.map((v, i) => (
          <g key={i}><rect x={P + i * 66} y={H - 20 - (v / m) * (H - 45)} width="44" height={(v / m) * (H - 45)} className="br" /><text x={P + 22 + i * 66} y={H - 6} className="tl">{ITEMS[i].split(" ")[0]}</text></g>
        ))}
      </svg>
    );
  }
  if (kind === "pie") {
    const s = vals.reduce((p, c) => p + c, 0); const cx = 150, cy = 75, r = 60;
    const ends = vals.map((_, i) => (vals.slice(0, i + 1).reduce((p, c) => p + c, 0) / s) * Math.PI * 2);
    const slices = ends.map((a1, i) => [i ? ends[i - 1] : 0, a1] as const);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pie chart of Zobo sales share by month">
        {slices.map(([a0, a1], i) => (
          <path key={i} d={`M${cx},${cy} L${cx + r * Math.sin(a0)},${cy - r * Math.cos(a0)} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${cx + r * Math.sin(a1)},${cy - r * Math.cos(a1)} Z`} fill={PIE_COLORS[i]} />
        ))}
      </svg>
    );
  }
  return <div className="mono small">Jan {vals[0]} · Feb {vals[1]} · Mar {vals[2]} · Apr {vals[3]} · May {vals[4]} · Jun {vals[5]}</div>;
}

type StepLog = { picks: string[]; hinted: boolean };

export default function DataSim({ onDone }: { onDone: (a: DataAnswers) => void }) {
  const [step, setStep] = useState(0);
  const [fixed, setFixed] = useState(false);
  const [showTotals, setShowTotals] = useState(false);
  const [log, setLog] = useState<StepLog[]>(() => dataSteps().map(() => ({ picks: [], hinted: false })));
  const [fb, setFb] = useState<ReactNode>("");
  const [solved, setSolved] = useState(false);
  const [marks, setMarks] = useState<Record<string, "right" | "wrong">>({});
  const [preview, setPreview] = useState<ChartKind | null>(null);
  const qcardRef = useRef<HTMLDivElement>(null);
  const contRef = useRef<HTMLButtonElement>(null);
  const firstStep = useRef(true);

  const data = fixed ? cleanSales() : rawSales();
  const steps = dataSteps();
  const s = steps[step];
  const cur = log[step];

  useEffect(() => { if (solved) contRef.current?.focus(); }, [solved]);
  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    qcardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step]);

  function answer(pick: string, extraWrong?: string) {
    if (solved) return;
    const ok = dataPickIsCorrect(s, pick);
    const tries = cur.picks.length + 1;
    setLog((l) => l.map((x, i) => (i === step ? { ...x, picks: [...x.picks, pick] } : x)));
    setMarks((m) => ({ ...m, [pick]: ok ? "right" : "wrong" }));
    if (ok) {
      setSolved(true);
      const text = s.type === "chart" ? CHART_WHY.line : s.fb;
      setFb(<><span className="good">✓ Correct.</span> {text}</>);
    } else {
      setFb(<><span className="bad">Not quite.</span> {tries >= 2 ? "Try the hint, then go again." : "Have another look."}{extraWrong ? " " + extraWrong : ""}</>);
    }
  }

  function clickCell(r: number, c: number) {
    if (s.type !== "cell" || fixed) return;
    if (r === TYPO_CELL.r && c === TYPO_CELL.c) setFixed(true);
    answer(`${r},${c}`);
  }

  function next() {
    if (step + 1 < steps.length) {
      setStep(step + 1); setSolved(false); setFb(""); setMarks({}); setPreview(null);
      return;
    }
    onDone({ steps: log });
  }

  return (
    <>
      <div className="sim-brief card"><p className="eyebrow">Scenario</p>
        <p><b>Mama Tolu</b> runs a canteen near campus (fictional). She sent six months of sales and asked: <i>“What&apos;s selling, and what should I do next?”</i></p>
        <details><summary>Context</summary><p className="small">Academic calendar: second-semester break ran most of April, so the campus was quiet. Prices didn&apos;t change all period.</p></details>
      </div>
      <div className="table-wrap">
        <table className="dtable">
          <caption>Units sold per month · Mama Tolu&apos;s Kitchen (campus canteen)</caption>
          <thead><tr><th scope="col">Month</th>{ITEMS.map((n) => <th scope="col" key={n}>{n}</th>)}</tr></thead>
          <tbody>
            {data.map((r, ri) => (
              <tr key={ri}><th scope="row">{MONTHS[ri]}</th>
                {r.map((v, ci) => {
                  const key = `${ri},${ci}`;
                  const cls = ["cell", fixed && ri === TYPO_CELL.r && ci === TYPO_CELL.c ? "fixed" : "", s.type === "cell" && marks[key] === "wrong" ? "wrong" : ""].filter(Boolean).join(" ");
                  return <td key={ci}><button type="button" className={cls} data-r={ri} data-c={ci} tabIndex={s.type === "cell" ? undefined : -1} onClick={() => clickCell(ri, ci)}>{v}</button></td>;
                })}
              </tr>
            ))}
          </tbody>
          {showTotals && (
            <tfoot>
              <tr><th scope="row">Σ Total</th>{ITEMS.map((_, i) => <td key={i}>{total(data, i)}</td>)}</tr>
              <tr><th scope="row">Avg</th>{ITEMS.map((_, i) => <td key={i}>{Math.round(total(data, i) / 6)}</td>)}</tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="tools">
        <button type="button" className="btn ghost sm" id="totBtn" aria-pressed={showTotals} onClick={() => setShowTotals(!showTotals)}>Σ Totals &amp; averages</button>
        <button type="button" className="btn ghost sm" id="sortBtn" onClick={() => {
          const order = data.map((r, i) => [r[2], MONTHS[i]] as const).sort((a, b) => b[0] - a[0]);
          setFb("Zobo by month, highest first: " + order.map(([v, m]) => `${m} ${v}`).join(" · "));
        }}>Sort months by Zobo ↓</button>
      </div>
      <div className="card qcard" ref={qcardRef}>
        <div className="stepper" aria-label={`Step ${step + 1} of ${steps.length}`}>{steps.map((_, i) => <span key={i} className={i < step ? "done" : i === step ? "now" : ""} />)}</div>
        <p className="eyebrow">Question {step + 1} of {steps.length}</p>
        <h3>{s.q}</h3>
        <div id="qBody">
          {s.type === "cell" && <p className="muted small">Tap a number in the table.</p>}
          {s.type === "mcq" && (
            <div className="choices">
              {s.opts.map((o, i) => (
                <button type="button" key={o.t} className={`choice-btn${marks[String(i)] ? " " + marks[String(i)] : ""}`} data-i={i} disabled={solved} onClick={() => answer(String(i))}>{o.t}</button>
              ))}
            </div>
          )}
          {s.type === "chart" && (
            <>
              <div className="chart-pick">
                {CHART_KINDS.map(([k, t]) => (
                  <button type="button" key={k} className={`choice-btn${marks[k] ? " " + marks[k] : ""}`} data-k={k} disabled={solved}
                    onClick={() => { setPreview(k); answer(k, k === "line" ? undefined : CHART_WHY[k]); }}>{t}</button>
                ))}
              </div>
              <div className="chart-prev" id="prev" aria-live="polite">{preview ? <Chart kind={preview} data={data} /> : <p className="muted small">Tap a chart to preview it.</p>}</div>
            </>
          )}
        </div>
        <p className="hint-out" id="fb" aria-live="polite">{fb}</p>
        <div className="sim-actions">
          <button type="button" className="btn ghost" id="hintBtn" onClick={() => { setFb("💡 " + s.hint); setLog((l) => l.map((x, i) => (i === step ? { ...x, hinted: true } : x))); }}>💡 Hint</button>
          <button type="button" className="btn" id="contBtn" ref={contRef} hidden={!solved} onClick={next}>Continue →</button>
        </div>
      </div>
    </>
  );
}

export function DataDetails() {
  const data = cleanSales();
  return (
    <>
      <h4>What you did</h4>
      <ul className="fb-list">
        <li className="ok"><b>Data cleaning</b><span>Spotted the 3,400 typo before it distorted the totals.</span></li>
        <li className="ok"><b>Exploration</b><span>Totals: {ITEMS.map((n, i) => `${n} ${total(data, i)}`).join(", ")}.</span></li>
        <li className="ok"><b>Trend</b><span>Zobo +{growth(data, 2)}% Jan→Jun, the fastest-growing item.</span></li>
        <li className="ok"><b>Context</b><span>April dip explained by the semester break, not performance.</span></li>
        <li className="ok"><b>Communication</b><span>Line chart + a specific, numbers-backed recommendation.</span></li>
      </ul>
      <p className="muted small">First-try answers earn 2 points; answers after a hint or retry earn 1.</p>
    </>
  );
}
