/* Server-side lookups over the content (used to validate API input). */
import { CQ_DATA } from "./data";

export const SIM_IDS = ["phishing", "data", "uiux", "product", "cloud", "marketing"] as const;
export const BADGE_IDS = ["welcome", "quiz", "explorer", "first-sim", "phish", "data", "ux", "poly", "stage", "half", "folio", "public"] as const;
export const GOAL_IDS = ["discover", "start", "practice", "internship", "portfolio"] as const;
export const LEVELS = ["100", "200", "300", "400", "500", "Graduate"] as const;

export const careerIds = new Set(CQ_DATA.careers.map((c) => c.id));
export function isRoadmapItem(careerId: string, itemId: string): boolean {
  const r = CQ_DATA.roadmaps[careerId];
  return !!r && r.stages.some((s) => s.items.some((i) => i.id === itemId));
}
