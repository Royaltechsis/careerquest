import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import AdminNav from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · CareerQuest" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <>
      <Header right={<Link className="btn ghost sm" href="/dashboard">‹ Back to app</Link>} />
      <main id="main" className="wrap admin">
        <AdminNav />
        {children}
      </main>
    </>
  );
}
