"use client";
import { useEffect, useRef, useState } from "react";
import { FEAT_START_ORDER, IDEAL_ORDER, featById, rice, type FeatId } from "@/content/sims";
import type { ProductAnswers } from "@/lib/scoring";

export default function ProductRank({ onDone }: { onDone: (a: ProductAnswers) => void }) {
  const [order, setOrder] = useState<FeatId[]>(FEAT_START_ORDER);
  const [hint, setHint] = useState(false);
  const [focusAfter, setFocusAfter] = useState<{ idx: number; prefer: "up" | "down" } | null>(null);
  const btns = useRef(new Map<string, HTMLButtonElement>());

  // Keep keyboard focus on the item that just moved (on its arrow, or the other one at the ends).
  useEffect(() => {
    if (!focusAfter) return;
    const { idx, prefer } = focusAfter;
    const other = prefer === "up" ? "down" : "up";
    const el = [btns.current.get(`${prefer}${idx}`), btns.current.get(`${other}${idx}`)].find((b) => b && !b.disabled);
    el?.focus();
  }, [focusAfter, order]);

  function move(i: number, dir: -1 | 1) {
    setOrder((o) => { const n = o.slice(); [n[i + dir], n[i]] = [n[i], n[i + dir]]; return n; });
    setFocusAfter({ idx: i + dir, prefer: dir === -1 ? "up" : "down" });
  }
  const reg = (key: string) => (el: HTMLButtonElement | null) => { if (el) btns.current.set(key, el); else btns.current.delete(key); };

  return (
    <>
      <div className="sim-brief card"><p className="eyebrow">Scenario</p>
        <p>You&apos;re the PM for <b>CampusEats</b>, a student food-delivery app (fictional). Engineering can build about <b>3 things</b> this quarter.</p>
        <div className="quotes">
          <blockquote>“App closes when I press Pay. Tecno phone.” <cite>– Play Store, 1★</cite></blockquote>
          <blockquote>“I don&apos;t have a card. Let me pay when the food comes.” <cite>– survey</cite></blockquote>
          <blockquote>“Where is my food?? 40 mins already.” <cite>– support chat</cite></blockquote>
          <blockquote>“Dark mode pls 🙏” <cite>– Twitter</cite></blockquote>
        </div>
        <p><b>Task:</b> rank the features from most to least important. Use ↑ ↓ to move them.</p>
      </div>
      <div className="card">
        <ol className="rank" aria-label="Feature ranking">
          {order.map((id, idx) => {
            const f = featById(id);
            return (
              <li className={`rank-item ${idx < 3 ? "top" : ""}`} key={id}>
                <span className="rank-n">{idx + 1}</span>
                <div className="rank-body"><b>{f.t}</b><span className="rank-meta">Reach {f.r}/mo · Impact {f.i} · Confidence {f.c}% · Effort {f.e} wk</span></div>
                <div className="rank-btns">
                  <button type="button" className="icon-btn" data-up={idx} ref={reg(`up${idx}`)} aria-label={`Move ${f.t} up`} disabled={idx === 0} onClick={() => move(idx, -1)}>↑</button>
                  <button type="button" className="icon-btn" data-down={idx} ref={reg(`down${idx}`)} aria-label={`Move ${f.t} down`} disabled={idx === order.length - 1} onClick={() => move(idx, 1)}>↓</button>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="muted small">Top 3 (highlighted) get built this quarter.</p>
        <p className="hint-out" aria-live="polite">{hint ? "💡 Try RICE: Reach × Impact × Confidence ÷ Effort. Bigger score = more value per week of work. Also: a crash that blocks payment is urgent." : ""}</p>
        <div className="sim-actions">
          <button type="button" className="btn ghost" id="hintBtn" onClick={() => setHint(true)}>💡 Hint</button>
          <button type="button" className="btn" id="lockBtn" onClick={() => onDone({ order, hint })}>Lock in ranking</button>
        </div>
      </div>
    </>
  );
}

export function ProductDetails({ answers }: { answers: ProductAnswers }) {
  return (
    <>
      <h4>RICE scores (Reach × Impact × Confidence ÷ Effort)</h4>
      <div className="table-wrap">
        <table className="dtable">
          <thead><tr><th>#</th><th>Feature</th><th>RICE</th><th>You</th></tr></thead>
          <tbody>
            {IDEAL_ORDER.map((id, i) => <tr key={id}><td>{i + 1}</td><td>{featById(id).t}</td><td>{rice(featById(id))}</td><td>{answers.order.indexOf(id) + 1}</td></tr>)}
          </tbody>
        </table>
      </div>
      <p className="small">The Android crash is tiny effort and blocks payment for many users, so it&apos;s the top priority. Pay-on-delivery unlocks students without cards. Live tracking is valuable but costly. Dark mode is loved by a loud few. RICE is a guide, not a law: strategy and urgency still matter.</p>
    </>
  );
}
