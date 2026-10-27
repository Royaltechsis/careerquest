import type { Metadata } from "next";
import AdminButton from "@/components/admin/AdminButton";
import AnnouncementForm from "@/components/admin/AnnouncementForm";
import { listAnnouncements } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/guard";

export const metadata: Metadata = { title: "Announcements" };

export default async function AdminAnnouncements() {
  await requireAdmin();
  const rows = await listAnnouncements();
  return (
    <>
      <section className="page-head"><h1>Announcements</h1><p className="muted">Active announcements show as a banner at the top of every student&apos;s dashboard (newest 3).</p></section>
      <AnnouncementForm />
      {rows.length ? rows.map((a) => (
        <article className="card ann-item" key={a.id}>
          <div>
            <h3>{a.title} <span className={`pill ${a.active ? "ok" : ""}`}>{a.active ? "Active" : "Off"}</span></h3>
            {a.body && <p className="small">{a.body}</p>}
            <p className="small muted">{formatDateTime(a.createdAt)}</p>
          </div>
          <div className="cta-row sm">
            <AdminButton url={`/api/admin/announcements/${a.id}`} body={{ active: !a.active }}>{a.active ? "Turn off" : "Turn on"}</AdminButton>
            <AdminButton url={`/api/admin/announcements/${a.id}`} method="DELETE" confirm="Delete this announcement?" className="btn danger sm">Delete</AdminButton>
          </div>
        </article>
      )) : <p className="empty card">No announcements yet.</p>}
    </>
  );
}
