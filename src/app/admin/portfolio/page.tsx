import type { Metadata } from "next";
import Link from "next/link";
import AdminButton from "@/components/admin/AdminButton";
import { moderationList } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/guard";

export const metadata: Metadata = { title: "Portfolio moderation" };
type Props = { searchParams: Promise<{ show?: string }> };

export default async function AdminPortfolio({ searchParams }: Props) {
  await requireAdmin();
  const show = (await searchParams).show === "hidden" ? "hidden" : "visible";
  const rows = await moderationList(show);
  return (
    <>
      <section className="page-head"><h1>Portfolio moderation</h1><p className="muted">Public items students share at /p/username. Hidden items stay in the student&apos;s portfolio but leave their public page.</p></section>
      <div className="chips" role="group" aria-label="Show">
        <Link className={`chip-btn ${show === "visible" ? "on" : ""}`} href="/admin/portfolio">Public</Link>
        <Link className={`chip-btn ${show === "hidden" ? "on" : ""}`} href="/admin/portfolio?show=hidden">Hidden</Link>
      </div>
      <p className="muted small">{rows.length} item{rows.length === 1 ? "" : "s"}{rows.length === 100 ? " (newest 100)" : ""}</p>
      {rows.length ? rows.map((it) => (
        <article className="card mod-item" key={it.id} data-item={it.id}>
          {it.career && <span className="ccard-cat">{it.career}</span>}
          <h3>{it.title || "Untitled"}</h3>
          <p className="small muted">by <Link href={`/admin/users/${it.ownerId}`}>{it.ownerName}</Link> · <a href={`/p/${it.ownerUsername}`} target="_blank" rel="noopener">/p/{it.ownerUsername}</a> · updated {formatDateTime(it.updatedAt)}</p>
          {it.problem && <p className="small">{it.problem}</p>}
          {/^https?:\/\//.test(it.link) && <p className="small">Evidence: <a href={it.link} target="_blank" rel="noopener noreferrer nofollow">{it.link}</a></p>}
          <div className="cta-row">
            {it.hiddenAt
              ? <AdminButton url={`/api/admin/portfolio/${it.id}`} body={{ hidden: false }} className="btn sm">Unhide</AdminButton>
              : <AdminButton url={`/api/admin/portfolio/${it.id}`} body={{ hidden: true }} className="btn ghost sm">Hide</AdminButton>}
          </div>
        </article>
      )) : <p className="empty card">{show === "hidden" ? "Nothing is hidden." : "No public items yet."}</p>}
    </>
  );
}
