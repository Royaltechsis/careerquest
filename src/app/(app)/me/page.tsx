import type { Metadata } from "next";
import Account from "@/components/views/Account";
import { requireUser } from "@/lib/guard";

export const metadata: Metadata = { title: "Your profile" };

export default async function MePage() {
  await requireUser("/me");
  return <Account />;
}
