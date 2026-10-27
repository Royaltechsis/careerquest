import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { listUsers } from "@/lib/admin";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/guard";

export const metadata: Metadata = { title: "Users" };
type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function AdminUsers({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q || "").slice(0, 100);
  const { rows, total, page, pages } = await listUsers(q, Math.max(1, Number(sp.page) || 1));
  const href = (p: number) => `/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;
  return (
    <>
      <section className="page-head"><h1>Users</h1><p className="muted">{total} {q ? `match${total === 1 ? "" : "es"} for “${q}”` : `account${total === 1 ? "" : "s"}`}</p></section>
      <Form action="/admin/users" className="search-row" role="search">
        <label className="sr" htmlFor="uq">Search users</label>
        <input id="uq" name="q" type="search" defaultValue={q} placeholder="Name, username, email or university" />
        <button className="btn" type="submit">Search</button>
      </Form>
      {rows.length ? (
        <div className="table-wrap">
          <table className="dtable" id="usersTable">
            <thead><tr><th>Name</th><th>Email</th><th>University</th><th>Joined</th><th>Last active</th><th className="num">Sims</th></tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link href={`/admin/users/${u.id}`}>{u.name}</Link><br /><span className="small muted">@{u.username}</span>{" "}
                    {u.role === "admin" && <span className="pill admin">Admin</span>}{" "}
                    {u.suspendedAt && <span className="pill warn">Suspended</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.university || "—"}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>{formatDateTime(u.lastActiveAt)}</td>
                  <td className="num">{u.simsDone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="empty card">No users found.</p>}
      {pages > 1 && (
        <nav className="pager" aria-label="Pages">
          {page > 1 ? <Link className="btn ghost sm" href={href(page - 1)}>‹ Previous</Link> : <span />}
          <span className="small muted">Page {page} of {pages}</span>
          {page < pages ? <Link className="btn ghost sm" href={href(page + 1)}>Next ›</Link> : <span />}
        </nav>
      )}
    </>
  );
}
