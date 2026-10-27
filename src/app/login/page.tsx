import { redirect } from "next/navigation";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { getUser } from "@/lib/auth";
import { safeNext } from "@/lib/next-path";

export const metadata = { title: "Log in · CareerQuest" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getUser()) redirect(next);
  return (
    <>
      <Header right={<a className="btn ghost sm" href="/signup">Sign up</a>} />
      <main id="main" className="wrap"><AuthForm mode="login" next={next} /></main>
    </>
  );
}
