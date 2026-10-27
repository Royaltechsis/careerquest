/* CareerQuest simulations. Each sim: render(el, done) where done({score, summary, details, portfolio}). */
(function () {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

  /* ---------------- 1. Phishing investigation ---------------- */
  const PHISH = {
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
    footer: { ind: false, why: "A standard confidentiality footer. Normal on most corporate emails." }
  };
  const PHISH_HINTS = [
    { keys: ["auth", "replyto", "from"], t: "Expand the headers. Compare the sender's domain with the bank's real one, kora-mfb.com, and read the Authentication-Results line." },
    { keys: ["link"], t: "Tap the blue button in the email to see where it really goes." },
    { keys: ["creds", "attach"], t: "What is the email asking you to hand over or open?" },
    { keys: ["subject", "threat", "greeting"], t: "Read it like a stranger: how does the tone try to make you feel?" }
  ];

  function phishing(el, done) {
    const flagged = new Set();
    let hintsUsed = 0;
    const tok = (k, html, extra) => `<button type="button" class="tok ${extra || ""}" data-k="${k}" aria-pressed="false">${html}</button>`;
    el.innerHTML = `
      <div class="sim-brief card">
        <p class="eyebrow">Scenario</p>
        <p>You're an intern on the security team at <b>Kora Microfinance Bank</b> (fictional). Funke from HR forwarded this email: <i>“Is this real? Half the office got it.”</i></p>
        <p><b>Task 1:</b> tap every part of the email that looks suspicious. Tap again to unflag. <b>Task 2:</b> decide what to do.</p>
      </div>
      <div class="email card" aria-label="Reported email">
        <div class="email-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="email-bar-t">Inbox · Reported message</span></div>
        <div class="email-head">
          <div class="row"><span class="k">From</span> ${tok("from", `Kora MFB IT Helpdesk &lt;it-helpdesk@kora-mfb-support.com&gt;`)}</div>
          <div class="row"><span class="k">Reply-To</span> ${tok("replyto", `korahelpdesk.verify@gmail.com`)}</div>
          <div class="row"><span class="k">To</span> ${tok("to", `all-staff@kora-mfb.com`)}</div>
          <div class="row"><span class="k">Date</span> ${tok("date", `Mon, 06:42 WAT`)}</div>
          <div class="row"><span class="k">Subject</span> ${tok("subject", `<b>URGENT: Payroll account will be SUSPENDED in 2 hours</b>`)}</div>
          <details class="raw"><summary>Show raw headers</summary>
            <div class="mono">Received: from mail.kora-mfb-support.com (unknown [203.0.113.45])<br>
            ${tok("auth", `Authentication-Results: mx.kora-mfb.com; spf=fail; dkim=none; dmarc=fail`, "mono")}<br>
            Message-ID: &lt;8812.4410@mail.kora-mfb-support.com&gt;</div>
          </details>
        </div>
        <div class="email-body">
          <p>${tok("greeting", "Dear Staff,")}</p>
          <p>${tok("body1", "Our records show your payroll account failed verification during the October salary update.")}</p>
          <p>${tok("threat", "To avoid suspension of your salary, verify your account within 2 hours.")}</p>
          <p>${tok("link", `<span class="fake-btn">Verify at https://portal.kora-mfb.com/verify</span>`, "tok-link")}</p>
          <p class="reveal" id="linkReveal" hidden>🔎 Real destination: <span class="mono">http://kora-mfb.verify-login.xyz/portal</span></p>
          <p>${tok("creds", "You will need your Staff ID, password and BVN to complete verification.")}</p>
          <p>${tok("attach", `📎 Payroll_Verification.html <span class="muted">(48 KB)</span>`)}</p>
          <p>${tok("sig", "IT Helpdesk Team<br>Kora Microfinance Bank, Lagos")}</p>
          <p class="small">${tok("footer", "This email and any attachments are confidential and intended for the addressee only.")}</p>
        </div>
      </div>
      <div class="sim-actions">
        <span class="counter" aria-live="polite"><b id="flagCount">0</b> flagged</span>
        <button type="button" class="btn ghost" id="hintBtn">💡 Hint <span class="muted">(3 left)</span></button>
        <button type="button" class="btn" id="nextBtn">Next: decide →</button>
      </div>
      <p class="hint-out" id="hintOut" aria-live="polite"></p>
      <div id="step2" hidden></div>`;

    $$(".tok", el).forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.k;
      if (flagged.has(k)) flagged.delete(k); else flagged.add(k);
      const on = flagged.has(k);
      $$(`.tok[data-k="${k}"]`, el).forEach((x) => { x.classList.toggle("flagged", on); x.setAttribute("aria-pressed", on); });
      if (k === "link") $("#linkReveal", el).hidden = false;
      $("#flagCount", el).textContent = flagged.size;
    }));
    $("#hintBtn", el).addEventListener("click", () => {
      const left = PHISH_HINTS.filter((h) => h.keys.some((k) => !flagged.has(k)));
      if (hintsUsed >= 3 || !left.length) { $("#hintOut", el).textContent = left.length ? "No hints left. Trust your instincts." : "You've covered every area. Nice."; return; }
      hintsUsed++;
      $("#hintOut", el).textContent = "💡 " + left[0].t;
      if (left[0].keys.includes("auth")) $("details.raw", el).open = true;
      $("#hintBtn .muted", el).textContent = `(${3 - hintsUsed} left)`;
    });
    $("#nextBtn", el).addEventListener("click", () => {
      const s2 = $("#step2", el);
      s2.hidden = false;
      s2.innerHTML = `<div class="card"><p class="eyebrow">Task 2</p><h3>Funke asks what to do. Your call?</h3>
        <div class="choices" role="radiogroup" aria-label="Your decision">
          ${[["a", "Click the link quickly to check if the page looks real"], ["b", "Reply to the email asking if it's legitimate"], ["c", "Report it to the security team, block the sender domain, and check who clicked or entered details"], ["d", "Just delete it and say nothing"]]
            .map(([v, t]) => `<label class="choice"><input type="radio" name="dec" value="${v}"><span>${t}</span></label>`).join("")}
        </div>
        <button type="button" class="btn" id="finishBtn" disabled>Submit investigation</button></div>`;
      $$("input[name=dec]", s2).forEach((r) => r.addEventListener("change", () => { $("#finishBtn", s2).disabled = false; }));
      $("#finishBtn", s2).addEventListener("click", () => {
        const dec = $("input[name=dec]:checked", s2).value;
        const inds = Object.keys(PHISH).filter((k) => PHISH[k].ind);
        const found = inds.filter((k) => flagged.has(k));
        const fps = [...flagged].filter((k) => !PHISH[k].ind);
        const score = clamp((found.length / inds.length) * 70 - fps.length * 5 + (dec === "c" ? 30 : 0) - hintsUsed * 4);
        const decFb = {
          a: "Never click to ‘check’. That can load malware or capture credentials. Inspect safely instead.",
          b: "Replying goes to the attacker's Gmail (see Reply-To). They'll happily say it's real.",
          c: "Correct. Report, contain (block the domain), and find out if anyone already clicked so their passwords can be reset.",
          d: "Deleting protects you, but half the office got it. Someone may click; the security team needs to know."
        }[dec];
        const details = `
          <h4>Indicators (${found.length}/${inds.length} found)</h4>
          <ul class="fb-list">${inds.map((k) => `<li class="${flagged.has(k) ? "ok" : "miss"}"><b>${flagged.has(k) ? "✓" : "✗"} ${PHISH[k].label}</b><span>${PHISH[k].why}</span></li>`).join("")}</ul>
          ${fps.length ? `<h4>Flagged but normal (${fps.length})</h4><ul class="fb-list">${fps.map((k) => `<li class="fp"><b>• ${k === "body1" ? "Salary update sentence" : k[0].toUpperCase() + k.slice(1)}</b><span>${PHISH[k].why}</span></li>`).join("")}</ul>` : ""}
          <h4>Your decision</h4><p class="${dec === "c" ? "good" : "bad"}">${decFb}</p>
          ${hintsUsed ? `<p class="muted small">Hints used: ${hintsUsed} (−${hintsUsed * 4} pts)</p>` : ""}`;
        done({
          score, details,
          summary: `Found ${found.length} of ${inds.length} phishing indicators${fps.length ? `, ${fps.length} false flag${fps.length > 1 ? "s" : ""}` : ""}; ${dec === "c" ? "chose the right response" : "response needs work"}.`,
          portfolio: {
            title: "Phishing incident investigation",
            problem: "Staff at a (simulated) microfinance bank received a payroll ‘verification’ email. I had to decide if it was phishing and how to respond.",
            approach: `Analysed sender domain, Reply-To, SPF/DKIM/DMARC results, link destinations, attachments and social-engineering cues. Identified ${found.length} of ${inds.length} indicators and recommended reporting, blocking the domain and checking for compromised users.`
          }
        });
      });
      s2.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---------------- 2. Data analysis ---------------- */
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const ITEMS = ["Jollof rice", "Shawarma", "Zobo", "Puff-puff"];
  const RAW = [[420, 310, 260, 380], [450, 330, 280, 360], [470, 300, 340, 350], [160, 120, 110, 140], [480, 3400, 390, 370], [510, 360, 450, 390]];
  function dataSim(el, done) {
    const data = RAW.map((r) => r.slice());
    let fixed = false, showTotals = false, step = 0, points = 0, tries = 0;
    const total = (c) => data.reduce((s, r) => s + r[c], 0);
    const growth = (c) => Math.round(((data[5][c] - data[0][c]) / data[0][c]) * 100);
    const steps = [
      { type: "cell", q: "Before analysing anything: one value looks wrong. Tap the suspicious cell in the table.", hint: "Scan each column. Is any number roughly 10× its neighbours?" },
      { type: "mcq", q: "Which item sold the most units from January to June?", hint: "Use the Σ Totals button under the table.",
        opts: () => ITEMS.map((n, i) => ({ t: n, ok: total(i) === Math.max(...ITEMS.map((_, j) => total(j))) })),
        fb: () => `Jollof rice: ${total(0)} units. Totals: ${ITEMS.map((n, i) => `${n} ${total(i)}`).join(", ")}.` },
      { type: "mcq", q: "Which item grew the most between January and June (in percentage)?", hint: "Growth % = (June − January) ÷ January × 100.",
        opts: () => ITEMS.map((n, i) => ({ t: n, ok: growth(i) === Math.max(...ITEMS.map((_, j) => growth(j))) })),
        fb: () => `Zobo grew ${growth(2)}% (260 → 450). Jollof ${growth(0)}%, Shawarma ${growth(1)}%, Puff-puff ${growth(3)}%.` },
      { type: "mcq", q: "Every item dropped sharply in April. What's the best next step?", hint: "Open ‘Context’ above the table.",
        opts: () => [
          { t: "The food quality fell. Change the cook", ok: false },
          { t: "Check the context: April was mostly semester break, so fewer students were on campus. Confirm before concluding", ok: true },
          { t: "Delete April. It's ruining the average", ok: false },
          { t: "Ignore it. Dips happen", ok: false }],
        fb: () => "Good analysts look for context before blaming. The academic calendar explains the dip; deleting data would hide a real pattern." },
      { type: "chart", q: "Mama Tolu wants to see how Zobo sales changed month by month. Pick the best chart.", hint: "Which chart type is made for change over time?" },
      { type: "mcq", q: "What should you recommend to Mama Tolu?", hint: "Base it on the strongest pattern you found, with a number.",
        opts: () => [
          { t: "Shawarma is the best seller. Make more shawarma", ok: false },
          { t: `Zobo demand rose ${growth(2)}% since January. Stock more and try a jollof + zobo combo`, ok: true },
          { t: "Stop selling puff-puff", ok: false },
          { t: "Raise all prices by 20%", ok: false }],
        fb: () => "A strong recommendation names the finding, the number, and a concrete action. The data says nothing about prices, and puff-puff is steady, not failing." }
    ];
    const MAX = steps.length * 2;

    function table() {
      return `<div class="table-wrap"><table class="dtable"><caption>Units sold per month · Mama Tolu's Kitchen (campus canteen)</caption>
        <thead><tr><th scope="col">Month</th>${ITEMS.map((n) => `<th scope="col">${n}</th>`).join("")}</tr></thead>
        <tbody>${data.map((r, ri) => `<tr><th scope="row">${MONTHS[ri]}</th>${r.map((v, ci) => `<td><button type="button" class="cell ${fixed && ri === 4 && ci === 1 ? "fixed" : ""}" data-r="${ri}" data-c="${ci}" ${steps[step] && steps[step].type === "cell" ? "" : "tabindex='-1'"}>${v}</button></td>`).join("")}</tr>`).join("")}</tbody>
        ${showTotals ? `<tfoot><tr><th scope="row">Σ Total</th>${ITEMS.map((_, i) => `<td>${total(i)}</td>`).join("")}</tr><tr><th scope="row">Avg</th>${ITEMS.map((_, i) => `<td>${Math.round(total(i) / 6)}</td>`).join("")}</tr></tfoot>` : ""}
      </table></div>
      <div class="tools"><button type="button" class="btn ghost sm" id="totBtn" aria-pressed="${showTotals}">Σ Totals & averages</button>
      <button type="button" class="btn ghost sm" id="sortBtn">Sort months by Zobo ↓</button></div>`;
    }
    function chartSvg(kind) {
      const vals = data.map((r) => r[2]); const max = 500, W = 300, H = 150, P = 28;
      const x = (i) => P + i * ((W - P - 10) / 5), y = (v) => H - 20 - (v / max) * (H - 40);
      if (kind === "line") return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart of Zobo sales Jan to Jun"><line x1="${P}" y1="${H - 20}" x2="${W - 5}" y2="${H - 20}" class="ax"/><polyline fill="none" class="ln" points="${vals.map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/>${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" class="pt"/><text x="${x(i)}" y="${H - 6}" class="tl">${MONTHS[i]}</text><text x="${x(i)}" y="${y(v) - 7}" class="tv">${v}</text>`).join("")}</svg>`;
      if (kind === "bar") { const t = ITEMS.map((_, i) => total(i)); const m = Math.max(...t); return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart of total units per item">${t.map((v, i) => `<rect x="${P + i * 66}" y="${H - 20 - (v / m) * (H - 45)}" width="44" height="${(v / m) * (H - 45)}" class="br"/><text x="${P + 22 + i * 66}" y="${H - 6}" class="tl">${ITEMS[i].split(" ")[0]}</text>`).join("")}</svg>`; }
      if (kind === "pie") { let a = 0; const s = vals.reduce((p, c) => p + c, 0); const cx = 150, cy = 75, r = 60; const cols = ["#2E5AAC", "#0E7C66", "#C2571A", "#B4458A", "#8A6D1F", "#5A6270"]; return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pie chart of Zobo sales share by month">${vals.map((v, i) => { const a0 = a; a += (v / s) * Math.PI * 2; const l = a - a0 > Math.PI ? 1 : 0; return `<path d="M${cx},${cy} L${cx + r * Math.sin(a0)},${cy - r * Math.cos(a0)} A${r},${r} 0 ${l} 1 ${cx + r * Math.sin(a)},${cy - r * Math.cos(a)} Z" fill="${cols[i]}"/>`; }).join("")}</svg>`; }
      return `<div class="mono small">Jan ${vals[0]} · Feb ${vals[1]} · Mar ${vals[2]} · Apr ${vals[3]} · May ${vals[4]} · Jun ${vals[5]}</div>`;
    }
    function render() {
      const s = steps[step];
      el.innerHTML = `
        <div class="sim-brief card"><p class="eyebrow">Scenario</p>
          <p><b>Mama Tolu</b> runs a canteen near campus (fictional). She sent six months of sales and asked: <i>“What's selling, and what should I do next?”</i></p>
          <details><summary>Context</summary><p class="small">Academic calendar: second-semester break ran most of April, so the campus was quiet. Prices didn't change all period.</p></details>
        </div>
        ${table()}
        <div class="card qcard">
          <div class="stepper" aria-label="Step ${step + 1} of ${steps.length}">${steps.map((_, i) => `<span class="${i < step ? "done" : i === step ? "now" : ""}"></span>`).join("")}</div>
          <p class="eyebrow">Question ${step + 1} of ${steps.length}</p>
          <h3>${s.q}</h3>
          <div id="qBody"></div>
          <p class="hint-out" id="fb" aria-live="polite"></p>
          <div class="sim-actions"><button type="button" class="btn ghost" id="hintBtn">💡 Hint</button><button type="button" class="btn" id="contBtn" hidden>Continue →</button></div>
        </div>`;
      $("#totBtn", el).addEventListener("click", () => { showTotals = !showTotals; render(); });
      $("#sortBtn", el).addEventListener("click", (e) => {
        const order = data.map((r, i) => [r[2], MONTHS[i]]).sort((a, b) => b[0] - a[0]);
        $("#fb", el).innerHTML = "Zobo by month, highest first: " + order.map(([v, m]) => `${m} ${v}`).join(" · ");
      });
      $("#hintBtn", el).addEventListener("click", () => { $("#fb", el).innerHTML = "💡 " + s.hint; if (!s.hinted) { s.hinted = true; } });
      const answer = (ok, fbText) => {
        tries++;
        const fbEl = $("#fb", el);
        if (ok) { points += tries === 1 && !s.hinted ? 2 : 1; fbEl.innerHTML = `<span class="good">✓ Correct.</span> ${fbText}`; $("#contBtn", el).hidden = false; $("#contBtn", el).focus(); $$("#qBody button, #qBody input", el).forEach((b) => (b.disabled = true)); }
        else { fbEl.innerHTML = `<span class="bad">Not quite.</span> ${tries >= 2 ? "Try the hint, then go again." : "Have another look."}`; }
      };
      if (s.type === "cell") {
        $("#qBody", el).innerHTML = `<p class="muted small">Tap a number in the table.</p>`;
        $$(".cell", el).forEach((c) => c.addEventListener("click", () => {
          if (steps[step].type !== "cell" || fixed) return;
          const ok = c.dataset.r === "4" && c.dataset.c === "1";
          if (ok) { fixed = true; data[4][1] = 340; c.classList.add("fixed"); c.textContent = "340"; }
          else c.classList.add("wrong");
          answer(ok, "Shawarma in May reads 3,400, about 10× every other month. Almost certainly a typo for 340. A real analyst confirms with the source; Mama Tolu confirmed it, so it's corrected to 340.");
        }));
      } else if (s.type === "mcq") {
        const opts = s.opts();
        $("#qBody", el).innerHTML = `<div class="choices">${opts.map((o, i) => `<button type="button" class="choice-btn" data-i="${i}">${o.t}</button>`).join("")}</div>`;
        $$(".choice-btn", el).forEach((b) => b.addEventListener("click", () => { const o = opts[+b.dataset.i]; b.classList.add(o.ok ? "right" : "wrong"); answer(o.ok, s.fb()); }));
      } else if (s.type === "chart") {
        const kinds = [["line", "Line chart"], ["bar", "Bar chart of totals"], ["pie", "Pie chart"], ["table", "Plain table"]];
        $("#qBody", el).innerHTML = `<div class="chart-pick">${kinds.map(([k, t]) => `<button type="button" class="choice-btn" data-k="${k}">${t}</button>`).join("")}</div><div class="chart-prev" id="prev" aria-live="polite"><p class="muted small">Tap a chart to preview it.</p></div>`;
        $$(".chart-pick .choice-btn", el).forEach((b) => b.addEventListener("click", () => {
          const k = b.dataset.k; $("#prev", el).innerHTML = chartSvg(k);
          const why = { line: "A line chart shows change over time at a glance: the steady climb and the April dip are obvious.", bar: "This bar chart compares totals across items, which doesn't answer the month-by-month question.", pie: "Pie charts show parts of a whole, not trends. Months as slices hide the climb.", table: "Accurate, but she'd have to read every number to see the trend." }[k];
          b.classList.add(k === "line" ? "right" : "wrong");
          answer(k === "line", why);
          if (k !== "line") $("#fb", el).innerHTML += " " + why;
        }));
      }
      $("#contBtn", el).addEventListener("click", () => {
        step++; tries = 0;
        if (step < steps.length) { render(); $(".qcard", el).scrollIntoView({ behavior: "smooth", block: "center" }); return; }
        const score = clamp((points / MAX) * 100);
        done({
          score,
          summary: `Cleaned a data error, found the top seller and fastest grower, explained the April dip and chose the right chart (${points}/${MAX} pts).`,
          details: `<h4>What you did</h4><ul class="fb-list">
            <li class="ok"><b>Data cleaning</b><span>Spotted the 3,400 typo before it distorted the totals.</span></li>
            <li class="ok"><b>Exploration</b><span>Totals: ${ITEMS.map((n, i) => `${n} ${total(i)}`).join(", ")}.</span></li>
            <li class="ok"><b>Trend</b><span>Zobo +${growth(2)}% Jan→Jun, the fastest-growing item.</span></li>
            <li class="ok"><b>Context</b><span>April dip explained by the semester break, not performance.</span></li>
            <li class="ok"><b>Communication</b><span>Line chart + a specific, numbers-backed recommendation.</span></li></ul>
            <p class="muted small">First-try answers earn 2 points; answers after a hint or retry earn 1.</p>`,
          portfolio: {
            title: "Sales analysis for a campus canteen",
            problem: "A small canteen owner had six months of sales data and wanted to know what's selling and what to do next.",
            approach: `Found and corrected a data-entry error, computed totals and growth (Zobo +${growth(2)}%), explained a seasonal dip using the academic calendar, chose a line chart for the trend and recommended stocking more zobo with a combo offer.`
          }
        });
      });
    }
    render();
  }

  /* ---------------- 3. UI/UX usability audit ---------------- */
  const UX = {
    contrast: { label: "Low-contrast heading", why: "Pale grey on white fails WCAG contrast (needs 4.5:1 for text). Hard to read in sunlight on a cheap screen.", fixes: [["Make it darker (e.g. #1f2937) so contrast is at least 4.5:1", true], ["Make the font bigger but keep the colour", false], ["Add a drop shadow", false]] },
    icons: { label: "Icon-only buttons with no labels", why: "Nobody can tell what ⟲ ✎ ⊘ do. Guessing on a registration form is scary.", fixes: [["Add short text labels (Reset, Edit, Drop course)", true], ["Make the icons bigger", false], ["Explain them in the FAQ page", false]] },
    jargon: { label: "Jargon label", why: "‘Input matric identifier’ is system-speak. Students say ‘matric number’.", fixes: [["Rename to ‘Matric number’ with an example: e.g. CSC/19/1234", true], ["Keep it; users will learn", false], ["Hide the label to save space", false]] },
    error: { label: "Error with no message", why: "The field turns red but never says what's wrong or how to fix it. Colour alone also fails colour-blind users.", fixes: [["Show a plain message under the field: ‘Units must be 24 or less. You have 26.’", true], ["Make the red brighter", false], ["Show an alert popup after submit", false]] },
    placeholder: { label: "Placeholder used as label", why: "The hint text disappears when you start typing, so you forget what the field was for.", fixes: [["Use a visible label above the field; keep the placeholder as an example", true], ["Make the placeholder darker", false], ["Remove the field", false]] },
    tap: { label: "Tiny tap target", why: "A 12px checkbox is hard to hit with a thumb. Aim for at least 44×44px.", fixes: [["Make the whole line tappable, at least 44px tall", true], ["Zoom out the page", false], ["Pre-tick it for the user", false]] },
    buttons: { label: "Destructive and primary actions look identical", why: "‘Clear all’ wipes the form and sits right next to ‘Submit’, styled the same. One mis-tap loses everything.", fixes: [["Make Submit the clear primary button; make Clear all a quiet text link with an undo or confirm", true], ["Swap their positions", false], ["Make both buttons red", false]] }
  };
  const UX_OK = { logo: "The header logo and name are clear. Fine.", course: "Course rows show code, title and units clearly. This part works.", fee: "Fee status is visible and labelled. Good.", nav: "Back link is clear and placed where people expect it." };

  function uxSim(el, done) {
    const found = {}; let misses = 0, hints = 0;
    const order = Object.keys(UX);
    el.innerHTML = `
      <div class="sim-brief card"><p class="eyebrow">Scenario</p>
        <p>Students keep messing up course registration on the <b>Unity University portal</b> (fictional). You have 10 minutes with the screen.</p>
        <p><b>Task:</b> tap each usability problem on the phone screen, then pick the best fix. There are <b>7</b>.</p></div>
      <div class="ux-layout">
        <div class="phone" aria-label="Mock registration screen">
          <div class="ph-notch"></div>
          <div class="ph-screen">
            <button type="button" class="hs ok-zone" data-k="nav">‹ Back</button>
            <button type="button" class="hs ok-zone ph-logo" data-k="logo">◆ Unity Portal</button>
            <button type="button" class="hs ph-h" data-k="contrast">Course Registration · 2nd Semester</button>
            <div class="ph-row"><button type="button" class="hs ph-icons" data-k="icons"><span>⟲</span><span>✎</span><span>⊘</span></button></div>
            <button type="button" class="hs ok-zone ph-courses" data-k="course"><span>CSC 301 · Data Structures · 3u</span><span>CSC 305 · Operating Systems · 3u</span><span>MTH 301 · Numerical Methods · 3u</span></button>
            <div class="hs-wrap"><button type="button" class="hs ph-label" data-k="jargon">Input matric identifier</button><div class="ph-input">CSC/19/</div></div>
            <div class="hs-wrap"><span class="ph-lbl2">Total units</span><button type="button" class="hs ph-input err" data-k="error">26</button></div>
            <button type="button" class="hs ph-input ph-ph" data-k="placeholder">Phone number</button>
            <button type="button" class="hs ok-zone ph-fee" data-k="fee">School fees: <b>Paid ✓</b></button>
            <button type="button" class="hs ph-tick" data-k="tap"><span class="tiny-box"></span><span>I confirm my courses are correct</span></button>
            <button type="button" class="hs ph-btns" data-k="buttons"><span>Clear all</span><span>Submit</span></button>
          </div>
        </div>
        <div class="ux-side">
          <div class="card"><div class="ux-progress"><b id="uxCount">0</b>/7 problems found</div>
            <div class="meter"><span id="uxBar" style="width:0%"></span></div>
            <div id="uxPanel" aria-live="polite"><p class="muted small">Tap anything on the screen that would trip up a student.</p></div>
            <div class="sim-actions"><button type="button" class="btn ghost" id="hintBtn">💡 Hint</button><button type="button" class="btn" id="finishBtn">Finish audit</button></div>
          </div>
          <ul class="found-list" id="foundList"></ul>
        </div>
      </div>`;
    const panel = $("#uxPanel", el);
    const refresh = () => {
      const n = Object.keys(found).length;
      $("#uxCount", el).textContent = n; $("#uxBar", el).style.width = (n / 7) * 100 + "%";
      $("#foundList", el).innerHTML = order.filter((k) => found[k]).map((k) => `<li class="${found[k].fixOk ? "ok" : found[k].fix === undefined ? "" : "miss"}"><b>${UX[k].label}</b>${found[k].fix === undefined ? `<span class="muted"> · choose a fix</span>` : found[k].fixOk ? " · good fix ✓" : " · fix could be better"}</li>`).join("");
      if (n === 7 && order.every((k) => found[k].fix !== undefined)) $("#finishBtn", el).classList.add("pulse");
    };
    function openFix(k) {
      const u = UX[k];
      panel.innerHTML = `<p class="good"><b>✓ ${u.label}</b></p><p class="small">${u.why}</p><p class="eyebrow">Best fix?</p>
        <div class="choices">${u.fixes.map(([t], i) => `<button type="button" class="choice-btn" data-i="${i}">${t}</button>`).join("")}</div><p class="small" id="fixFb"></p>`;
      $$(".choice-btn", panel).forEach((b) => b.addEventListener("click", () => {
        if (found[k].fix !== undefined) return;
        const i = +b.dataset.i; const ok = u.fixes[i][1];
        found[k].fix = i; found[k].fixOk = ok;
        b.classList.add(ok ? "right" : "wrong");
        if (!ok) $$(".choice-btn", panel)[u.fixes.findIndex((f) => f[1])].classList.add("right");
        $("#fixFb", panel).innerHTML = ok ? `<span class="good">Exactly.</span> Keep going.` : `<span class="bad">Better fix highlighted.</span> It solves the cause, not the symptom.`;
        refresh();
      }));
    }
    $$(".hs", el).forEach((h) => h.addEventListener("click", () => {
      const k = h.dataset.k;
      if (UX[k]) {
        if (!found[k]) { found[k] = {}; h.classList.add("found"); }
        openFix(k); refresh();
        if (window.matchMedia("(max-width: 760px)").matches) panel.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        misses++; h.classList.add("nope"); setTimeout(() => h.classList.remove("nope"), 700);
        panel.innerHTML = `<p class="small"><b>Looks fine.</b> ${UX_OK[k]}</p>`;
      }
    }));
    $("#hintBtn", el).addEventListener("click", () => {
      const k = order.find((x) => !found[x]);
      if (!k) { panel.innerHTML = `<p class="small">All 7 found. Pick fixes for any left, then finish.</p>`; return; }
      hints++;
      const h = $(`.hs[data-k="${k}"]`, el); h.classList.add("glow"); setTimeout(() => h.classList.remove("glow"), 2200);
      panel.innerHTML = `<p class="small">💡 Look at the glowing area. What would confuse a tired student at 11pm?</p>`;
    });
    $("#finishBtn", el).addEventListener("click", () => {
      const nFound = Object.keys(found).length, nFix = order.filter((k) => found[k] && found[k].fixOk).length;
      const score = clamp(((nFound + nFix) / 14) * 100 - misses * 2 - hints * 3);
      done({
        score,
        summary: `Found ${nFound}/7 usability problems and chose the best fix for ${nFix}.`,
        details: `<h4>Problems</h4><ul class="fb-list">${order.map((k) => `<li class="${found[k] ? (found[k].fixOk ? "ok" : "fp") : "miss"}"><b>${found[k] ? "✓" : "✗"} ${UX[k].label}</b><span>${UX[k].why}<br><i>Best fix:</i> ${UX[k].fixes.find((f) => f[1])[0]}</span></li>`).join("")}</ul>
          <p class="muted small">Taps on fine areas: ${misses} (−${misses * 2}) · Hints: ${hints} (−${hints * 3})</p>`,
        portfolio: {
          title: "Usability audit: university course registration",
          problem: "Students were making mistakes on a (simulated) course-registration screen. I audited it for usability and accessibility problems.",
          approach: `Applied usability heuristics and WCAG basics. Identified ${nFound} problems (contrast, unlabeled icons, jargon, silent errors, placeholder labels, tap targets, destructive-action styling) and proposed fixes for each.`
        }
      });
    });
  }

  /* ---------------- 4. Product prioritisation ---------------- */
  const FEATS = [
    { id: "E", t: "Fix checkout crash on older Android phones", r: 600, i: 3, c: 100, e: 1 },
    { id: "A", t: "Pay on delivery (cash or transfer)", r: 800, i: 3, c: 80, e: 2 },
    { id: "B", t: "Live order tracking on a map", r: 1000, i: 2, c: 80, e: 4 },
    { id: "C", t: "Dark mode", r: 300, i: 0.5, c: 100, e: 1 },
    { id: "D", t: "Group ordering for hostel rooms", r: 400, i: 2, c: 50, e: 3 },
    { id: "F", t: "Loyalty points", r: 500, i: 1, c: 50, e: 3 }
  ];
  const rice = (f) => Math.round((f.r * f.i * (f.c / 100)) / f.e);
  function productSim(el, done) {
    let order = ["B", "F", "C", "A", "D", "E"]; let hint = false;
    const byId = (id) => FEATS.find((f) => f.id === id);
    function render() {
      el.innerHTML = `
        <div class="sim-brief card"><p class="eyebrow">Scenario</p>
          <p>You're the PM for <b>CampusEats</b>, a student food-delivery app (fictional). Engineering can build about <b>3 things</b> this quarter.</p>
          <div class="quotes">
            <blockquote>“App closes when I press Pay. Tecno phone.” <cite>– Play Store, 1★</cite></blockquote>
            <blockquote>“I don't have a card. Let me pay when the food comes.” <cite>– survey</cite></blockquote>
            <blockquote>“Where is my food?? 40 mins already.” <cite>– support chat</cite></blockquote>
            <blockquote>“Dark mode pls 🙏” <cite>– Twitter</cite></blockquote>
          </div>
          <p><b>Task:</b> rank the features from most to least important. Use ↑ ↓ to move them.</p></div>
        <div class="card"><ol class="rank" aria-label="Feature ranking">${order.map((id, idx) => { const f = byId(id); return `<li class="rank-item ${idx < 3 ? "top" : ""}">
            <span class="rank-n">${idx + 1}</span>
            <div class="rank-body"><b>${f.t}</b><span class="rank-meta">Reach ${f.r}/mo · Impact ${f.i} · Confidence ${f.c}% · Effort ${f.e} wk</span></div>
            <div class="rank-btns"><button type="button" class="icon-btn" data-up="${idx}" aria-label="Move ${esc(f.t)} up" ${idx === 0 ? "disabled" : ""}>↑</button><button type="button" class="icon-btn" data-down="${idx}" aria-label="Move ${esc(f.t)} down" ${idx === order.length - 1 ? "disabled" : ""}>↓</button></div></li>`; }).join("")}</ol>
          <p class="muted small">Top 3 (highlighted) get built this quarter.</p>
          <p class="hint-out" aria-live="polite">${hint ? "💡 Try RICE: Reach × Impact × Confidence ÷ Effort. Bigger score = more value per week of work. Also: a crash that blocks payment is urgent." : ""}</p>
          <div class="sim-actions"><button type="button" class="btn ghost" id="hintBtn">💡 Hint</button><button type="button" class="btn" id="lockBtn">Lock in ranking</button></div></div>`;
      $$("[data-up]", el).forEach((b) => b.addEventListener("click", () => { const i = +b.dataset.up; [order[i - 1], order[i]] = [order[i], order[i - 1]]; render(); const nb = $(`[data-up="${i - 1}"]`, el) || $(`[data-down="${i - 1}"]`, el); nb && nb.focus(); }));
      $$("[data-down]", el).forEach((b) => b.addEventListener("click", () => { const i = +b.dataset.down; [order[i + 1], order[i]] = [order[i], order[i + 1]]; render(); const nb = $(`[data-down="${i + 1}"]`, el) || $(`[data-up="${i + 1}"]`, el); nb && nb.focus(); }));
      $("#hintBtn", el).addEventListener("click", () => { hint = true; render(); });
      $("#lockBtn", el).addEventListener("click", () => {
        const ideal = FEATS.slice().sort((a, b) => rice(b) - rice(a)).map((f) => f.id);
        const top3 = order.slice(0, 3).filter((id) => ideal.slice(0, 3).includes(id)).length;
        const dist = order.reduce((s, id, i) => s + Math.abs(i - ideal.indexOf(id)), 0); // 0..18
        const score = clamp(top3 * 20 + (1 - dist / 18) * 40 - (hint ? 5 : 0));
        done({
          score,
          summary: `${top3}/3 of the highest-value features made your top 3.`,
          details: `<h4>RICE scores (Reach × Impact × Confidence ÷ Effort)</h4>
            <div class="table-wrap"><table class="dtable"><thead><tr><th>#</th><th>Feature</th><th>RICE</th><th>You</th></tr></thead><tbody>
            ${ideal.map((id, i) => `<tr><td>${i + 1}</td><td>${byId(id).t}</td><td>${rice(byId(id))}</td><td>${order.indexOf(id) + 1}</td></tr>`).join("")}</tbody></table></div>
            <p class="small">The Android crash is tiny effort and blocks payment for many users, so it's the top priority. Pay-on-delivery unlocks students without cards. Live tracking is valuable but costly. Dark mode is loved by a loud few. RICE is a guide, not a law: strategy and urgency still matter.</p>`,
          portfolio: {
            title: "Feature prioritisation for a food-delivery app",
            problem: "A (simulated) student food-delivery app had more feature requests than engineering capacity for the quarter.",
            approach: `Reviewed user feedback, then ranked six features using reach, impact, confidence and effort (RICE). My top 3: ${order.slice(0, 3).map((id) => byId(id).t).join("; ")}.`
          }
        });
      });
    }
    render();
  }

  /* ---------------- 5/6. Generic decision sims: cloud + marketing ---------------- */
  function decisionSim(cfg) {
    return function (el, done) {
      let step = 0, points = 0, first = true; const picks = [];
      function render() {
        const s = cfg.steps[step];
        el.innerHTML = `<div class="sim-brief card"><p class="eyebrow">Scenario</p>${cfg.scenario}</div>
          ${cfg.visual ? `<div class="card visual" aria-hidden="true">${cfg.visual(picks)}</div>` : ""}
          <div class="card qcard">
            <div class="stepper">${cfg.steps.map((_, i) => `<span class="${i < step ? "done" : i === step ? "now" : ""}"></span>`).join("")}</div>
            <p class="eyebrow">Decision ${step + 1} of ${cfg.steps.length}</p><h3>${s.q}</h3>
            <div class="choices">${s.o.map((o, i) => `<button type="button" class="choice-btn" data-i="${i}">${o[0]}</button>`).join("")}</div>
            <p class="hint-out" id="fb" aria-live="polite"></p>
            <div class="sim-actions"><button type="button" class="btn" id="contBtn" hidden>Continue →</button></div></div>`;
        $$(".choice-btn", el).forEach((b) => b.addEventListener("click", () => {
          const o = s.o[+b.dataset.i];
          b.classList.add(o[1] ? "right" : "wrong");
          $("#fb", el).innerHTML = (o[1] ? `<span class="good">✓ Good call.</span> ` : `<span class="bad">Rethink.</span> `) + o[2];
          if (o[1]) { if (first) points++; picks[step] = o[0]; $$(".choice-btn", el).forEach((x) => (x.disabled = true)); $("#contBtn", el).hidden = false; $("#contBtn", el).focus(); }
          else first = false;
        }));
        $("#contBtn", el).addEventListener("click", () => {
          step++; first = true;
          if (step < cfg.steps.length) return render();
          const score = clamp((points / cfg.steps.length) * 100);
          done({ score, summary: `${points}/${cfg.steps.length} decisions right first time.`, details: cfg.result(picks), portfolio: cfg.portfolio(picks) });
        });
      }
      render();
    };
  }

  const cloudSim = decisionSim({
    scenario: `<p>Your faculty's <b>student election</b> moves online. ~8,000 students will vote within one 6-hour window. It must not go down, must not lose a single vote, and the budget is tight.</p><p><b>Task:</b> design the architecture, one decision at a time.</p>`,
    visual: (p) => { const on = (i) => (p[i] ? "on" : ""); return `<div class="arch"><span class="node on">Students</span><span class="arr">→</span><span class="node ${on(2)}">CDN</span><span class="arr">→</span><span class="node ${on(0)}">Load balancer</span><span class="arr">→</span><span class="node ${on(0)}">App ×2+</span><span class="arr">→</span><span class="node ${on(1)}">Managed DB</span>${p[3] ? `<span class="node on lock">🔒 Private network + HTTPS</span>` : ""}${p[4] ? `<span class="node on">📈 Auto-scale + billing alert</span>` : ""}</div>`; },
    steps: [
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
        ["Don't monitor; check the bill next month", false, "Bills can run away silently. Always set alerts."]] }
    ],
    result: () => `<h4>Your architecture</h4><p class="small">Students → CDN (static files) → Load balancer → 2+ auto-scaling app instances → Managed database (backups + standby), all behind HTTPS with the database in a private network and a billing alert.</p><p class="small">This is the classic highly-available web pattern on AWS, Azure or Google Cloud.</p>`,
    portfolio: () => ({ title: "Cloud architecture: online student election", problem: "Design infrastructure for 8,000 students voting in a 6-hour window with no downtime, no lost votes and a tight budget.", approach: "Designed a load-balanced, auto-scaling app tier, a managed relational database with backups and standby, CDN-served static assets, private networking with HTTPS, and cost controls with scaling schedules and billing alerts." })
  });

  const mktSim = decisionSim({
    scenario: `<p><b>Zobo by Tolu</b> is a student-run drinks brand on campus (fictional). Budget: <b>₦50,000</b>. Time: <b>4 weeks</b>. Goal: more first-time customers.</p><p><b>Task:</b> build the campaign brief, one decision at a time.</p>`,
    steps: [
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
        ["Just post consistently and hope", false, "Hope isn't a strategy."]] }
    ],
    result: (p) => `<h4>Your campaign brief</h4><dl class="brief"><dt>Audience</dt><dd>${p[0]}</dd><dt>Goal</dt><dd>${p[1]}</dd><dt>Channels</dt><dd>${p[2]}</dd><dt>Headline</dt><dd>${p[3]}</dd><dt>Measurement</dt><dd>${p[4]}</dd></dl>`,
    portfolio: (p) => ({ title: "Campaign brief: student drinks brand", problem: "A student-run zobo brand had ₦50,000 and 4 weeks to win first-time customers on campus.", approach: `Defined the audience (${p[0]}), a SMART goal (${p[1]}), budget-fit channels, a conversion-focused headline and weekly cost-per-customer tracking.` })
  });

  window.CQ_SIMS = [
    { id: "phishing", title: "Phishing Investigation", career: "cybersecurity", mins: 6, level: "Beginner", skills: ["Phishing analysis", "Email header analysis", "Incident response"], desc: "A suspicious payroll email hit the whole office. Find the red flags and decide what to do.", run: phishing },
    { id: "data", title: "Canteen Sales Analysis", career: "data-analysis", mins: 8, level: "Beginner", skills: ["Data cleaning", "Spreadsheet analysis", "Data visualisation", "Storytelling with data"], desc: "Clean a small dataset, explore it in your browser and recommend what Mama Tolu should do.", run: dataSim },
    { id: "uiux", title: "Usability Audit", career: "ui-ux", mins: 7, level: "Beginner", skills: ["Usability heuristics", "Accessibility", "Interface critique"], desc: "Students keep failing course registration. Spot 7 usability problems and pick the right fixes.", run: uxSim },
    { id: "product", title: "Feature Prioritisation", career: "product-management", mins: 5, level: "Beginner", skills: ["Prioritisation (RICE)", "User feedback analysis", "Product thinking"], desc: "Six feature requests, room for three. Rank them using real user feedback.", run: productSim },
    { id: "cloud", title: "Design an Election Cloud", career: "cloud", mins: 5, level: "Beginner", skills: ["Cloud architecture", "High availability", "Cloud security basics"], desc: "8,000 students vote in 6 hours. Design infrastructure that won't fall over.", run: cloudSim },
    { id: "marketing", title: "Campaign Brief Builder", career: "digital-marketing", mins: 5, level: "Beginner", skills: ["Campaign planning", "Copywriting", "Marketing analytics"], desc: "₦50k, 4 weeks, one zobo brand. Build a campaign that actually wins customers.", run: mktSim }
  ];
})();
