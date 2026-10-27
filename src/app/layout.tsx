import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerQuest · Try a career before you choose it",
  description: "Explore careers, do hands-on workplace simulations, follow roadmaps and build a portfolio before graduation.",
  openGraph: {
    title: "CareerQuest · Try a career before you choose it",
    description: "Career discovery, hands-on simulations, roadmaps and a portfolio builder for university students.",
  },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#FFF6E9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
