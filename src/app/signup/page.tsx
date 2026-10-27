import { redirect } from "next/navigation";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { getUser } from "@/lib/auth";
import { safeNext } from "@/lib/next-path";

export const metadata = { title: "Sign up · CareerQuest" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getUser()) redirect(next);
  return (
    <>
      <Header right={<a className="btn ghost sm" href="/login">Log in</a>} />
      <main id="main" className="wrap"><AuthForm mode="signup" next={next} /></main>
    </>
  );
}
