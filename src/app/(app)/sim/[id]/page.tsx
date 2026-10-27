import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SimView from "@/components/views/SimView";
import { simById } from "@/content/sims";
import { requireUser } from "@/lib/guard";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = simById((await params).id);
  return s ? { title: s.title, description: s.desc } : {};
}

export default async function SimPage({ params }: Props) {
  const { id } = await params;
  await requireUser("/sim/" + id);
  const s = simById(id);
  if (!s) notFound();
  return <SimView key={s.id} simId={s.id} />;
}
