import Home from "@/components/views/Home";
import { activeAnnouncements } from "@/lib/announcements";
import { currentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await currentUser();
  return <Home announcements={user ? await activeAnnouncements() : []} />;
}
