import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CareerProfile from "@/components/views/CareerProfile";
import { careerById } from "@/lib/progress";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = careerById((await params).id);
  return c ? { title: c.name, description: c.tagline } : {};
}

export default async function CareerPage({ params }: Props) {
  const c = careerById((await params).id);
  if (!c) notFound();
  return <CareerProfile c={c} />;
}
