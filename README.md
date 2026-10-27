# CareerQuest

**Try a career before you choose it.** CareerQuest is an interactive career exploration and readiness platform for university students. Explore careers, take an interest quiz, follow stage-by-stage roadmaps, do hands-on workplace simulations, and turn what you complete into a portfolio you can share.

It's inspired by the learn-by-doing approach of platforms like TryHackMe. It's built for Nigerian and African students (SIWES, local context) and for modest phones and data plans.

Full-stack **Next.js** (App Router, TypeScript). The API is route handlers inside Next.js, backed by **Postgres on Neon** through **Drizzle ORM**, with real email + password accounts.

## Features

- **Accounts.** Sign up, log in and log out with email (or username) and password. Passwords are hashed with bcrypt. Sessions use an httpOnly cookie backed by the database and can be revoked on logout.
- **Onboarding.** Collects university, course, level, goals and the careers you're curious about.
- **Career discovery.** 10 searchable, filterable career profiles: Cybersecurity Analyst, Data Analyst, UI/UX Designer, Software Developer, Product Manager, Digital Marketer, Cloud Engineer, AI / ML Engineer, Business Analyst and Technical Writer. Each covers what the job involves, a typical day, skills, tools, entry roles and progression, learning routes, project ideas and certifications.
- **Interest quiz.** 10 quick questions that suggest careers worth exploring. Treat it as guidance, not a verdict.
- **Roadmaps.** Cybersecurity, Data Analysis, UI/UX Design and Product Management. Each is split into stages with checkable milestones, saved per user.
- **Six graded simulations**, each with hints and feedback:
  - Phishing Investigation (cybersecurity)
  - Canteen Sales Analysis (data)
  - Usability Audit (UI/UX)
  - Feature Prioritisation (product)
  - Design an Election Cloud (cloud)
  - Campaign Brief Builder (marketing)

  Every attempt is stored.
- **Dashboard.** Shows explored paths, roadmap progress, completed challenges, skills practised, 12 badges and a rule-based "recommended next step".
- **Portfolio builder.**
  - Add your own projects with problem, approach, skills and an evidence link.
  - Completed simulations are added automatically.
  - Each item can be public or private.
  - Your public portfolio lives at **`/p/<username>`**, rendered on the server from the database, showing public items only.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| API | Route handlers in `src/app/api/*` |
| Database | Postgres (Neon) via `postgres` driver + Drizzle ORM |
| Auth | bcryptjs password hashing, DB sessions, httpOnly cookie |
| Styling | Plain CSS (`src/app/globals.css`), mobile-first, no UI framework |

### Project structure

```
src/
  app/
    (app)/                   the student app: one route per screen, all sharing one layout
      layout.tsx             loads the signed-in user's state on the server, wraps every screen in <AppProvider>
      page.tsx               "/": landing page for visitors, dashboard for students
      dashboard/ start/ me/ careers/ career/[id]/ quiz/ roadmaps/ roadmap/[id]/ challenges/ sim/[id]/ portfolio/
    admin/                   admin panel (server components, guarded by role)
    login/, signup/          auth pages
    p/[username]/page.tsx    public portfolio (server-rendered)
    api/                     route handlers (see API below), incl. api/admin/*
  components/
    app/                     AppProvider (state, optimistic saves, toasts, badges), AppChrome (header, tab bar)
    views/                   one component per screen: Dashboard, Careers, CareerProfile, Quiz, Roadmaps, SimView, Portfolio…
    sims/                    the six simulations: Phishing, DataSim, UxAudit, ProductRank, DecisionSim (cloud + marketing)
    admin/                   admin client widgets (action buttons, announcement form, nav)
    ui.tsx                   Icon, Meter, Ring, Pill, CareerCard…
  content/                   careers, roadmaps, quiz and simulation content (typed, shared by server + client)
  db/
    schema.ts                Drizzle schema (the source of the shared data types)
    bootstrap.ts             idempotent CREATE TABLE / ADD COLUMN IF NOT EXISTS (auto-run on first DB call)
    index.ts                 DB client
  lib/
    models.ts                data models shared by client and server, derived from the Drizzle schema
    scoring.ts               simulation scoring + answer validation, used by the UI and by POST /api/simulations
    progress.ts              roadmap progress, skills, badges, recommendations, quiz scoring (pure functions)
    sync.ts                  optimistic saves: diffs state and calls the API
    auth.ts, guard.ts, admin.ts, state.ts, http.ts …
drizzle/                     generated SQL migrations (drizzle-kit)
tests/e2e.py                 end-to-end browser test
```

### Database tables

`users` (incl. `role`, `suspended_at`, `last_active_at`), `sessions`, `profiles` (onboarding answers, explored careers, quiz result), `roadmap_progress`, `simulation_attempts` (answers, server-computed score, summary, skills), `portfolio_items` (public/private, `hidden_at` for moderation), `badges`, `announcements`, `audit_log`.

Career, roadmap and simulation **content** lives in code (`src/content`). Only **user data** goes in the database.

## Getting started (local)

Requirements: Node 20+, a Postgres database. A free Neon project works, or a local Postgres.

```bash
git clone https://github.com/Royaltechsis/careerquest.git
cd careerquest
npm install
cp .env.example .env.local     # then fill in DATABASE_URL and SESSION_SECRET
npm run dev                    # http://localhost:3000
```

**Database setup is automatic.** On the first request that touches the database, the app creates any missing tables (`CREATE TABLE IF NOT EXISTS`, safe to run any number of times). You can also manage the schema with Drizzle Kit:

```bash
npm run db:push       # sync src/db/schema.ts to the database
npm run db:generate   # generate a SQL migration into ./drizzle after changing the schema
```

### Environment variables

| Name | Required | What it is |
|---|---|---|
| `DATABASE_URL` | yes | Neon Postgres connection string (the **pooled** one is fine), e.g. `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require` |
| `SESSION_SECRET` | yes | Long random string used to sign session tokens. Generate with `openssl rand -base64 32` |
| `ADMIN_EMAILS` | no | Comma-separated emails that become **admins** when they sign up or log in, e.g. `you@gmail.com,cofounder@gmail.com` |

## Deploy to Vercel

1. Create a database at [neon.tech](https://neon.tech) and copy its connection string. Or skip this: in step 3 you can add Neon from Vercel's **Storage** tab, which sets `DATABASE_URL` for you.
2. In Vercel, go to **Add New → Project** and import this repo. The framework is detected as **Next.js**, so keep the default build settings.
3. Before you click Deploy, open **Environment Variables** and add `DATABASE_URL`, `SESSION_SECRET` and (for the admin panel) `ADMIN_EMAILS`.
4. Deploy. The tables are created automatically on the first sign-up.

Every push to `main` redeploys.

## API

All endpoints return JSON. Authenticated endpoints use the session cookie and answer `401` when you're signed out.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | `{ name, username, email, password }`. Creates the account and signs in |
| POST | `/api/auth/login` | `{ email (or username), password }` |
| POST | `/api/auth/logout` | End the session |
| GET | `/api/me` | Current user |
| GET / DELETE | `/api/state` | Everything for the dashboard / "start over" (wipes progress, keeps the account) |
| PUT | `/api/profile` | `{ profile?: { name, uni, course, level, goals, interests }, explored?: string[] }` |
| PUT | `/api/quiz` | `{ quiz: { top, traits, ts } }` |
| GET / PUT | `/api/progress` | `{ careerId, itemId, done }`. Tick or untick a roadmap item |
| GET / POST | `/api/simulations` | `{ simId, answers }`. Record an attempt; the **server computes the score** from the answers |
| GET / POST | `/api/portfolio` | List / create items |
| PATCH / DELETE | `/api/portfolio/:id` | Update / delete your item |
| GET / POST | `/api/badges` | List / record earned badges |
| GET | `/api/public/:username` | Public portfolio JSON (public items only, no auth) |

### Admin API

Every `/api/admin/*` call checks the role: `401` when signed out, `403` for non-admins.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/stats` | Overview numbers |
| GET | `/api/admin/users?q=&page=` | Search users (20 per page) |
| GET / PATCH / DELETE | `/api/admin/users/:id` | Detail / `{ role: "admin" \| "user" }` or `{ suspended: boolean }` / delete user |
| PATCH | `/api/admin/portfolio/:id` | `{ hidden: boolean }`. Hide or unhide an item on the public page |
| GET / POST | `/api/admin/announcements` | List / post `{ title, body, active }` |
| PATCH / DELETE | `/api/admin/announcements/:id` | Edit or switch on/off / delete |
| GET | `/api/admin/activity` | Audit log |

Every input is validated on the server: known career, roadmap item, simulation and badge ids; length limits; `https://` evidence links; per-user ownership checks.

## How the app is built

- **Server components load, client components interact.** The `(app)` layout reads the signed-in student's state from Postgres on the server and hands it to `<AppProvider>`. Each screen is its own route (`/careers`, `/career/[id]`, `/sim/phishing`, …), with server-side auth guards and real 404s for unknown ids. Career profiles render their content on the server; only the action row is a client component.
- **No DOM manipulation.** Every screen and simulation is a React + TypeScript component. Navigation uses `next/link`, so moving between screens keeps the in-memory state.
- **Optimistic saves.** A change updates the UI instantly through `commit()`. Then `src/lib/sync.ts` compares the new state with the last saved snapshot and sends only what changed to the API, in order, retrying on network errors.
- **Shared types.** `src/lib/models.ts` derives the client data models from the Drizzle schema, so the API, the DB and the UI agree on one shape.
- **Server-side scoring.** A finished simulation sends its *answers* (flags raised, options picked, ranking…). `src/lib/scoring.ts` validates them and computes the score. The UI uses the same module for the instant result, and the API uses it to record the attempt, so a tampered request can't post a fake score.

## Admin panel

Sign up or log in with an email listed in `ADMIN_EMAILS` and an **Admin** link appears in the header (`/admin`). Non-admins get a 404 there.

- **Overview.** Totals (users, signups today / 7 days, quiz completions, simulation attempts, portfolio items, public portfolios), a 14-day signups chart, the most-explored careers, and attempts and average score per simulation.
- **Users.** Search (name, username, email, university), paginate, and open a user to see their profile, roadmap progress, attempts and portfolio. From there you can make or remove an admin, suspend or unsuspend (suspending signs them out everywhere and blocks login), or delete the user.
- **Portfolio moderation.** Lists public items. A hidden item stays in the student's portfolio, marked as hidden, but leaves `/p/username`.
- **Announcements.** Post a banner (title and message) that shows at the top of every student's dashboard, and switch it on or off.
- **Activity.** An audit log of every admin action.

## Testing

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (next core-web-vitals + typescript rules)
npm run build        # production build

# end-to-end (needs a running server with a database)
pip install playwright && playwright install chromium
npm run build
ADMIN_EMAILS=cq-admin@example.com npm start &     # the test signs this admin account up
python3 tests/e2e.py http://localhost:3000 ./shots
```

The end-to-end test covers:
- sign-up, onboarding, the quiz and career search;
- all six simulations, roadmap ticks and portfolio add / public / private;
- that everything survives a reload and shows up when logging in from a second browser;
- the public page shows only public items;
- browser back and forward, and logout;
- the admin panel: an `ADMIN_EMAILS` account gets in, non-admins are blocked from `/admin` and `/api/admin`, suspending signs a user out and blocks login, hiding an item removes it from the public page, an announcement shows on the dashboard, and all of it lands in the audit log.

## Roadmap ideas

- Password reset by email, and rate limiting on login
- Mentor / career adviser view
- More careers, roadmaps and simulations
- Certificates of completion and an exportable PDF portfolio
