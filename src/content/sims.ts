/*
 * Simulation content: metadata, scenarios' data and answer keys. Pure data, shared by the
 * client components (to render the sims) and the server (to re-score submitted answers).
 */
import type { SIM_IDS } from "./catalog";

export type SimId = (typeof SIM_IDS)[number];

export interface SimMeta {
  id: SimId; title: string; career: string; mins: number; level: string; skills: string[]; desc: string;
}

export const SIMS: SimMeta[] = [
  { id: "phishing", title: "Phishing Investigation", career: "cybersecurity", mins: 6, level: "Beginner", skills: ["Phishing analysis", "Email header analysis", "Incident response"], desc: "A suspicious payroll email hit the whole office. Find the red flags and decide what to do." },
  { id: "data", title: "Canteen Sales Analysis", career: "data-analysis", mins: 8, level: "Beginner", skills: ["Data cleaning", "Spreadsheet analysis", "Data visualisation", "Storytelling with data"], desc: "Clean a small dataset, explore it in your browser and recommend what Mama Tolu should do." },
  { id: "uiux", title: "Usability Audit", career: "ui-ux", mins: 7, level: "Beginner", skills: ["Usability heuristics", "Accessibility", "Interface critique"], desc: "Students keep failing course registration. Spot 7 usability problems and pick the right fixes." },
  { id: "product", title: "Feature Prioritisation", career: "product-management", mins: 5, level: "Beginner", skills: ["Prioritisation (RICE)", "User feedback analysis", "Product thinking"], desc: "Six feature requests, room for three. Rank them using real user feedback." },
  { id: "cloud", title: "Design an Election Cloud", career: "cloud", mins: 5, level: "Beginner", skills: ["Cloud architecture", "High availability", "Cloud security basics"], desc: "8,000 students vote in 6 hours. Design infrastructure that won't fall over." },
  { id: "marketing", title: "Campaign Brief Builder", career: "digital-marketing", mins: 5, level: "Beginner", skills: ["Campaign planning", "Copywriting", "Marketing analytics"], desc: "₦50k, 4 weeks, one zobo brand. Build a campaign that actually wins customers." },
];

export const simById = (id: string): SimMeta | undefined => SIMS.find((s) => s.id === id);

/* ---------------- 1. Phishing investigation ---------------- */
export type PhishKey =
  | "from" | "replyto" | "subject" | "auth" | "greeting" | "threat" | "link" | "creds" | "attach"
  | "to" | "date" | "body1" | "sig" | "footer";
export interface PhishPart { ind: boolean; label?: string; why: string }

export const PHISH: Record<PhishKey, PhishPart> = {
  from: { ind: true, label: "Look-alike sender domain", why: "The bank's real domain is kora-mfb.com. ‘kora-mfb-support.com’ is a different domain anyone can register; the display name hides it." },
  replyto: { ind: true, label: "Reply-To goes to a free Gmail address", why: "A real IT helpdesk would never route replies to a personal Gmail. Replies would go straight to the attacker." },
  subject: { ind: true, label: "Pressure in the subject line", why: "CAPITALS, ‘URGENT’ and a 2-hour deadline are designed to stop you thinking carefully." },
  auth: { ind: true, label: "Failed email authentication", why: "spf=fail and dmarc=fail mean the sending server isn't authorised for that domain, and there's no DKIM signature. Strong technical red flag." },
  greeting: { ind: true, label: "Generic greeting", why: "‘Dear Staff’ instead of your name. Weak on its own, but it adds up with the other signs." },
  threat: { ind: true, label: "Threat of losing salary", why: "Threatening something you care about (your salary) is a classic social-engineering lever." },
  link: { ind: true, label: "Link text and real destination don't match", why: "It shows portal.kora-mfb.com but actually points to kora-mfb.verify-login.xyz over plain http. Always check where a link really goes." },
  creds: { ind: true, label: "Asks for password and BVN", why: "No legitimate IT team asks for your password, and BVN requests by email are a common fraud pattern in Nigeria." },
  attach: { ind: true, label: "HTML attachment", why: "An .html attachment can open a fake login page locally, bypassing link scanners. Unusual for a payroll notice." },
  to: { ind: false, why: "Sending to an all-staff list is normal for internal announcements." },
  date: { ind: false, why: "An early-morning timestamp alone isn't suspicious." },
  body1: { ind: false, why: "Mentioning a real event (October salary run) is normal. Attackers do copy real context, though, so don't trust it either." },
  sig: { ind: false, why: "A signature with an address looks official but proves nothing either way; it's easy to copy." },
  footer: { ind: false, why: "A standard confidentiality footer. Normal on most corporate emails." },
};
export const PHISH_KEYS = Object.keys(PHISH) as PhishKey[];
export const PHISH_INDICATORS = PHISH_KEYS.filter((k) => PHISH[k].ind);
export const PHISH_MAX_HINTS = 3;
export const PHISH_HINTS: { keys: PhishKey[]; t: string }[] = [
  { keys: ["auth", "replyto", "from"], t: "Expand the headers. Compare the sender's domain with the bank's real one, kora-mfb.com, and read the Authentication-Results line." },
  { keys: ["link"], t: "Tap the blue button in the email to see where it really goes." },
  { keys: ["creds", "attach"], t: "What is the email asking you to hand over or open?" },
  { keys: ["subject", "threat", "greeting"], t: "Read it like a stranger: how does the tone try to make you feel?" },
];
export type PhishDecision = "a" | "b" | "c" | "d";
export const PHISH_DECISIONS: [PhishDecision, string][] = [
  ["a", "Click the link quickly to check if the page looks real"],
  ["b", "Reply to the email asking if it's legitimate"],
  ["c", "Report it to the security team, block the sender domain, and check who clicked or entered details"],
  ["d", "Just delete it and say nothing"],
];
export const PHISH_DECISION_FEEDBACK: Record<PhishDecision, string> = {
  a: "Never click to ‘check’. That can load malware or capture credentials. Inspect safely instead.",
  b: "Replying goes to the attacker's Gmail (see Reply-To). They'll happily say it's real.",
  c: "Correct. Report, contain (block the domain), and find out if anyone already clicked so their passwords can be reset.",
  d: "Deleting protects you, but half the office got it. Someone may click; the security team needs to know.",
};
export const phishFalseFlagLabel = (k: PhishKey) => (k === "body1" ? "Salary update sentence" : k[0].toUpperCase() + k.slice(1));

/* ---------------- 2. Data analysis ---------------- */
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
export const ITEMS = ["Jollof rice", "Shawarma", "Zobo", "Puff-puff"];
/** Units sold per month (rows) per item (columns), as Mama Tolu sent it, typo included. */
export const RAW_SALES: readonly (readonly number[])[] = [[420, 310, 260, 380], [450, 330, 280, 360], [470, 300, 340, 350], [160, 120, 110, 140], [480, 3400, 390, 370], [510, 360, 450, 390]];
/** The suspicious cell (May, Shawarma) and its corrected value. */
export const TYPO_CELL = { r: 4, c: 1, fixed: 340 } as const;
export type SalesTable = number[][];
export const rawSales = (): SalesTable => RAW_SALES.map((r) => r.slice());
export const cleanSales = (): SalesTable => {
  const d = rawSales();
  d[TYPO_CELL.r][TYPO_CELL.c] = TYPO_CELL.fixed;
  return d;
};
export const total = (data: SalesTable, c: number) => data.reduce((s, r) => s + r[c], 0);
export const growth = (data: SalesTable, c: number) => Math.round(((data[5][c] - data[0][c]) / data[0][c]) * 100);

export type ChartKind = "line" | "bar" | "pie" | "table";
export const CHART_KINDS: [ChartKind, string][] = [["line", "Line chart"], ["bar", "Bar chart of totals"], ["pie", "Pie chart"], ["table", "Plain table"]];
export const CHART_WHY: Record<ChartKind, string> = {
  line: "A line chart shows change over time at a glance: the steady climb and the April dip are obvious.",
  bar: "This bar chart compares totals across items, which doesn't answer the month-by-month question.",
  pie: "Pie charts show parts of a whole, not trends. Months as slices hide the climb.",
  table: "Accurate, but she'd have to read every number to see the trend.",
};

export interface DataOption { t: string; ok: boolean }
export type DataStep =
  | { type: "cell"; q: string; hint: string; fb: string }
  | { type: "mcq"; q: string; hint: string; opts: DataOption[]; fb: string }
  | { type: "chart"; q: string; hint: string };

/** The six data questions, worded against the cleaned table (the typo is fixed in step 1). */
export function dataSteps(data: SalesTable = cleanSales()): DataStep[] {
  const totals = ITEMS.map((_, i) => total(data, i));
  const growths = ITEMS.map((_, i) => growth(data, i));
  return [
    { type: "cell", q: "Before analysing anything: one value looks wrong. Tap the suspicious cell in the table.", hint: "Scan each column. Is any number roughly 10× its neighbours?",
      fb: "Shawarma in May reads 3,400, about 10× every other month. Almost certainly a typo for 340. A real analyst confirms with the source; Mama Tolu confirmed it, so it's corrected to 340." },
    { type: "mcq", q: "Which item sold the most units from January to June?", hint: "Use the Σ Totals button under the table.",
      opts: ITEMS.map((n, i) => ({ t: n, ok: totals[i] === Math.max(...totals) })),
      fb: `Jollof rice: ${totals[0]} units. Totals: ${ITEMS.map((n, i) => `${n} ${totals[i]}`).join(", ")}.` },
    { type: "mcq", q: "Which item grew the most between January and June (in percentage)?", hint: "Growth % = (June − January) ÷ January × 100.",
      opts: ITEMS.map((n, i) => ({ t: n, ok: growths[i] === Math.max(...growths) })),
      fb: `Zobo grew ${growths[2]}% (260 → 450). Jollof ${growths[0]}%, Shawarma ${growths[1]}%, Puff-puff ${growths[3]}%.` },
    { type: "mcq", q: "Every item dropped sharply in April. What's the best next step?", hint: "Open ‘Context’ above the table.",
      opts: [
        { t: "The food quality fell. Change the cook", ok: false },
        { t: "Check the context: April was mostly semester break, so fewer students were on campus. Confirm before concluding", ok: true },
        { t: "Delete April. It's ruining the average", ok: false },
        { t: "Ignore it. Dips happen", ok: false }],
      fb: "Good analysts look for context before blaming. The academic calendar explains the dip; deleting data would hide a real pattern." },
    { type: "chart", q: "Mama Tolu wants to see how Zobo sales changed month by month. Pick the best chart.", hint: "Which chart type is made for change over time?" },
    { type: "mcq", q: "What should you recommend to Mama Tolu?", hint: "Base it on the strongest pattern you found, with a number.",
      opts: [
        { t: "Shawarma is the best seller. Make more shawarma", ok: false },
        { t: `Zobo demand rose ${growths[2]}% since January. Stock more and try a jollof + zobo combo`, ok: true },
        { t: "Stop selling puff-puff", ok: false },
        { t: "Raise all prices by 20%", ok: false }],
      fb: "A strong recommendation names the finding, the number, and a concrete action. The data says nothing about prices, and puff-puff is steady, not failing." },
  ];
}
/** The pick that answers each data step: "r,c" for the cell, an option index, or a chart kind. */
export function dataPickIsCorrect(step: DataStep, pick: string): boolean {
  if (step.type === "cell") return pick === `${TYPO_CELL.r},${TYPO_CELL.c}`;
  if (step.type === "chart") return pick === "line";
  const i = Number(pick);
  return Number.isInteger(i) && !!step.opts[i]?.ok;
}

/* ---------------- 3. UI/UX usability audit ---------------- */
export type UxKey = "contrast" | "icons" | "jargon" | "error" | "placeholder" | "tap" | "buttons";
export type UxOkKey = "logo" | "course" | "fee" | "nav";
export interface UxProblem { label: string; why: string; fixes: [string, boolean][] }

export const UX: Record<UxKey, UxProblem> = {
  contrast: { label: "Low-contrast heading", why: "Pale grey on white fails WCAG contrast (needs 4.5:1 for text). Hard to read in sunlight on a cheap screen.", fixes: [["Make it darker (e.g. #1f2937) so contrast is at least 4.5:1", true], ["Make the font bigger but keep the colour", false], ["Add a drop shadow", false]] },
  icons: { label: "Icon-only buttons with no labels", why: "Nobody can tell what ⟲ ✎ ⊘ do. Guessing on a registration form is scary.", fixes: [["Add short text labels (Reset, Edit, Drop course)", true], ["Make the icons bigger", false], ["Explain them in the FAQ page", false]] },
  jargon: { label: "Jargon label", why: "‘Input matric identifier’ is system-speak. Students say ‘matric number’.", fixes: [["Rename to ‘Matric number’ with an example: e.g. CSC/19/1234", true], ["Keep it; users will learn", false], ["Hide the label to save space", false]] },
  error: { label: "Error with no message", why: "The field turns red but never says what's wrong or how to fix it. Colour alone also fails colour-blind users.", fixes: [["Show a plain message under the field: ‘Units must be 24 or less. You have 26.’", true], ["Make the red brighter", false], ["Show an alert popup after submit", false]] },
  placeholder: { label: "Placeholder used as label", why: "The hint text disappears when you start typing, so you forget what the field was for.", fixes: [["Use a visible label above the field; keep the placeholder as an example", true], ["Make the placeholder darker", false], ["Remove the field", false]] },
  tap: { label: "Tiny tap target", why: "A 12px checkbox is hard to hit with a thumb. Aim for at least 44×44px.", fixes: [["Make the whole line tappable, at least 44px tall", true], ["Zoom out the page", false], ["Pre-tick it for the user", false]] },
  buttons: { label: "Destructive and primary actions look identical", why: "‘Clear all’ wipes the form and sits right next to ‘Submit’, styled the same. One mis-tap loses everything.", fixes: [["Make Submit the clear primary button; make Clear all a quiet text link with an undo or confirm", true], ["Swap their positions", false], ["Make both buttons red", false]] },
};
export const UX_KEYS = Object.keys(UX) as UxKey[];
export const UX_OK: Record<UxOkKey, string> = {
  logo: "The header logo and name are clear. Fine.",
  course: "Course rows show code, title and units clearly. This part works.",
  fee: "Fee status is visible and labelled. Good.",
  nav: "Back link is clear and placed where people expect it.",
};
export const uxBestFix = (k: UxKey) => UX[k].fixes.findIndex((f) => f[1]);

/* ---------------- 4. Product prioritisation ---------------- */
export type FeatId = "A" | "B" | "C" | "D" | "E" | "F";
export interface Feature { id: FeatId; t: string; r: number; i: number; c: number; e: number }
export const FEATS: Feature[] = [
  { id: "E", t: "Fix checkout crash on older Android phones", r: 600, i: 3, c: 100, e: 1 },
  { id: "A", t: "Pay on delivery (cash or transfer)", r: 800, i: 3, c: 80, e: 2 },
  { id: "B", t: "Live order tracking on a map", r: 1000, i: 2, c: 80, e: 4 },
  { id: "C", t: "Dark mode", r: 300, i: 0.5, c: 100, e: 1 },
  { id: "D", t: "Group ordering for hostel rooms", r: 400, i: 2, c: 50, e: 3 },
  { id: "F", t: "Loyalty points", r: 500, i: 1, c: 50, e: 3 },
];
export const FEAT_START_ORDER: FeatId[] = ["B", "F", "C", "A", "D", "E"];
export const featById = (id: FeatId) => FEATS.find((f) => f.id === id)!;
export const rice = (f: Feature) => Math.round((f.r * f.i * (f.c / 100)) / f.e);
export const IDEAL_ORDER: FeatId[] = FEATS.slice().sort((a, b) => rice(b) - rice(a)).map((f) => f.id);

/* ---------------- 5/6. Decision sims: cloud + marketing ---------------- */
/** [option text, is it the right call, feedback] */
export type DecisionOption = [string, boolean, string];
export interface DecisionStep { q: string; o: DecisionOption[] }

export const CLOUD_STEPS: DecisionStep[] = [
  { q: "Where should the voting app run?", o: [
    ["One laptop in the computer lab", false, "If it sleeps, crashes or the power goes, the election stops."],
    ["A single small virtual machine", false, "Cheap, but a single point of failure. If it dies at peak time, nobody votes."],
    ["Two or more app instances behind a load balancer, with auto-scaling", true, "Traffic spreads across instances, one can fail without downtime, and capacity grows at peak."],
    ["One huge dedicated server", false, "Expensive and still a single point of failure."]] },
  { q: "Where do the votes get stored?", o: [
    ["JSON files on the app server's disk", false, "Lost if that instance dies, and multiple instances would write conflicting files."],
    ["A managed relational database with automated backups and a standby", true, "Transactions keep votes consistent; backups and a standby protect against loss."],
    ["A shared Google Sheet", false, "Not built for thousands of concurrent writes, and hard to secure."],
    ["An in-memory cache only", false, "Fast, but a restart wipes every vote."]] },
  { q: "How should candidate photos, CSS and scripts be served?", o: [
    ["From object storage behind a CDN", true, "Static files load fast from edge locations and take load off your app servers."],
    ["Stored inside the database", false, "Slows the database that's busy counting votes."],
    ["From each app server's disk", false, "Works, but wastes app capacity at peak and is harder to keep in sync."],
    ["Emailed to students beforehand", false, "Creative, but no."]] },
  { q: "How do you lock it down?", o: [
    ["HTTPS everywhere; database in a private subnet; only the load balancer is public", true, "Least exposure: attackers can't even reach the database directly."],
    ["Give the database a public IP so you can debug from your phone", false, "Exposes your most sensitive data to the whole internet."],
    ["Open all ports during the election, close them after", false, "The election is exactly when attackers will try."],
    ["Use the default admin password, it's only 6 hours", false, "Default credentials are the first thing attackers try."]] },
  { q: "How do you keep costs under control?", o: [
    ["Auto-scale up for the voting window and back down after; set a billing alert", true, "Pay for big capacity only when you need it, and get warned before surprises."],
    ["Keep the maximum size running all month to be safe", false, "Safe but wasteful: you pay for idle machines 29 days out of 30."],
    ["Pick the cheapest tier for everything", false, "May fall over at peak. Cheap until it costs you the election."],
    ["Don't monitor; check the bill next month", false, "Bills can run away silently. Always set alerts."]] },
];

export const MARKETING_STEPS: DecisionStep[] = [
  { q: "Who is the target audience?", o: [
    ["Everyone in Nigeria", false, "Too broad for ₦50k. You'd reach nobody properly."],
    ["Students on campus, 17–25, who buy drinks and snacks between lectures", true, "Specific, reachable and matches where the product is sold."],
    ["Lecturers only", false, "A small slice, and not the main buyers."],
    ["Buyers abroad", false, "Zobo by Tolu delivers on campus. Wrong market."]] },
  { q: "Pick the campaign goal.", o: [
    ["Go viral", false, "Not measurable. Views don't equal customers."],
    ["Get 300 first-time orders in 4 weeks, tracked with a promo code", true, "Specific, measurable, time-bound (SMART). You'll know if it worked."],
    ["Get lots of likes", false, "Likes are vanity metrics without orders."],
    ["Be the best drinks brand", false, "Nice dream, impossible to measure."]] },
  { q: "Which channels fit ₦50,000?", o: [
    ["A TV advert", false, "Way beyond budget, and wrong audience targeting."],
    ["WhatsApp status, Instagram/TikTok short videos, and hostel campus ambassadors", true, "Cheap, where students already are, and ambassadors build trust."],
    ["A billboard in Lagos", false, "Expensive and nowhere near your campus customers."],
    ["Newspaper ads", false, "Students rarely read print newspapers."]] },
  { q: "Which headline will convert best?", o: [
    ["“Zobo by Tolu: Quality You Can Trust”", false, "Generic. Says nothing about why to buy now."],
    ["“Cold zobo, ₦300, delivered to your hostel in 15 mins. First order? Code FRESH”", true, "Concrete benefit, price, speed and a trackable offer."],
    ["“We are the best zobo in Africa”", false, "Unprovable claim, no call to action."],
    ["“Drink zobo”", false, "Clear, but no reason or offer."]] },
  { q: "How will you measure success?", o: [
    ["Count new followers", false, "Followers aren't customers."],
    ["Track promo-code orders per channel and compare cost per new customer every week", true, "Shows which channel is worth the money, so you can shift budget mid-campaign."],
    ["Ask friends if they saw it", false, "Biased, tiny sample."],
    ["Just post consistently and hope", false, "Hope isn't a strategy."]] },
];
export const DECISION_STEPS = { cloud: CLOUD_STEPS, marketing: MARKETING_STEPS } as const;
export type DecisionSimId = keyof typeof DECISION_STEPS;
/** The right option's text for each step: what the student ends up choosing. */
export const decisionPicks = (steps: DecisionStep[]) => steps.map((s) => s.o.find((o) => o[1])![0]);
