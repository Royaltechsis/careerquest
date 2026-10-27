/*
 * Data models shared by the server (Drizzle rows, API handlers, page loaders) and the
 * client components. Type-only imports from the schema keep this file safe for the browser.
 */
import type { InferSelectModel } from "drizzle-orm";
import type { portfolioItems, profiles } from "@/db/schema";

/** The signed-in user as the app sees it (never includes the password hash). */
export type Role = "user" | "admin";
export interface AppUser { id: string; email: string; username: string; name: string; role: Role }

export type QuizResult = NonNullable<InferSelectModel<typeof profiles>["quiz"]>;

export type GoalId = "discover" | "start" | "practice" | "internship" | "portfolio";

export interface Profile {
  name: string; uni: string; course: string; level: string;
  goals: string[]; interests: string[]; created: number;
}

/** Best / last score per simulation, derived on the server from the attempt history. */
export interface SimRecord { best: number; last: number; attempts: number; at: number }

type PortfolioRow = InferSelectModel<typeof portfolioItems>;
/** A portfolio item as the client holds it: the DB row without owner, with epoch-ms dates. */
export type PortfolioItem = Omit<PortfolioRow, "userId" | "isPublic" | "hiddenAt" | "createdAt" | "updatedAt"> & {
  public: boolean; created: number; updated: number;
  /** Taken off the public page by a moderator (read-only for the student). */
  hidden?: boolean;
};
/** The editable fields of a portfolio item, as sent to POST / PATCH /api/portfolio. */
export type PortfolioFields = Pick<PortfolioItem, "id" | "source" | "title" | "problem" | "approach" | "skills" | "link" | "evidence" | "career" | "public">;

/** Everything the app works with for one signed-in student. */
export interface ClientState {
  profile: Profile | null;
  explored: string[];
  quiz: QuizResult | null;
  /** careerId -> itemId -> true for ticked roadmap steps */
  roadmap: Record<string, Record<string, true>>;
  sims: Record<string, SimRecord>;
  portfolio: PortfolioItem[];
  seenBadges: string[];
}

export const blankState = (): ClientState => ({ profile: null, explored: [], quiz: null, roadmap: {}, sims: {}, portfolio: [], seenBadges: [] });
