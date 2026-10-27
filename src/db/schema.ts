import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, primaryKey, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  // HMAC-SHA256 of the random token in the cookie; the raw token is never stored.
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  university: text("university").notNull().default(""),
  course: text("course").notNull().default(""),
  level: text("level").notNull().default("100"),
  goals: jsonb("goals").$type<string[]>().notNull().default([]),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  explored: jsonb("explored").$type<string[]>().notNull().default([]),
  quiz: jsonb("quiz").$type<{ top: string[]; traits: string[]; ts: string; at: number } | null>(),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const roadmapProgress = pgTable("roadmap_progress", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  careerId: text("career_id").notNull(),
  itemId: text("item_id").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.careerId, t.itemId] })]);

export const simulationAttempts = pgTable("simulation_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  simId: text("sim_id").notNull(),
  score: integer("score").notNull(),
  summary: text("summary").notNull().default(""),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  answers: jsonb("answers"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("sim_attempts_user_idx").on(t.userId, t.simId)]);

export const portfolioItems = pgTable("portfolio_items", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  source: text("source").notNull().default("manual"), // "manual" or "sim:<simId>"
  title: text("title").notNull().default(""),
  problem: text("problem").notNull().default(""),
  approach: text("approach").notNull().default(""),
  skills: text("skills").notNull().default(""),
  link: text("link").notNull().default(""),
  evidence: text("evidence").notNull().default(""),
  career: text("career").notNull().default(""),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("portfolio_user_idx").on(t.userId)]);

export const badges = pgTable("badges", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: text("badge_id").notNull(),
  earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.badgeId] })]);
