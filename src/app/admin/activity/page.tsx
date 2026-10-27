import type { Metadata } from "next";
import { listActivity } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/guard";

export const metadata: Metadata = { title: "Activity" };

const LABELS: Record<string, string> = {
  "user.make_admin": "Made admin", "user.remove_admin": "Removed admin", "user.suspend": "Suspended", "user.unsuspend": "Unsuspended",
  "user.delete": "Deleted user", "portfolio.hide": "Hid portfolio item", "portfolio.unhide": "Unhid portfolio item",
  "announcement.create": "Posted announcement", "announcement.edit": "Edited announcement", "announcement.activate": "Turned on announcement",
  "announcement.deactivate": "Turned off announcement", "announcement.delete": "Deleted announcement",
};

export default async function AdminActivity() {
  await requireAdmin();
  const rows = await listActivity();
  return (
    <>
      <section className="page-head"><h1>Activity</h1><p className="muted">Every admin action, newest first.</p></section>
      {rows.length ? (
        <div className="table-wrap">
          <table className="dtable" id="activityTable">
            <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Target</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.id}><td>{formatDateTime(r.createdAt)}</td><td>{r.actorEmail}</td><td>{LABELS[r.action] ?? r.action}</td><td>{r.detail || r.targetId}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <p className="empty card">No admin actions yet.</p>}
    </>
  );
}
