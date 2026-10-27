export interface Category { id: string; name: string; icon: string }
export interface Career {
  id: string; name: string; cat: string; color: string; tagline: string; what: string;
  day: string[]; skills: string[]; tools: string[]; entry: string[]; path: string[];
  routes: string[]; projects: string[]; certs: string[]; traits: string[];
  roadmap: boolean; sim: string | null;
}
export type RoadmapItemType = "learn" | "tool" | "challenge" | "project" | "milestone";
export interface RoadmapItem { id: string; t: string; type: string; sim?: string }
export interface RoadmapStage { title: string; sub: string; items: RoadmapItem[] }
export interface Roadmap { intro: string; stages: RoadmapStage[] }
export interface QuizOption { t: string; w: Record<string, number> }
export interface QuizQuestion { q: string; o: QuizOption[] }
export interface CareerData {
  categories: Category[];
  careers: Career[];
  roadmaps: Record<string, Roadmap>;
  quiz: QuizQuestion[];
  traitCareers: Record<string, string[]>;
}
