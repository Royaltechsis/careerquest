import type { Metadata } from "next";
import Quiz from "@/components/views/Quiz";
import { requireUser } from "@/lib/guard";

export const metadata: Metadata = { title: "Interest quiz" };

export default async function QuizPage() {
  await requireUser("/quiz");
  return <Quiz />;
}
