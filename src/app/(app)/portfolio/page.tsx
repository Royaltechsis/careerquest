import type { Metadata } from "next";
import Portfolio from "@/components/views/Portfolio";
import { requireUser } from "@/lib/guard";

export const metadata: Metadata = { title: "Portfolio" };
type Props = { searchParams: Promise<{ add?: string }> };

export default async function PortfolioPage({ searchParams }: Props) {
  const { add } = await searchParams;
  await requireUser("/portfolio" + (add ? "?add=" + encodeURIComponent(add) : ""));
  const adding = add === "1";
  return <Portfolio key={adding ? "add" : "list"} startAdding={adding} />;
}
