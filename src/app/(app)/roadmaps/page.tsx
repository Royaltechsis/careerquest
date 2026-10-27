import type { Metadata } from "next";
import { RoadmapList } from "@/components/views/Roadmaps";
import { requireUser } from "@/lib/guard";

export const metadata: Metadata = { title: "Roadmaps" };

export default async function RoadmapsPage() {
  await requireUser("/roadmaps");
  return <RoadmapList />;
}
