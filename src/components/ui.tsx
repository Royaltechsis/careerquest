import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { Career } from "@/content/types";
import { simById } from "@/content/sims";
import { categoryById, type IconName } from "@/lib/progress";

const PATHS: Record<IconName, ReactNode> = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  flask: <><path d="M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" /><path d="M7.5 15h9" /></>,
  map: <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>,
  folder: <path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  pen: <><path d="M4 20l4-1L19 8l-3-3L5 16z" /><path d="M14 6l3 3" /></>,
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />,
  mega: <><path d="M3 10v4h3l7 4V6L6 10z" /><path d="M17 9a4 4 0 0 1 0 6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  check: <path d="M5 12l5 5 9-10" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></>,
};

export function Icon({ name, className }: { name: IconName | string; className?: string }) {
  return <svg className={`ic ${className || ""}`} viewBox="0 0 24 24" aria-hidden="true">{PATHS[name as IconName] ?? null}</svg>;
}

/** CSS custom property helper: style={cssVars({ "--c": color })} */
export const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties;

export function Meter({ pct, color }: { pct: number; color?: string }) {
  return (
    <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}

export function Ring({ pct, label }: { pct: number; label?: string }) {
  return (
    <div className="ring" style={cssVars({ "--p": pct })} role="img" aria-label={label || pct + "%"}>
      <span>{pct}<small>%</small></span>
    </div>
  );
}

export function Pill({ children, ok }: { children: ReactNode; ok?: boolean }) {
  return <span className={`pill ${ok ? "ok" : ""}`}>{children}</span>;
}

export function SkillCloud({ skills, small }: { skills: string[]; small?: boolean }) {
  return <div className={`skill-cloud${small ? " sm" : ""}`}>{skills.map((k) => <span className="skill" key={k}>{k}</span>)}</div>;
}

export function CareerCard({ c, explored }: { c: Career; explored: boolean }) {
  const cat = categoryById(c.cat);
  const s = c.sim ? simById(c.sim) : undefined;
  return (
    <Link className="ccard" href={`/career/${c.id}`} style={cssVars({ "--c": c.color })}>
      <span className="ccard-ic"><Icon name={cat.icon} /></span>
      <span className="ccard-cat">{cat.name}</span>
      <b className="ccard-n">{c.name}</b>
      <span className="ccard-t">{c.tagline}</span>
      <span className="ccard-tags">
        {c.roadmap && <Pill>Roadmap</Pill>}
        {s && <Pill>Simulation</Pill>}
        {explored && <Pill ok>✓ Explored</Pill>}
      </span>
    </Link>
  );
}
