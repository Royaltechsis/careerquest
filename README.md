# CareerQuest

**Try a career before you choose it.** CareerQuest is an interactive career exploration and readiness platform for university students. Explore careers, take an interest quiz, follow stage-by-stage roadmaps, do hands-on workplace simulations, and turn what you complete into a portfolio you can share.

Inspired by the learn-by-doing approach of platforms like TryHackMe, built with Nigerian and African students in mind (SIWES, local context, modest phones and data).

**Live demo:** https://careerquest.sites.tab.bot

## Features

- **Onboarding** – name, university, course, level, goals and careers you're curious about (30 seconds, no sign-up).
- **Career discovery** – 10 searchable, filterable career profiles across Security, Data & AI, Design, Engineering, Business & Product and Marketing & Comms: Cybersecurity Analyst, Data Analyst, UI/UX Designer, Software Developer, Product Manager, Digital Marketer, Cloud Engineer, AI / ML Engineer, Business Analyst and Technical Writer. Each explains what the work is, a typical day, skills, tools, entry-level roles and progression, learning routes, portfolio project ideas and certifications.
- **Interest quiz** – 10 quick questions that suggest careers worth exploring. Guidance, not a verdict.
- **Interactive roadmaps** – Cybersecurity, Data Analysis, UI/UX Design and Product Management, broken into stages with checkable milestones and saved progress.
- **Hands-on simulations** (graded, with hints and feedback):
  - Phishing Investigation – flag the suspicious parts of a realistic email (cybersecurity)
  - Canteen Sales Analysis – explore a small dataset, spot issues, pick the right chart (data analysis)
  - Usability Audit – find usability problems on a mock screen (UI/UX)
  - Feature Prioritisation – rank features from user feedback (product management)
  - Design an Election Cloud – build a basic cloud architecture (cloud)
  - Campaign Brief Builder – write a campaign brief for a small business (digital marketing)
- **Dashboard** – explored paths, roadmap progress, completed challenges, skills practised, 12 badges and a recommended next step.
- **Portfolio builder** – add your own projects (problem, approach, skills, evidence link), add completed simulations in one tap, mark each item public or private, and share a public portfolio link.

## Tech

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies, no network calls after load. Hash-based routing (`#/careers`, `#/sim/phishing`, `#/p/<name>` …), so it runs on any static host.

```
index.html     app shell
styles.css     all styles (responsive, mobile-first)
app.js         router, state, views (dashboard, careers, quiz, roadmaps, portfolio)
data.js        career profiles, categories, roadmaps, quiz
sims.js        the six simulations
favicon.svg
tests/         content/asset tests and headless-browser click-through scripts
```

## Run locally

Any static server works. From the repo root:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open http://localhost:8000. (Opening `index.html` directly from disk also works in most browsers.)

### Tests

```bash
node --test tests/site.test.js        # content + asset checks (Node 18+)
pip install playwright && playwright install chromium
python3 tests/e2e.py http://localhost:8000/ ./shots   # clicks through onboarding, quiz, roadmaps and every simulation
```

## Data and storage (current limitation)

There is **no backend or database yet**. Everything (profile, roadmap progress, simulation results, portfolio) is saved in the browser's `localStorage` under the key `cq_state_v1`:

- Progress lives on one device and one browser. Clearing site data or switching devices starts fresh.
- There are no real accounts or logins.
- The public portfolio link works on any device because the public items are encoded into the link itself (`#/p/<name>?d=…`); it's a snapshot, so re-share after editing.

Natural next step: add auth and a database (e.g. Supabase or Firebase, or a Node/Postgres API) and sync the same state object per user.

## Deploy on Vercel

It's a static site, so it deploys with zero config:

1. Vercel → **Add New… → Project** → import `careerquest` from GitHub.
2. Framework Preset: **Other**. Leave Build Command and Install Command empty, Output Directory empty (repo root). Deploy.

Every push to `main` redeploys automatically. No environment variables are needed. Also works on Netlify, GitHub Pages or Cloudflare Pages as-is.

## Roadmap ideas

- Accounts + cloud sync, mentor/adviser view
- More careers, roadmaps and simulations
- Certificates of completion, exportable PDF portfolio
- Smarter recommendations from activity
