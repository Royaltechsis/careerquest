import type { Metadata } from "next";
import Dashboard from "@/components/views/Dashboard";
import { activeAnnouncements } from "@/lib/announcements";
import { requireUser } from "@/lib/guard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requireUser("/dashboard");
  return <Dashboard announcements={await activeAnnouncements()} />;
}
