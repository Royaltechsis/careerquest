"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  PHISH, PHISH_DECISIONS, PHISH_DECISION_FEEDBACK, PHISH_HINTS, PHISH_INDICATORS, PHISH_MAX_HINTS, phishFalseFlagLabel,
  type PhishDecision, type PhishKey,
} from "@/content/sims";
import { scorePhishing, type PhishingAnswers } from "@/lib/scoring";

/** One tappable part of the email. */
function Tok({ k, on, onToggle, className, children }: { k: PhishKey; on: boolean; onToggle: (k: PhishKey) => void; className?: string; children: ReactNode }) {
  return <button type="button" className={`tok ${className || ""}${on ? " flagged" : ""}`} data-k={k} aria-pressed={on} onClick={() => onToggle(k)}>{children}</button>;
}

export default function Phishing({ onDone }: { onDone: (a: PhishingAnswers) => void }) {
  const [flagged, setFlagged] = useState<PhishKey[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState("");
  const [rawOpen, setRawOpen] = useState(false);
  const [linkRevealed, setLinkRevealed] = useState(false);
  const [step2, setStep2] = useState(false);
  const [decision, setDecision] = useState<PhishDecision | null>(null);
  const step2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => { if (step2) step2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [step2]);

  const isOn = (k: PhishKey) => flagged.includes(k);
  function toggle(k: PhishKey) {
    setFlagged((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));
    if (k === "link") setLinkRevealed(true);
  }
  function hint() {
    const left = PHISH_HINTS.filter((h) => h.keys.some((k) => !isOn(k)));
    if (hintsUsed >= PHISH_MAX_HINTS || !left.length) { setHintText(left.length ? "No hints left. Trust your instincts." : "You've covered every area. Nice."); return; }
    setHintsUsed(hintsUsed + 1);
    setHintText("💡 " + left[0].t);
    if (left[0].keys.includes("auth")) setRawOpen(true);
  }
  const t = (k: PhishKey) => ({ k, on: isOn(k), onToggle: toggle });

  return (
    <>
      <div className="sim-brief card">
        <p className="eyebrow">Scenario</p>
        <p>You&apos;re an intern on the security team at <b>Kora Microfinance Bank</b> (fictional). Funke from HR forwarded this email: <i>“Is this real? Half the office got it.”</i></p>
        <p><b>Task 1:</b> tap every part of the email that looks suspicious. Tap again to unflag. <b>Task 2:</b> decide what to do.</p>
      </div>
      <div className="email card" aria-label="Reported email">
        <div className="email-bar"><span className="dot" /><span className="dot" /><span className="dot" /><span className="email-bar-t">Inbox · Reported message</span></div>
        <div className="email-head">
          <div className="row"><span className="k">From</span> <Tok {...t("from")}>Kora MFB IT Helpdesk &lt;it-helpdesk@kora-mfb-support.com&gt;</Tok></div>
          <div className="row"><span className="k">Reply-To</span> <Tok {...t("replyto")}>korahelpdesk.verify@gmail.com</Tok></div>
          <div className="row"><span className="k">To</span> <Tok {...t("to")}>all-staff@kora-mfb.com</Tok></div>
          <div className="row"><span className="k">Date</span> <Tok {...t("date")}>Mon, 06:42 WAT</Tok></div>
          <div className="row"><span className="k">Subject</span> <Tok {...t("subject")}><b>URGENT: Payroll account will be SUSPENDED in 2 hours</b></Tok></div>
          <details className="raw" open={rawOpen} onToggle={(e) => setRawOpen(e.currentTarget.open)}>
            <summary>Show raw headers</summary>
            <div className="mono">Received: from mail.kora-mfb-support.com (unknown [203.0.113.45])<br />
              <Tok {...t("auth")} className="mono">Authentication-Results: mx.kora-mfb.com; spf=fail; dkim=none; dmarc=fail</Tok><br />
              Message-ID: &lt;8812.4410@mail.kora-mfb-support.com&gt;</div>
          </details>
        </div>
        <div className="email-body">
          <p><Tok {...t("greeting")}>Dear Staff,</Tok></p>
          <p><Tok {...t("body1")}>Our records show your payroll account failed verification during the October salary update.</Tok></p>
          <p><Tok {...t("threat")}>To avoid suspension of your salary, verify your account within 2 hours.</Tok></p>
          <p><Tok {...t("link")} className="tok-link"><span className="fake-btn">Verify at https://portal.kora-mfb.com/verify</span></Tok></p>
          <p className="reveal" id="linkReveal" hidden={!linkRevealed}>🔎 Real destination: <span className="mono">http://kora-mfb.verify-login.xyz/portal</span></p>
          <p><Tok {...t("creds")}>You will need your Staff ID, password and BVN to complete verification.</Tok></p>
          <p><Tok {...t("attach")}>📎 Payroll_Verification.html <span className="muted">(48 KB)</span></Tok></p>
          <p><Tok {...t("sig")}>IT Helpdesk Team<br />Kora Microfinance Bank, Lagos</Tok></p>
          <p className="small"><Tok {...t("footer")}>This email and any attachments are confidential and intended for the addressee only.</Tok></p>
        </div>
      </div>
      <div className="sim-actions">
        <span className="counter" aria-live="polite"><b id="flagCount">{flagged.length}</b> flagged</span>
        <button type="button" className="btn ghost" id="hintBtn" onClick={hint}>💡 Hint <span className="muted">({PHISH_MAX_HINTS - hintsUsed} left)</span></button>
        <button type="button" className="btn" id="nextBtn" onClick={() => setStep2(true)}>Next: decide →</button>
      </div>
      <p className="hint-out" id="hintOut" aria-live="polite">{hintText}</p>
      <div id="step2" ref={step2Ref} hidden={!step2}>
        {step2 && (
          <div className="card"><p className="eyebrow">Task 2</p><h3>Funke asks what to do. Your call?</h3>
            <div className="choices" role="radiogroup" aria-label="Your decision">
              {PHISH_DECISIONS.map(([v, t]) => (
                <label className="choice" key={v}><input type="radio" name="dec" value={v} checked={decision === v} onChange={() => setDecision(v)} /><span>{t}</span></label>
              ))}
            </div>
            <button type="button" className="btn" id="finishBtn" disabled={!decision} onClick={() => decision && onDone({ flagged, decision, hintsUsed })}>Submit investigation</button>
          </div>
        )}
      </div>
    </>
  );
}

export function PhishingDetails({ answers }: { answers: PhishingAnswers }) {
  const { found, falseFlags } = scorePhishing(answers);
  const flagged = new Set(answers.flagged);
  const right = answers.decision === "c";
  return (
    <>
      <h4>Indicators ({found.length}/{PHISH_INDICATORS.length} found)</h4>
      <ul className="fb-list">
        {PHISH_INDICATORS.map((k) => (
          <li key={k} className={flagged.has(k) ? "ok" : "miss"}><b>{flagged.has(k) ? "✓" : "✗"} {PHISH[k].label}</b><span>{PHISH[k].why}</span></li>
        ))}
      </ul>
      {falseFlags.length > 0 && (
        <>
          <h4>Flagged but normal ({falseFlags.length})</h4>
          <ul className="fb-list">{falseFlags.map((k) => <li key={k} className="fp"><b>• {phishFalseFlagLabel(k)}</b><span>{PHISH[k].why}</span></li>)}</ul>
        </>
      )}
      <h4>Your decision</h4><p className={right ? "good" : "bad"}>{PHISH_DECISION_FEEDBACK[answers.decision]}</p>
      {answers.hintsUsed > 0 && <p className="muted small">Hints used: {answers.hintsUsed} (−{answers.hintsUsed * 4} pts)</p>}
    </>
  );
}
