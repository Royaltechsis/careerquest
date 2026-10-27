import type { Metadata } from "next";
import Careers from "@/components/views/Careers";

export const metadata: Metadata = { title: "Explore careers" };

export default function CareersPage() {
  return <Careers />;
}
