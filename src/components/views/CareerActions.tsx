"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { useApp } from "@/components/app/AppProvider";
import { roadmapPct } from "@/lib/progress";

/** The career profile's action row; opening a profile also marks it as explored. */
export default function CareerActions({ careerId, hasRoadmap, sim }: { careerId: string; hasRoadmap: boolean; sim: { id: string; title: string } | null }) {
  const { state, commit, toast } = useApp();
  const explored = state.explored.includes(careerId);
  useEffect(() => {
    if (!explored) commit((S) => { if (!S.explored.includes(careerId)) S.explored.push(careerId); });
  }, [explored, careerId, commit]);

  const inFocus = !!state.profile?.interests.includes(careerId);
  function toggleFocus() {
    commit((S) => {
      const arr = S.profile!.interests;
      const i = arr.indexOf(careerId);
      if (i >= 0) arr.splice(i, 1); else arr.push(careerId);
    });
    toast(!inFocus ? "Added to your focus. Recommendations will follow it." : "Removed from your focus.");
  }

  return (
    <div className="cta-row">
      {hasRoadmap && <Link className="btn" href={`/roadmap/${careerId}`}><Icon name="map" /> Roadmap · {roadmapPct(state, careerId)}%</Link>}
      {sim && <Link className={`btn ${hasRoadmap ? "alt" : ""}`} href={`/sim/${sim.id}`}><Icon name="flask" /> Try: {sim.title}</Link>}
      {state.profile && <button type="button" className="btn ghost" id="focusBtn" aria-pressed={inFocus} onClick={toggleFocus}>{inFocus ? "★ In my focus" : "☆ Add to my focus"}</button>}
    </div>
  );
}
