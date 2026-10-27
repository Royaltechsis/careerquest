"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { CQ_DATA } from "@/content/data";
import { Meter, cssVars } from "@/components/ui";
import { useApp } from "@/components/app/AppProvider";
import { TRAIT_WORDS, careerById, scoreQuiz } from "@/lib/progress";

const QUIZ = CQ_DATA.quiz;

function QuizResult({ answers, onRetake }: { answers: number[]; onRetake: () => void }) {
  const { state: S, commit } = useApp();
  const { res, traits } = scoreQuiz(answers);
  const top = res.slice(0, 3);
  const max = top[0].s || 1;
  const ts = answers.join("");
  useEffect(() => {
    commit((d) => { if (!d.quiz || d.quiz.ts !== ts) d.quiz = { top: top.map((r) => r.id), traits: traits.slice(0, 3), ts, at: Date.now() }; });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- save once per finished set of answers
  }, [ts]);
  const words = traits.slice(0, 3).map((k) => TRAIT_WORDS[k]);
  return (
    <section className="narrow">
      <p className="eyebrow">Your results</p><h1 tabIndex={-1}>Careers worth exploring</h1>
      <p className="lead">You leaned toward {words.map((w, i) => <span key={w}>{i > 0 && ", "}<b>{w}</b></span>)}.</p>
      <p className="note">This is a starting point, not a verdict. Interests change, and skills grow with practice. Try a simulation to see how the work actually feels.</p>
      <div className="results">
        {top.map((r, i) => {
          const c = careerById(r.id)!;
          const shared = c.traits.filter((k) => traits.slice(0, 4).includes(k));
          return (
            <div className="result card" style={cssVars({ "--c": c.color })} key={c.id}>
              <span className="rank-badge">{i + 1}</span>
              <div>
                <b>{c.name}</b>
                <p className="small">{c.tagline}{shared.length ? ` Fits your interest in ${shared.map((k) => TRAIT_WORDS[k]).join(" and ")}.` : ""}</p>
                <Meter pct={Math.round((r.s / max) * 100)} color={c.color} />
                <div className="cta-row sm">
                  <Link className="btn sm" href={`/career/${c.id}`}>Explore</Link>
                  {c.sim && <Link className="btn ghost sm" href={`/sim/${c.sim}`}>Try the simulation</Link>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="cta-row">
        <Link className="btn" href={S.profile ? "/dashboard" : "/start"}>{S.profile ? "Go to my dashboard" : "Save results: create profile"}</Link>
        <button type="button" className="btn ghost" id="retake" onClick={onRetake}>Retake quiz</button>
      </div>
    </section>
  );
}

export default function Quiz() {
  const { ui, setUi } = useApp();
  const { qi, answers } = ui.quiz;
  const setQuiz = (quiz: typeof ui.quiz) => setUi((u) => ({ ...u, quiz }));
  const done = qi >= QUIZ.length;

  // Leaving after finishing starts the quiz fresh next time; leaving midway keeps your place.
  const doneRef = useRef(done);
  useEffect(() => { doneRef.current = done; }, [done]);
  useEffect(() => () => { if (doneRef.current) setUi((u) => ({ ...u, quiz: { qi: 0, answers: [] } })); }, [setUi]);

  if (done) return <QuizResult answers={answers} onRetake={() => setQuiz({ qi: 0, answers: [] })} />;
  const q = QUIZ[qi];
  return (
    <section className="narrow quiz">
      <div className="quiz-top"><span className="muted small">Question {qi + 1} of {QUIZ.length}</span><Meter pct={Math.round((qi / QUIZ.length) * 100)} /></div>
      <h1 className="q" tabIndex={-1}>{q.q}</h1>
      <div className="qopts">
        {q.o.map((o, i) => (
          <button type="button" key={o.t} className={`qopt ${answers[qi] === i ? "sel" : ""}`} data-i={i}
            onClick={() => { const a = answers.slice(); a[qi] = i; setQuiz({ qi: qi + 1, answers: a }); }}>{o.t}</button>
        ))}
      </div>
      <div className="quiz-nav">
        {qi > 0 ? <button type="button" className="btn ghost" id="qBack" onClick={() => setQuiz({ qi: qi - 1, answers })}>‹ Back</button> : <span />}
        <span className="muted small">There are no wrong answers.</span>
      </div>
    </section>
  );
}
