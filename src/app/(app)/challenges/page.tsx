import type { Metadata } from "next";
import Challenges from "@/components/views/Challenges";
import { requireUser } from "@/lib/guard";

export const metadata: Metadata = { title: "Challenges" };

export default async function ChallengesPage() {
  await requireUser("/challenges");
  return <Challenges />;
}
