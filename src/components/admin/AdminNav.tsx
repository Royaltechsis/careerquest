"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: [string, string][] = [["/admin", "Overview"], ["/admin/users", "Users"], ["/admin/portfolio", "Portfolio"], ["/admin/announcements", "Announcements"], ["/admin/activity", "Activity"]];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="admin-nav" aria-label="Admin">
      {LINKS.map(([href, label]) => {
        const on = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return <Link key={href} href={href} className={`chip-btn ${on ? "on" : ""}`} aria-current={on ? "page" : undefined}>{label}</Link>;
      })}
    </nav>
  );
}
