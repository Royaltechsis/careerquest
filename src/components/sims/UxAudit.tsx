"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { UX, UX_KEYS, UX_OK, uxBestFix, type UxKey, type UxOkKey } from "@/content/sims";
import type { UxAnswers } from "@/lib/scoring";

type Panel = { kind: "intro" } | { kind: "fix"; k: UxKey } | { kind: "fine"; k: UxOkKey } | { kind: "hint" } | { kind: "allFound" };

/** A tappable area on the mock phone screen. */
function Hotspot({ k, extra, found, nope, glow, onTap, children }: { k: string; extra: string; found: boolean; nope: boolean; glow: boolean; onTap: (k: string) => void; children: ReactNode }) {
  const className = ["hs", extra, found ? "found" : "", nope ? "nope" : "", glow ? "glow" : ""].filter(Boolean).join(" ");
  return <button type="button" className={className} data-k={k} onClick={() => onTap(k)}>{children}</button>;
}

export default function UxAudit({ onDone }: { onDone: (a: UxAnswers) => void }) {
  const [found, setFound] = useState<Partial<Record<UxKey, number | null>>>({});
  const [misses, setMisses] = useState(0);
  const [hints, setHints] = useState(0);
  const [panel, setPanel] = useState<Panel>({ kind: "intro" });
  const [nope, setNope] = useState<string | null>(null);
  const [glow, setGlow] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => { const t = timers.current; return () => t.forEach(clearTimeout); }, []);

  const nFound = Object.keys(found).length;
  const allFixed = nFound === UX_KEYS.length && UX_KEYS.every((k) => found[k] != null);

  function tap(k: string) {
    if (k in UX) {
      const key = k as UxKey;
      if (!(key in found)) setFound((f) => ({ ...f, [key]: null }));
      setPanel({ kind: "fix", k: key });
      if (window.matchMedia("(max-width: 760px)").matches) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setMisses((m) => m + 1);
      setNope(k); later(() => setNope((n) => (n === k ? null : n)), 700);
      setPanel({ kind: "fine", k: k as UxOkKey });
    }
  }
  function chooseFix(k: UxKey, i: number) {
    if (found[k] != null) return;
    setFound((f) => ({ ...f, [k]: i }));
  }
  function hint() {
    const k = UX_KEYS.find((x) => !(x in found));
    if (!k) { setPanel({ kind: "allFound" }); return; }
    setHints((h) => h + 1);
    setGlow(k); later(() => setGlow((g) => (g === k ? null : g)), 2200);
    setPanel({ kind: "hint" });
  }

  const hs = (k: string, extra = "") => ({ k, extra, found: k in found, nope: nope === k, glow: glow === k });

  let panelBody: ReactNode;
  if (panel.kind === "intro") panelBody = <p className="muted small">Tap anything on the screen that would trip up a student.</p>;
  else if (panel.kind === "fine") panelBody = <p className="small"><b>Looks fine.</b> {UX_OK[panel.k]}</p>;
  else if (panel.kind === "hint") panelBody = <p className="small">💡 Look at the glowing area. What would confuse a tired student at 11pm?</p>;
  else if (panel.kind === "allFound") panelBody = <p className="small">All 7 found. Pick fixes for any left, then finish.</p>;
  else {
    const u = UX[panel.k]; const chosen = found[panel.k]; const best = uxBestFix(panel.k);
    panelBody = (
      <>
        <p className="good"><b>✓ {u.label}</b></p><p className="small">{u.why}</p><p className="eyebrow">Best fix?</p>
        <div className="choices">
          {u.fixes.map(([t], i) => {
            const mark = chosen == null ? "" : i === chosen ? (i === best ? " right" : " wrong") : i === best ? " right" : "";
            return <button type="button" key={t} className={"choice-btn" + mark} data-i={i} onClick={() => chooseFix(panel.k, i)}>{t}</button>;
          })}
        </div>
        <p className="small" id="fixFb">
          {chosen == null ? null : chosen === best ? <><span className="good">Exactly.</span> Keep going.</> : <><span className="bad">Better fix highlighted.</span> It solves the cause, not the symptom.</>}
        </p>
      </>
    );
  }

  return (
    <>
      <div className="sim-brief card"><p className="eyebrow">Scenario</p>
        <p>Students keep messing up course registration on the <b>Unity University portal</b> (fictional). You have 10 minutes with the screen.</p>
        <p><b>Task:</b> tap each usability problem on the phone screen, then pick the best fix. There are <b>7</b>.</p>
      </div>
      <div className="ux-layout">
        <div className="phone" aria-label="Mock registration screen">
          <div className="ph-notch" />
          <div className="ph-screen">
            <Hotspot {...hs("nav", "ok-zone")} onTap={tap}>‹ Back</Hotspot>
            <Hotspot {...hs("logo", "ok-zone ph-logo")} onTap={tap}>◆ Unity Portal</Hotspot>
            <Hotspot {...hs("contrast", "ph-h")} onTap={tap}>Course Registration · 2nd Semester</Hotspot>
            <div className="ph-row"><Hotspot {...hs("icons", "ph-icons")} onTap={tap}><span>⟲</span><span>✎</span><span>⊘</span></Hotspot></div>
            <Hotspot {...hs("course", "ok-zone ph-courses")} onTap={tap}><span>CSC 301 · Data Structures · 3u</span><span>CSC 305 · Operating Systems · 3u</span><span>MTH 301 · Numerical Methods · 3u</span></Hotspot>
            <div className="hs-wrap"><Hotspot {...hs("jargon", "ph-label")} onTap={tap}>Input matric identifier</Hotspot><div className="ph-input">CSC/19/</div></div>
            <div className="hs-wrap"><span className="ph-lbl2">Total units</span><Hotspot {...hs("error", "ph-input err")} onTap={tap}>26</Hotspot></div>
            <Hotspot {...hs("placeholder", "ph-input ph-ph")} onTap={tap}>Phone number</Hotspot>
            <Hotspot {...hs("fee", "ok-zone ph-fee")} onTap={tap}>School fees: <b>Paid ✓</b></Hotspot>
            <Hotspot {...hs("tap", "ph-tick")} onTap={tap}><span className="tiny-box" /><span>I confirm my courses are correct</span></Hotspot>
            <Hotspot {...hs("buttons", "ph-btns")} onTap={tap}><span>Clear all</span><span>Submit</span></Hotspot>
          </div>
        </div>
        <div className="ux-side">
          <div className="card">
            <div className="ux-progress"><b id="uxCount">{nFound}</b>/7 problems found</div>
            <div className="meter"><span id="uxBar" style={{ width: (nFound / 7) * 100 + "%" }} /></div>
            <div id="uxPanel" aria-live="polite" ref={panelRef}>{panelBody}</div>
            <div className="sim-actions">
              <button type="button" className="btn ghost" id="hintBtn" onClick={hint}>💡 Hint</button>
              <button type="button" className={"btn" + (allFixed ? " pulse" : "")} id="finishBtn" onClick={() => onDone({ found, misses, hints })}>Finish audit</button>
            </div>
          </div>
          <ul className="found-list" id="foundList">
            {UX_KEYS.filter((k) => k in found).map((k) => {
              const f = found[k]; const ok = f != null && f === uxBestFix(k);
              return (
                <li key={k} className={ok ? "ok" : f == null ? "" : "miss"}>
                  <b>{UX[k].label}</b>{f == null ? <span className="muted"> · choose a fix</span> : ok ? " · good fix ✓" : " · fix could be better"}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}

export function UxDetails({ answers }: { answers: UxAnswers }) {
  return (
    <>
      <h4>Problems</h4>
      <ul className="fb-list">
        {UX_KEYS.map((k) => {
          const isFound = k in answers.found; const f = answers.found[k];
          const ok = f != null && !!UX[k].fixes[f]?.[1];
          return (
            <li key={k} className={isFound ? (ok ? "ok" : "fp") : "miss"}>
              <b>{isFound ? "✓" : "✗"} {UX[k].label}</b>
              <span>{UX[k].why}<br /><i>Best fix:</i> {UX[k].fixes[uxBestFix(k)][0]}</span>
            </li>
          );
        })}
      </ul>
      <p className="muted small">Taps on fine areas: {answers.misses} (−{answers.misses * 2}) · Hints: {answers.hints} (−{answers.hints * 3})</p>
    </>
  );
}
