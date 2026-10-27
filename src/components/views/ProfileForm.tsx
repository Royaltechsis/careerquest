"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CQ_DATA } from "@/content/data";
import { GOAL_IDS, LEVELS } from "@/content/catalog";
import { Icon } from "@/components/ui";
import { useApp } from "@/components/app/AppProvider";
import type { GoalId } from "@/lib/models";

const GOALS: Record<GoalId, string> = {
  discover: "Find a career that fits me", start: "Get started in a career I chose", practice: "Get hands-on experience",
  internship: "Prepare for internships / SIWES", portfolio: "Build a portfolio",
};

/** Onboarding (/start) and the profile part of /me. */
export default function ProfileForm() {
  const { state, user, commit, toast } = useApp();
  const router = useRouter();
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const p = state.profile;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    if (!name) { setError("Add your first name so we know what to call you."); nameRef.current?.focus(); return; }
    setError("");
    const first = !state.profile;
    const next = commit((S) => {
      S.profile = {
        name, uni: String(f.get("uni") || "").trim(), course: String(f.get("course") || "").trim(), level: String(f.get("level")),
        goals: f.getAll("goals").map(String), interests: f.getAll("interests").map(String), created: S.profile?.created || Date.now(),
      };
    });
    if (first) toast(<>Welcome, <b>{name}</b>! 🎉</>);
    router.push(first && !next.profile!.interests.length ? "/quiz" : "/dashboard");
  }

  return (
    <section className="narrow">
      <h1 tabIndex={-1}>Let&apos;s set up your quest</h1>
      <p className="muted">Just the basics. Saved to your account, so it follows you to any device.</p>
      <form id="onb" className="card form" noValidate onSubmit={onSubmit}>
        <fieldset><legend>About you</legend>
          <label>First name <input ref={nameRef} name="name" required autoComplete="given-name" defaultValue={p?.name ?? user?.name ?? ""} placeholder="e.g. Bunmi" /></label>
          <label>University <input name="uni" autoComplete="organization" defaultValue={p?.uni ?? ""} placeholder="e.g. FUTA" /></label>
          <div className="two">
            <label>Course <input name="course" defaultValue={p?.course ?? ""} placeholder="e.g. Software Engineering" /></label>
            <label>Level <select name="level" defaultValue={p?.level ?? LEVELS[0]}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
          </div>
        </fieldset>
        <fieldset><legend>What do you want from CareerQuest?</legend>
          <div className="chips">
            {GOAL_IDS.map((v) => (
              <label className="chip" key={v}><input type="checkbox" name="goals" value={v} defaultChecked={p?.goals.includes(v)} /><span>{GOALS[v]}</span></label>
            ))}
          </div>
        </fieldset>
        <fieldset><legend>Any careers you&apos;re curious about? <span className="muted">(optional)</span></legend>
          <div className="chips">
            {CQ_DATA.careers.map((c) => (
              <label className="chip" key={c.id}><input type="checkbox" name="interests" value={c.id} defaultChecked={p?.interests.includes(c.id)} /><span>{c.name}</span></label>
            ))}
          </div>
          <p className="muted small">Not sure yet? Leave it blank and take the quiz next.</p>
        </fieldset>
        <p className="form-err" id="onbErr" role="alert">{error}</p>
        <button className="btn big" type="submit">{p ? "Save profile" : "Start my quest"} <Icon name="arrow" /></button>
      </form>
    </section>
  );
}
