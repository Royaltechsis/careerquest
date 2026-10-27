import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import Boot from "@/components/Boot";
import { getUser } from "@/lib/auth";
import { loadState } from "@/lib/state";

export const dynamic = "force-dynamic";

const ROUTES = new Set(["", "dashboard", "start", "me", "careers", "career", "quiz", "roadmaps", "roadmap", "challenges", "sim", "portfolio"]);
const PROTECTED = new Set(["dashboard", "start", "me", "quiz", "roadmaps", "roadmap", "challenges", "sim", "portfolio"]);

/** One server-rendered shell for every app view; the client app renders the view for the URL. */
export default async function AppPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  const section = slug[0] ?? "";
  if (!ROUTES.has(section) || slug.length > 2) notFound();
  const user = await getUser();
  if (!user && PROTECTED.has(section)) redirect("/login?next=" + encodeURIComponent("/" + slug.join("/")));
  const state = user ? await loadState(user) : null;
  if (user && state && !state.profile && (section === "" || section === "dashboard")) redirect("/start");
  return (
    <>
      <Header app />
      <main id="main" className="wrap" tabIndex={-1}>
        <noscript><p>CareerQuest needs JavaScript to run.</p></noscript>
      </main>
      <nav id="tabbar" className="tabbar" aria-label="Main" />
      <div id="toast" className="toast" role="status" aria-live="polite" />
      <Boot state={state} user={user} />
    </>
  );
}
