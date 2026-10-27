"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app/AppProvider";
import Dashboard, { type Announcement } from "./Dashboard";
import Landing from "./Landing";

/** "/": the landing page for visitors, the dashboard for students (onboarding first if needed). */
export default function Home({ announcements }: { announcements: Announcement[] }) {
  const { user, state } = useApp();
  const router = useRouter();
  const needsOnboarding = !!user && !state.profile;
  useEffect(() => { if (needsOnboarding) router.replace("/start"); }, [needsOnboarding, router]);
  if (needsOnboarding) return null;
  return state.profile ? <Dashboard announcements={announcements} /> : <Landing />;
}
