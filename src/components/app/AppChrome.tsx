"use client";
import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { Icon } from "@/components/ui";
import type { IconName } from "@/lib/progress";
import { useApp } from "./AppProvider";

const TABS: [string, string, IconName][] = [["dashboard", "Home", "home"], ["careers", "Careers", "compass"], ["challenges", "Challenges", "flask"], ["roadmaps", "Roadmaps", "map"], ["portfolio", "Portfolio", "folder"]];
const TAB_FOR: Record<string, string> = { career: "careers", quiz: "careers", roadmap: "roadmaps", sim: "challenges", start: "", me: "" };

function Tabs({ active }: { active: string }) {
  return (
    <>
      {TABS.map(([r, t, i]) => (
        <Link key={r} href={`/${r}`} className={active === r ? "on" : ""} aria-current={active === r ? "page" : undefined}>
          <Icon name={i} /><span>{t}</span>
        </Link>
      ))}
    </>
  );
}

/** Header, tab bar and <main> for every app screen. */
export default function AppChrome({ children }: { children: ReactNode }) {
  const { user, state } = useApp();
  const pathname = usePathname();
  const seg = pathname.split("/")[1] || "";
  const active = seg === "" || seg === "dashboard" ? (state.profile ? "dashboard" : "") : (TAB_FOR[seg] ?? seg);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // After moving to another screen, put keyboard / screen-reader focus on its heading.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    mainRef.current?.querySelector<HTMLHeadingElement>("h1[tabindex]")?.focus({ preventScroll: true });
  }, [pathname]);

  const me = user ? (
    <>{user.role === "admin" && <Link className="admin-badge" href="/admin">Admin</Link>}<Link className="avatar" href="/me" aria-label="Your profile">{((state.profile?.name || user.name || "?")[0] || "?").toUpperCase()}</Link></>
  ) : (
    <><a className="btn ghost sm" href="/login">Log in</a> <a className="btn sm" href="/signup">Sign up</a></>
  );

  return (
    <>
      <Header nav={<Tabs active={active} />} right={me} />
      <main id="main" className="wrap" tabIndex={-1} ref={mainRef}>{children}</main>
      <nav id="tabbar" className="tabbar" aria-label="Main"><Tabs active={active} /></nav>
    </>
  );
}
