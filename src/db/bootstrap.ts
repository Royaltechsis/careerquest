/*
 * Idempotent schema bootstrap. Runs once per server instance on the first DB call,
 * so a fresh Neon database works with zero manual steps. It mirrors src/db/schema.ts;
 * `npm run db:push` (drizzle-kit) remains the canonical way to evolve the schema.
 */
export const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "username" text NOT NULL,
  "name" text NOT NULL,
  "password_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email"),
  CONSTRAINT "users_username_unique" UNIQUE("username")
);
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" ("user_id");
CREATE TABLE IF NOT EXISTS "profiles" (
  "user_id" uuid PRIMARY KEY NOT NULL,
  "university" text DEFAULT '' NOT NULL,
  "course" text DEFAULT '' NOT NULL,
  "level" text DEFAULT '100' NOT NULL,
  "goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "explored" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "quiz" jsonb,
  "onboarded_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "roadmap_progress" (
  "user_id" uuid NOT NULL,
  "career_id" text NOT NULL,
  "item_id" text NOT NULL,
  "completed_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "roadmap_progress_user_id_career_id_item_id_pk" PRIMARY KEY("user_id","career_id","item_id"),
  CONSTRAINT "roadmap_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "simulation_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "sim_id" text NOT NULL,
  "score" integer NOT NULL,
  "summary" text DEFAULT '' NOT NULL,
  "skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "answers" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "simulation_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "sim_attempts_user_idx" ON "simulation_attempts" ("user_id","sim_id");
CREATE TABLE IF NOT EXISTS "portfolio_items" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "source" text DEFAULT 'manual' NOT NULL,
  "title" text DEFAULT '' NOT NULL,
  "problem" text DEFAULT '' NOT NULL,
  "approach" text DEFAULT '' NOT NULL,
  "skills" text DEFAULT '' NOT NULL,
  "link" text DEFAULT '' NOT NULL,
  "evidence" text DEFAULT '' NOT NULL,
  "career" text DEFAULT '' NOT NULL,
  "is_public" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "portfolio_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS "portfolio_user_idx" ON "portfolio_items" ("user_id");
CREATE TABLE IF NOT EXISTS "badges" (
  "user_id" uuid NOT NULL,
  "badge_id" text NOT NULL,
  "earned_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "badges_user_id_badge_id_pk" PRIMARY KEY("user_id","badge_id"),
  CONSTRAINT "badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);
`;
