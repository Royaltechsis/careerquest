/* CareerQuest content: careers, roadmaps, quiz. Shared by the server (validation, public pages) and the client. */
import type { CareerData, QuizQuestion } from "./types";

export const CQ_DATA: CareerData = (function (): CareerData {
  const categories = [
    { id: "security", name: "Security", icon: "shield" },
    { id: "data", name: "Data & AI", icon: "chart" },
    { id: "design", name: "Design", icon: "pen" },
    { id: "engineering", name: "Engineering", icon: "code" },
    { id: "business", name: "Business & Product", icon: "compass" },
    { id: "comms", name: "Marketing & Comms", icon: "mega" }
  ];

  const careers = [
    {
      id: "cybersecurity", name: "Cybersecurity Analyst", cat: "security", color: "#0E7C66",
      tagline: "Protect people and systems from attacks.",
      what: "Security analysts watch an organisation's systems for threats, investigate suspicious activity, respond to incidents and help close the gaps attackers use. Banks, fintechs, telcos and government agencies all need them.",
      day: ["Triage alerts in a SIEM and decide what is real", "Investigate phishing emails reported by staff", "Check systems for missing patches and weak settings", "Write short incident reports and recommendations", "Run security awareness sessions for non-technical staff"],
      skills: ["Networking basics (TCP/IP, DNS, HTTP)", "Linux & Windows command line", "Log analysis", "Threat & phishing analysis", "Clear incident writing"],
      tools: ["Wireshark", "Splunk or Elastic (SIEM)", "Nmap", "Burp Suite", "VirusTotal", "Kali Linux"],
      entry: ["SOC Analyst (Tier 1)", "IT Support with security duties", "Security intern / SIWES placement"],
      path: ["SOC Analyst", "Incident Responder or Penetration Tester", "Security Engineer", "Security Architect / Manager"],
      routes: ["Start with networking + Linux, then a structured lab platform like TryHackMe", "Free videos from Professor Messer for Security+ topics", "Cisco Networking Academy courses", "Capture-the-flag (CTF) events and campus security clubs"],
      projects: ["Home lab: a Linux VM with logging, attack it and write what you saw", "Phishing analysis write-up with screenshots of headers", "Nmap scan + hardening report on your own VM", "A CTF write-up blog"],
      certs: ["CompTIA Security+", "ISC2 Certified in Cybersecurity (CC)", "Google Cybersecurity Certificate", "eJPT (junior penetration tester)"],
      traits: ["investigate", "systems", "detail"],
      roadmap: true, sim: "phishing"
    },
    {
      id: "data-analysis", name: "Data Analyst", cat: "data", color: "#2E5AAC",
      tagline: "Turn messy numbers into decisions.",
      what: "Data analysts collect, clean and explore data, then explain what it means so teams can decide what to do. Every sector with records, from retail to health to fintech, hires them.",
      day: ["Pull data with SQL from a company database", "Clean spreadsheets: fix blanks, duplicates and typos", "Build dashboards that managers check every week", "Answer questions like ‘why did sales drop in March?’", "Present findings in plain language"],
      skills: ["Spreadsheets (formulas, pivot tables)", "SQL", "Data cleaning", "Charts & dashboards", "Basic statistics", "Storytelling with data"],
      tools: ["Excel / Google Sheets", "SQL (PostgreSQL, MySQL)", "Power BI or Tableau", "Python with pandas (later)"],
      entry: ["Junior Data Analyst", "Business Intelligence intern", "Reporting / MIS Officer"],
      path: ["Data Analyst", "Senior Analyst / Analytics Engineer", "Data Scientist or Analytics Manager", "Head of Data"],
      routes: ["Spreadsheet skills first, then SQL (SQLBolt is free and short)", "Kaggle Learn micro-courses and public datasets", "Google Data Analytics Certificate", "Nigeria's 3MTT programme and ALX run data tracks"],
      projects: ["Clean and analyse a public dataset (e.g. Nigerian fuel prices or exam results) and publish a dashboard", "SQL case study answering 5 business questions", "A one-page insight report for a small local business"],
      certs: ["Google Data Analytics Certificate", "Microsoft Power BI Data Analyst (PL-300)", "Tableau Desktop Specialist"],
      traits: ["numbers", "investigate", "detail"],
      roadmap: true, sim: "data"
    },
    {
      id: "ui-ux", name: "UI/UX Designer", cat: "design", color: "#B4458A",
      tagline: "Make products easy and pleasant to use.",
      what: "UX designers research how people use a product and design flows that make sense; UI designers shape how each screen looks. Many roles mix both. They work closely with developers and product managers.",
      day: ["Interview users and watch them try a product", "Sketch flows and wireframes", "Design high-fidelity screens in Figma", "Run usability tests and fix what confuses people", "Hand designs to developers with clear specs"],
      skills: ["User research & interviews", "Information architecture", "Wireframing & prototyping", "Visual design (type, colour, layout)", "Accessibility", "Usability testing"],
      tools: ["Figma", "FigJam / Miro", "Maze or simple test scripts", "Notion for research notes"],
      entry: ["Junior Product Designer", "UI Designer", "Design intern"],
      path: ["Product Designer", "Senior Designer", "Lead / Design Manager or UX Researcher", "Head of Design"],
      routes: ["Learn the basics free: Laws of UX, NN/g articles, Figma's own tutorials", "Google UX Design Certificate", "Redesign apps you use daily and test with classmates"],
      projects: ["Case study: redesign a confusing campus portal screen (research → test → result)", "Accessibility audit of a popular local app", "A mobile app concept with a tested prototype"],
      certs: ["Google UX Design Certificate", "A strong case-study portfolio matters more than any certificate"],
      traits: ["create", "people", "detail"],
      roadmap: true, sim: "uiux"
    },
    {
      id: "software-dev", name: "Software Developer", cat: "engineering", color: "#6A4BC4",
      tagline: "Build the apps and systems people rely on.",
      what: "Developers write, test and maintain code for websites, mobile apps and backend systems. Most specialise in frontend, backend, mobile or full-stack, and work in teams using version control and code review.",
      day: ["Turn a feature request into working code", "Review teammates' pull requests", "Fix bugs reported by users", "Write tests so changes don't break things", "Discuss trade-offs in stand-ups and planning"],
      skills: ["One language deeply (JavaScript, Python, Java…)", "Git & GitHub", "Data structures & problem solving", "APIs & databases", "Testing & debugging"],
      tools: ["VS Code", "Git", "React / Next.js", "Node.js or Django", "PostgreSQL", "Postman"],
      entry: ["Junior / Graduate Developer", "Frontend or Backend intern", "Freelance builds for small businesses"],
      path: ["Software Engineer", "Senior Engineer", "Staff Engineer or Engineering Manager", "CTO / Principal"],
      routes: ["freeCodeCamp or The Odin Project for structured, free practice", "MDN Web Docs as your reference", "Contribute to open source and ship small real projects"],
      projects: ["A full-stack app with auth and a database, deployed", "An API with tests and docs", "A tool that solves a real campus problem"],
      certs: ["Mostly optional; a GitHub with shipped projects counts most", "AWS Certified Developer – Associate (for cloud-heavy roles)"],
      traits: ["build", "systems", "numbers"],
      roadmap: false, sim: null
    },
    {
      id: "product-management", name: "Product Manager", cat: "business", color: "#C2571A",
      tagline: "Decide what to build, and why.",
      what: "Product managers figure out which problems are worth solving, set priorities, and keep designers, engineers and the business aligned. They own outcomes, not code or pixels.",
      day: ["Talk to users and read feedback", "Prioritise the roadmap and backlog", "Write clear requirements (user stories)", "Run planning with engineering and design", "Track metrics after launch"],
      skills: ["User empathy & discovery", "Prioritisation frameworks (RICE, MoSCoW)", "Clear writing", "Basic data analysis", "Stakeholder communication"],
      tools: ["Jira or Linear", "Notion / Confluence", "Figma (reading designs)", "Analytics tools (e.g. Mixpanel, GA4)"],
      entry: ["Associate Product Manager", "Product Analyst", "Project / Operations Associate moving into product"],
      path: ["Product Manager", "Senior PM", "Group PM / Director of Product", "VP Product / CPO"],
      routes: ["Read ‘Inspired’ by Marty Cagan", "Practise writing PRDs for apps you use", "Many PMs start in engineering, design, support or analysis first"],
      projects: ["A product teardown of a Nigerian fintech app with 3 improvement ideas", "A PRD + prioritised roadmap for a campus app", "Run a small user survey and summarise insights"],
      certs: ["Professional Scrum Product Owner (PSPO I)", "Certified Scrum Product Owner (CSPO)"],
      traits: ["people", "lead", "investigate"],
      roadmap: false, sim: "product"
    },
    {
      id: "digital-marketing", name: "Digital Marketer", cat: "comms", color: "#D1345B",
      tagline: "Help the right people find a product.",
      what: "Digital marketers plan and run campaigns across social media, search, email and content, then measure what works. Small businesses and big brands both need people who can grow an audience on a budget.",
      day: ["Plan a content calendar", "Write ad copy and captions", "Set up and monitor paid ads", "Read analytics and adjust campaigns", "Report results to clients or managers"],
      skills: ["Copywriting", "Social media strategy", "SEO basics", "Paid ads", "Email marketing", "Analytics"],
      tools: ["Meta Ads Manager", "Google Ads", "Google Analytics (GA4)", "Canva", "Mailchimp or Brevo", "Buffer"],
      entry: ["Social Media Manager", "Marketing Assistant", "Content Creator / Copywriter"],
      path: ["Digital Marketing Specialist", "Growth or Performance Marketer", "Marketing Manager", "Head of Growth / CMO"],
      routes: ["Google Skillshop and HubSpot Academy (free)", "Grow a page for a real campus business", "Learn to read analytics, not just post"],
      projects: ["A 30-day campaign for a student business with results", "A content calendar + brand voice guide", "An A/B test write-up on two ad versions"],
      certs: ["Google Ads certifications (Skillshop)", "HubSpot Content / Inbound Marketing", "Google Analytics Certification"],
      traits: ["create", "people", "numbers"],
      roadmap: false, sim: "marketing"
    },
    {
      id: "cloud", name: "Cloud Engineer", cat: "engineering", color: "#1F7FA3",
      tagline: "Keep apps running, fast and at scale.",
      what: "Cloud engineers design and run the infrastructure apps live on: servers, databases, networks and automation on platforms like AWS, Azure and Google Cloud. Closely related to DevOps.",
      day: ["Set up servers, storage and databases", "Automate deployments (CI/CD)", "Monitor uptime and costs", "Fix outages and performance problems", "Write infrastructure as code"],
      skills: ["Linux", "Networking", "One cloud platform", "Scripting (Bash/Python)", "Containers (Docker)", "Infrastructure as code"],
      tools: ["AWS / Azure / Google Cloud", "Docker", "Terraform", "GitHub Actions", "Kubernetes (later)"],
      entry: ["Cloud Support Associate", "Junior DevOps Engineer", "IT / SysAdmin intern"],
      path: ["Cloud Engineer", "Senior Cloud / DevOps Engineer", "Solutions Architect or SRE", "Head of Infrastructure"],
      routes: ["AWS Skill Builder and Microsoft Learn (free)", "Deploy your own projects on free tiers", "Learn Linux and networking first"],
      projects: ["Deploy a web app with CI/CD and a custom domain", "A Terraform script that builds a small environment", "A monitoring dashboard for your app"],
      certs: ["AWS Certified Cloud Practitioner", "AWS Solutions Architect – Associate", "Microsoft Azure Fundamentals (AZ-900)", "Google Associate Cloud Engineer"],
      traits: ["systems", "build", "detail"],
      roadmap: false, sim: "cloud"
    },
    {
      id: "ml-engineer", name: "AI / ML Engineer", cat: "data", color: "#3D7A2A",
      tagline: "Teach computers to learn from data.",
      what: "ML engineers build, train and deploy models that make predictions, such as fraud detection, recommendations or language tools, and put them into real products.",
      day: ["Prepare and label training data", "Train and evaluate models", "Deploy models behind an API", "Monitor models for drift and bias", "Read papers and test new methods"],
      skills: ["Python", "Statistics & linear algebra", "Machine learning fundamentals", "Data wrangling", "Model deployment", "Responsible AI"],
      tools: ["Python, NumPy, pandas", "scikit-learn", "PyTorch or TensorFlow", "Jupyter", "Hugging Face"],
      entry: ["Junior ML Engineer", "Data Scientist (entry)", "AI research intern"],
      path: ["ML Engineer", "Senior ML Engineer", "ML Lead / Applied Scientist", "Head of AI"],
      routes: ["Strong Python + maths first", "Kaggle Learn and competitions", "Andrew Ng's Machine Learning Specialization", "Data Science Nigeria community programmes"],
      projects: ["A model trained on a local dataset with an honest evaluation", "A deployed demo (e.g. Yoruba/Hausa text classifier)", "A bias check write-up on a model"],
      certs: ["AWS Certified Machine Learning Engineer – Associate", "Mostly portfolio and projects"],
      traits: ["numbers", "build", "investigate"],
      roadmap: false, sim: null
    },
    {
      id: "business-analyst", name: "Business Analyst", cat: "business", color: "#8A6D1F",
      tagline: "Bridge business needs and tech solutions.",
      what: "Business analysts study how an organisation works, find problems and write clear requirements so tech teams build the right thing. Common in banks, consulting and large companies.",
      day: ["Interview stakeholders about a process", "Map current and future workflows", "Write requirements and acceptance criteria", "Test that delivered features meet needs", "Present recommendations"],
      skills: ["Requirements gathering", "Process mapping", "Stakeholder interviews", "Excel & basic SQL", "Clear documentation"],
      tools: ["Excel", "Visio / draw.io", "Jira", "Confluence", "Power BI"],
      entry: ["Junior Business Analyst", "Operations Analyst", "Graduate trainee (banks, consulting)"],
      path: ["Business Analyst", "Senior BA", "Product Manager or BA Lead", "Head of Business Analysis"],
      routes: ["Learn process mapping and requirement writing", "Practise on a real campus process (e.g. course registration)", "Graduate trainee programmes at banks and consulting firms"],
      projects: ["Map and improve a campus process with a before/after diagram", "Requirements doc for a small app", "Cost-benefit analysis of a tool"],
      certs: ["IIBA Entry Certificate in Business Analysis (ECBA)"],
      traits: ["people", "investigate", "detail"],
      roadmap: false, sim: null
    },
    {
      id: "tech-writer", name: "Technical Writer", cat: "comms", color: "#5A6270",
      tagline: "Explain complex things simply.",
      what: "Technical writers create documentation, guides and help articles so people can use software and products. Developer docs writers sit close to engineering teams.",
      day: ["Interview engineers about a new feature", "Write and update docs and tutorials", "Test the steps themselves", "Edit for clarity and consistency", "Maintain a style guide"],
      skills: ["Clear, concise writing", "Learning technical topics fast", "Information structure", "Markdown & docs tools", "Basic coding literacy"],
      tools: ["Markdown", "Git & GitHub", "Docusaurus / GitBook", "Google Docs", "Screenshot & diagram tools"],
      entry: ["Junior Technical Writer", "Documentation intern", "Developer advocate (content)"],
      path: ["Technical Writer", "Senior Writer", "Docs Lead / Content Strategist", "Head of Documentation"],
      routes: ["Google's free Technical Writing courses", "Write docs for an open-source project", "Start a blog explaining what you learn"],
      projects: ["Rewrite a confusing README into a great one", "A getting-started tutorial for an API", "A docs site for your own project"],
      certs: ["No standard certificate; writing samples matter most"],
      traits: ["create", "detail", "people"],
      roadmap: false, sim: null
    }
  ];

  // Roadmaps: stages -> items. type: learn | tool | challenge | project | milestone
  const roadmaps = {
    cybersecurity: {
      intro: "From zero to job-ready SOC analyst. Go at your pace; every stage ends with proof you can show.",
      stages: [
        { title: "Foundations", sub: "How computers talk", items: [
          { id: "c1", t: "Learn how networks work: IP addresses, ports, DNS, HTTP", type: "learn" },
          { id: "c2", t: "Get comfortable on the Linux command line (navigate, files, permissions)", type: "learn" },
          { id: "c3", t: "Play OverTheWire Bandit levels 0–10", type: "tool" },
          { id: "c4", t: "Understand the CIA triad: confidentiality, integrity, availability", type: "learn" } ] },
        { title: "Core security", sub: "Think like an attacker", items: [
          { id: "c5", t: "Learn common attacks: phishing, malware, password attacks, social engineering", type: "learn" },
          { id: "c6", t: "Complete the Phishing Investigation simulation", type: "challenge", sim: "phishing" },
          { id: "c7", t: "Capture and read traffic with Wireshark", type: "tool" },
          { id: "c8", t: "Scan your own VM with Nmap and explain each open port", type: "tool" } ] },
        { title: "Defend & detect", sub: "Life in a SOC", items: [
          { id: "c9", t: "Learn what a SIEM does; search logs in Splunk or Elastic (free training)", type: "tool" },
          { id: "c10", t: "Learn the incident response steps: prepare, detect, contain, eradicate, recover, learn", type: "learn" },
          { id: "c11", t: "Build a home lab: one Linux VM with logging turned on", type: "project" },
          { id: "c12", t: "Map an attack to MITRE ATT&CK techniques", type: "learn" } ] },
        { title: "Prove it", sub: "Portfolio + credentials", items: [
          { id: "c13", t: "Write up your phishing analysis as a portfolio piece", type: "project" },
          { id: "c14", t: "Join a CTF event (solo or with a campus club)", type: "challenge" },
          { id: "c15", t: "Study for CompTIA Security+ or ISC2 CC", type: "learn" } ] },
        { title: "Job-ready", sub: "Get in the door", items: [
          { id: "c16", t: "Portfolio has 2+ write-ups and a home-lab project", type: "milestone" },
          { id: "c17", t: "CV tailored for SOC Analyst / SIWES security roles", type: "milestone" },
          { id: "c18", t: "Apply to 5 SOC, IT support or security internship roles", type: "milestone" } ] }
      ]
    },
    "data-analysis": {
      intro: "From spreadsheets to dashboards that change decisions.",
      stages: [
        { title: "Foundations", sub: "Spreadsheets first", items: [
          { id: "d1", t: "Master spreadsheet basics: SUM, AVERAGE, IF, VLOOKUP/XLOOKUP", type: "learn" },
          { id: "d2", t: "Build your first pivot table", type: "tool" },
          { id: "d3", t: "Learn mean, median, mode and why outliers matter", type: "learn" },
          { id: "d4", t: "Find a public dataset you actually care about", type: "learn" } ] },
        { title: "Clean & explore", sub: "80% of the job", items: [
          { id: "d5", t: "Complete the Data Analysis simulation", type: "challenge", sim: "data" },
          { id: "d6", t: "Clean a messy dataset: blanks, duplicates, typos, wrong types", type: "project" },
          { id: "d7", t: "Learn which chart fits which question (trend, comparison, part-of-whole)", type: "learn" } ] },
        { title: "SQL", sub: "Talk to databases", items: [
          { id: "d8", t: "SELECT, WHERE, ORDER BY, GROUP BY (SQLBolt lessons 1–12)", type: "learn" },
          { id: "d9", t: "JOINs: combine two tables", type: "learn" },
          { id: "d10", t: "Answer 5 business questions with SQL on a sample database", type: "project" } ] },
        { title: "Dashboards & stories", sub: "Make it land", items: [
          { id: "d11", t: "Build a dashboard in Power BI or Tableau Public", type: "tool" },
          { id: "d12", t: "Write a one-page insight report: question, finding, recommendation", type: "project" },
          { id: "d13", t: "Present your findings to a friend in 3 minutes", type: "challenge" } ] },
        { title: "Job-ready", sub: "Get in the door", items: [
          { id: "d14", t: "Portfolio: 2 projects with clean data, SQL and a dashboard", type: "milestone" },
          { id: "d15", t: "Optional: Google Data Analytics or PL-300 certificate", type: "milestone" },
          { id: "d16", t: "Apply to 5 analyst, BI or reporting internships", type: "milestone" } ] }
      ]
    },
    "ui-ux": {
      intro: "Learn to design things people find easy, and prove it with case studies.",
      stages: [
        { title: "Foundations", sub: "See like a designer", items: [
          { id: "u1", t: "Learn the 10 usability heuristics (Nielsen Norman Group)", type: "learn" },
          { id: "u2", t: "Basics of type, colour, spacing and hierarchy", type: "learn" },
          { id: "u3", t: "Set up Figma and recreate one screen from an app you like", type: "tool" } ] },
        { title: "Research", sub: "Start with people", items: [
          { id: "u4", t: "Complete the Usability Audit simulation", type: "challenge", sim: "uiux" },
          { id: "u5", t: "Interview 3 students about a frustrating app or portal", type: "project" },
          { id: "u6", t: "Turn notes into a user persona and a journey map", type: "learn" } ] },
        { title: "Design", sub: "From sketch to screen", items: [
          { id: "u7", t: "Sketch 3 different solutions before picking one", type: "learn" },
          { id: "u8", t: "Wireframe a 4–5 screen flow", type: "tool" },
          { id: "u9", t: "Design high-fidelity screens with a simple style guide", type: "tool" },
          { id: "u10", t: "Check colour contrast and tap-target sizes (accessibility)", type: "learn" } ] },
        { title: "Test & iterate", sub: "Prove it works", items: [
          { id: "u11", t: "Build a clickable prototype", type: "tool" },
          { id: "u12", t: "Run a usability test with 5 people and log issues", type: "challenge" },
          { id: "u13", t: "Fix the top 3 issues and test again", type: "project" } ] },
        { title: "Job-ready", sub: "Get in the door", items: [
          { id: "u14", t: "Write 2 case studies: problem, research, design, results", type: "milestone" },
          { id: "u15", t: "Publish your portfolio (Behance, Dribbble or a simple site)", type: "milestone" },
          { id: "u16", t: "Apply to 5 design internships or freelance briefs", type: "milestone" } ] }
      ]
    },
    "product-management": {
      intro: "Learn to choose the right problems and lead a team to solve them.",
      stages: [
        { title: "Foundations", sub: "What PMs really do", items: [
          { id: "p1", t: "Learn the product lifecycle: discover, define, build, launch, measure", type: "learn" },
          { id: "p2", t: "Do a teardown of an app you use daily", type: "project" } ] },
        { title: "Discovery", sub: "Find real problems", items: [
          { id: "p3", t: "Interview 5 users and find patterns", type: "learn" },
          { id: "p4", t: "Write a problem statement and success metric", type: "learn" } ] },
        { title: "Prioritise & plan", sub: "Say no, kindly", items: [
          { id: "p5", t: "Complete the Feature Prioritisation simulation", type: "challenge", sim: "product" },
          { id: "p6", t: "Write a short PRD with user stories", type: "project" } ] },
        { title: "Job-ready", sub: "Get in the door", items: [
          { id: "p7", t: "Portfolio: teardown + PRD + prioritised roadmap", type: "milestone" },
          { id: "p8", t: "Apply to APM, product analyst or operations roles", type: "milestone" } ] }
      ]
    }
  };

  // Interest questionnaire: each option nudges trait scores.
  const traitCareers = {
    investigate: ["cybersecurity", "data-analysis", "business-analyst", "product-management"],
    systems: ["cybersecurity", "cloud", "software-dev"],
    detail: ["cybersecurity", "ui-ux", "tech-writer", "data-analysis"],
    numbers: ["data-analysis", "ml-engineer", "digital-marketing"],
    create: ["ui-ux", "digital-marketing", "tech-writer"],
    people: ["product-management", "business-analyst", "ui-ux", "digital-marketing"],
    build: ["software-dev", "cloud", "ml-engineer"],
    lead: ["product-management", "business-analyst"]
  };

  const quiz: QuizQuestion[] = [
    { q: "A group project lands. Which part do you grab first?", o: [
      { t: "Building the actual thing", w: { build: 2 } },
      { t: "Making it look and feel good", w: { create: 2 } },
      { t: "Organising who does what", w: { lead: 2, people: 1 } },
      { t: "Researching the facts and numbers", w: { investigate: 1, numbers: 1 } } ] },
    { q: "Which of these sounds most fun on a free afternoon?", o: [
      { t: "Solving a puzzle or escape room", w: { investigate: 2 } },
      { t: "Designing a poster or editing a video", w: { create: 2 } },
      { t: "Setting up a new gadget or fixing a laptop", w: { systems: 2 } },
      { t: "Debating ideas with friends", w: { people: 2 } } ] },
    { q: "Your phone shows ‘storage almost full’. You…", o: [
      { t: "Check exactly what's taking space, folder by folder", w: { detail: 1, investigate: 1 } },
      { t: "Write a quick script or use a tool to clean it", w: { build: 1, systems: 1 } },
      { t: "Delete stuff and move on", w: { lead: 1 } },
      { t: "Back things up to the cloud properly", w: { systems: 2 } } ] },
    { q: "Pick the sentence that sounds most like you.", o: [
      { t: "“Show me the data.”", w: { numbers: 2 } },
      { t: "“How would a real person use this?”", w: { people: 1, create: 1 } },
      { t: "“What could go wrong here?”", w: { investigate: 1, detail: 1 } },
      { t: "“Let's just build it and see.”", w: { build: 2 } } ] },
    { q: "Which course did (or would) you enjoy most?", o: [
      { t: "Statistics or maths", w: { numbers: 2 } },
      { t: "Programming", w: { build: 2 } },
      { t: "Communication or English", w: { create: 1, people: 1 } },
      { t: "Computer networks or operating systems", w: { systems: 2 } } ] },
    { q: "A friend's business isn't getting customers. You'd…", o: [
      { t: "Look at their sales records for patterns", w: { numbers: 1, investigate: 1 } },
      { t: "Redo their Instagram and posts", w: { create: 2 } },
      { t: "Ask customers what puts them off", w: { people: 2 } },
      { t: "Build them a simple website", w: { build: 2 } } ] },
    { q: "How do you feel about tiny details?", o: [
      { t: "I notice typos and misaligned things instantly", w: { detail: 2 } },
      { t: "Important, but the big picture matters more", w: { lead: 1, people: 1 } },
      { t: "I care when it breaks something", w: { systems: 1, build: 1 } },
      { t: "Numbers must be exact; words can flex", w: { numbers: 1, detail: 1 } } ] },
    { q: "Which news story would you click first?", o: [
      { t: "“Hackers steal data from big company”", w: { investigate: 2 } },
      { t: "“New AI can predict…”", w: { numbers: 1, build: 1 } },
      { t: "“The app everyone is switching to”", w: { people: 1, create: 1 } },
      { t: "“How a startup grew to 1 million users”", w: { lead: 2 } } ] },
    { q: "Your ideal work day has more…", o: [
      { t: "Deep focus alone", w: { build: 1, detail: 1 } },
      { t: "Meetings and conversations", w: { people: 2 } },
      { t: "Investigating problems as they appear", w: { investigate: 1, systems: 1 } },
      { t: "Making things and getting feedback", w: { create: 2 } } ] },
    { q: "Which result would make you proudest?", o: [
      { t: "“Your design made this so easy to use”", w: { create: 1, people: 1 } },
      { t: "“You stopped that attack before it spread”", w: { investigate: 1, systems: 1 } },
      { t: "“Your analysis changed our decision”", w: { numbers: 2 } },
      { t: "“The team shipped on time because of you”", w: { lead: 2 } } ] }
  ];

  return { categories, careers, roadmaps, quiz, traitCareers };
})();
