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
    [[...slug]]/page.tsx     app shell for all app views (server loads the user's state)
    login/, signup/          auth pages
    p/[username]/page.tsx    public portfolio (server-rendered)
    api/                     route handlers (see API below)
  client/
    engine.js                interactive views + client-side router
    sims.js                  the six simulations
    sync.js                  optimistic saves: diffs state and calls the API
  components/                Header, AuthForm, Boot
  content/                   careers, roadmaps, quiz (typed content shared by server + client)
  db/
    schema.ts                Drizzle schema
    bootstrap.ts             idempotent CREATE TABLE IF NOT EXISTS (auto-run on first DB call)
    index.ts                 DB client
  lib/                       auth, state loader, API helpers
drizzle/                     generated SQL migration (drizzle-kit)
tests/e2e.py                 end-to-end browser test
```

### Database tables

`users`, `sessions`, `profiles` (onboarding answers, explored careers, quiz result), `roadmap_progress`, `simulation_attempts` (score, summary, skills), `portfolio_items` (public/private), `badges`.

Career, roadmap and simulation **content** lives in code (`src/content`, `src/client/sims.js`). Only **user data** goes in the database.

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

## Deploy to Vercel

1. Create a database at [neon.tech](https://neon.tech) and copy its connection string. Or skip this: in step 3 you can add Neon from Vercel's **Storage** tab, which sets `DATABASE_URL` for you.
2. In Vercel, go to **Add New → Project** and import this repo. The framework is detected as **Next.js**, so keep the default build settings.
3. Before you click Deploy, open **Environment Variables** and add `DATABASE_URL` and `SESSION_SECRET`.
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
| GET / POST | `/api/simulations` | `{ simId, score, summary, skills }`. Record an attempt |
| GET / POST | `/api/portfolio` | List / create items |
| PATCH / DELETE | `/api/portfolio/:id` | Update / delete your item |
| GET / POST | `/api/badges` | List / record earned badges |
| GET | `/api/public/:username` | Public portfolio JSON (public items only, no auth) |

Every input is validated on the server: known career, roadmap item, simulation and badge ids; length limits; `https://` evidence links; per-user ownership checks.

## How saving works

The UI updates instantly (optimistic). `src/client/sync.js` then compares the new state with the last saved snapshot and sends only what changed to the API, in order, retrying on network errors. On page load the server reads the user's state from Postgres and renders the app with it, so there's no loading spinner and no flash of empty data.

## Testing

```bash
npm run lint         # TypeScript type check
npm run build        # production build

# end-to-end (needs a running server with a database)
pip install playwright && playwright install chromium
npm run build && npm start &
python3 tests/e2e.py http://localhost:3000 ./shots
```

The end-to-end test covers:
- sign-up, onboarding, the quiz and career search;
- all six simulations, roadmap ticks and portfolio add / public / private;
- that everything survives a reload and shows up when logging in from a second browser;
- the public page shows only public items;
- browser back and forward, and logout.

## Roadmap ideas

- Password reset by email, and rate limiting on login
- Mentor / career adviser view
- More careers, roadmaps and simulations; server-side scoring
- Certificates of completion and an exportable PDF portfolio
