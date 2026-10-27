import "server-only";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "./auth";

/** Server-side guard for signed-in screens: sends visitors to log in, then back here. */
export async function requireUser(path: string) {
  const user = await currentUser();
  if (!user) redirect("/login?next=" + encodeURIComponent(path));
  return user;
}

/** Server-side guard for the admin panel: anyone who isn't an admin gets a plain 404. */
export async function requireAdmin() {
  const user = await currentUser();
  if (!user || user.role !== "admin") notFound();
  return user;
}
