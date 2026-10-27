import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CQ_DATA } from "@/content/data";
import { RoadmapDetail } from "@/components/views/Roadmaps";
import { careerById } from "@/lib/progress";
import { requireUser } from "@/lib/guard";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = careerById((await params).id);
  return c ? { title: `${c.name} roadmap` } : {};
}

export default async function RoadmapPage({ params }: Props) {
  const { id } = await params;
  await requireUser("/roadmap/" + id);
  if (!careerById(id) || !CQ_DATA.roadmaps[id]) notFound();
  return <RoadmapDetail careerId={id} />;
}
