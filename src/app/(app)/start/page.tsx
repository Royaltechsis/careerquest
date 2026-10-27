import type { Metadata } from "next";
import ProfileForm from "@/components/views/ProfileForm";
import { requireUser } from "@/lib/guard";

export const metadata: Metadata = { title: "Set up your quest" };

export default async function StartPage() {
  await requireUser("/start");
  return <ProfileForm />;
}
