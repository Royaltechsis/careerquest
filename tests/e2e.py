"""
End-to-end check of CareerQuest against a running server (next dev / next start) with a database.
Usage:  python tests/e2e.py http://localhost:3000 ./shots
Needs:  pip install playwright && playwright install chromium   (or set CHROMIUM_PATH)
Covers: signup -> onboarding -> quiz -> careers search -> all 6 simulations -> roadmap -> portfolio,
        then proves everything was saved to the DB (reload, log in on a "second device"), the public
        portfolio page, browser back/forward, and logout.
"""
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright

BASE = sys.argv[1].rstrip("/"); OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
USER = "e2e" + str(int(time.time()))[-6:]
EMAIL, PW = USER + "@example.com", "correct-horse-1"
errs = []; checks = []

def check(name, cond, extra=""):
    checks.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  ({extra})" if extra else ""))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None, args=["--no-sandbox"])
        def phone():
            return b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        ctx = await phone(); pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
        pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
        pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        async def saved():
            await pg.wait_for_function("!window.CareerQuest || window.CareerQuest.pendingSaves() === 0", timeout=15000)
        async def go(path):
            await saved(); await pg.goto(BASE + path); await pg.wait_for_timeout(250)
        async def shot(name, full=False):
            await pg.wait_for_timeout(300); await pg.screenshot(path=f"{OUT}/{name}.png", full_page=full)
        async def ovf(tag):
            w = await pg.evaluate("document.documentElement.scrollWidth")
            if w > 390: errs.append(f"overflow {tag}: {w}")

        # landing -> signup
        await go("/"); await shot("01_landing"); await ovf("landing")
        await pg.click("text=Start exploring"); await pg.wait_for_url("**/signup")
        await pg.fill("input[name=name]", "Bunmi"); await pg.fill("input[name=username]", USER)
        await pg.fill("input[name=email]", EMAIL); await pg.fill("input[name=password]", PW)
        await shot("02_signup")
        await pg.click("button:has-text('Create account')"); await pg.wait_for_url("**/start")
        check("signup lands on onboarding", pg.url.endswith("/start"))
        check("name prefilled from signup", await pg.input_value("input[name=name]") == "Bunmi")
        await pg.fill("input[name=uni]", "FUTA"); await pg.fill("input[name=course]", "Software Engineering")
        await pg.click("text=Prepare for internships / SIWES"); await pg.click("text=Build a portfolio")
        await pg.click("label.chip:has-text('Cybersecurity Analyst')")
        await pg.click("text=Start my quest"); await pg.wait_for_url("**/dashboard")
        check("onboarding -> dashboard", pg.url.endswith("/dashboard")); await shot("03_dashboard_new"); await ovf("dash")

        # quiz
        await go("/quiz")
        for i in range(10): await pg.click(".qopt >> nth=%d" % (i % 4))
        await shot("04_quiz_result", True)
        # careers search (client-side nav via tab bar)
        await pg.click("#tabbar a[href='/careers']"); await pg.wait_for_url("**/careers")
        await pg.fill("#q", "sql"); await pg.wait_for_timeout(200)
        check("career search", "3" in (await pg.text_content("#count")), await pg.text_content("#count"))
        await pg.fill("#q", "")
        await pg.click("a.ccard[href='/career/ui-ux']"); await pg.wait_for_url("**/career/ui-ux")
        await pg.go_back(); await pg.wait_for_timeout(300)
        check("browser back returns to careers", pg.url.endswith("/careers") and await pg.locator("#q").count() == 1, pg.url)
        await pg.go_forward(); await pg.wait_for_timeout(300)
        check("browser forward", pg.url.endswith("/career/ui-ux") and "UI/UX" in (await pg.text_content("h1")), pg.url)

        # simulations
        await go("/sim/phishing"); await pg.click("details.raw summary")
        for k in ["from", "replyto", "subject", "auth", "greeting", "threat", "link", "creds", "attach", "footer"]:
            await pg.click(f".tok[data-k={k}]")
        await shot("07_phish", True)
        await pg.click("#nextBtn"); await pg.click("label.choice >> nth=2"); await pg.click("#finishBtn"); await pg.wait_for_timeout(400)
        print("phish:", (await pg.text_content(".res-top")).strip()[:100])
        await pg.click("label.switch:has(#pubNow)")
        await go("/sim/data")
        await pg.click(".cell[data-r='4'][data-c='1']"); await pg.click("#contBtn"); await pg.click("#totBtn")
        for t in ["Jollof rice", "Zobo", "Check the context"]:
            await pg.click(f".choice-btn:has-text('{t}')"); await pg.click("#contBtn")
        await pg.click(".chart-pick .choice-btn[data-k=line]"); await pg.click("#contBtn")
        await pg.click(".choice-btn:has-text('Zobo demand')"); await pg.click("#contBtn"); await pg.wait_for_timeout(300)
        print("data:", (await pg.text_content(".res-top")).strip()[:100])
        await go("/sim/uiux")
        for k in ["contrast", "icons", "jargon", "error", "placeholder", "tap", "buttons"]:
            await pg.click(f".hs[data-k={k}]"); await pg.click("#uxPanel .choice-btn >> nth=0")
        await pg.click("#finishBtn"); await pg.wait_for_timeout(300)
        print("uiux:", (await pg.text_content(".res-top")).strip()[:100])
        await go("/sim/product")
        for i in range(5, 0, -1): await pg.click(f"[data-up='{i}']")
        await pg.click("#lockBtn"); await pg.wait_for_timeout(300)
        print("product:", (await pg.text_content(".res-top")).strip()[:100])
        for sid, answers in [("cloud", [2, 1, 0, 0, 0]), ("marketing", [1, 1, 1, 1, 1])]:
            await go("/sim/" + sid)
            for a in answers:
                await pg.click(".choice-btn >> nth=0")
                if not await pg.is_visible("#contBtn"): await pg.click(f".choice-btn >> nth={a}")
                await pg.click("#contBtn")
            await pg.wait_for_timeout(300)
            print(sid + ":", (await pg.text_content(".res-top")).strip()[:100])
        await shot("08_sim_result", True)

        # roadmap
        await go("/roadmap/cybersecurity")
        for i in ["c1", "c2", "c3", "c4"]: await pg.click(f"label:has(input[data-it={i}])")
        ring = await pg.text_content(".ring"); await shot("09_roadmap", True)
        # portfolio
        await go("/portfolio"); await pg.click("#addBtn")
        await pg.fill("input[name=title]", "Readers Nook"); await pg.fill("textarea[name=problem]", "Students lacked a shared library app")
        await pg.fill("input[name=skills]", "Next.js, TypeScript"); await pg.fill("input[name=link]", "https://readersnook.vercel.app")
        await pg.click("form#pfForm .switch"); await pg.click("text=Save project"); await pg.wait_for_timeout(300)
        await pg.click("#addBtn"); await pg.fill("input[name=title]", "Private draft"); await pg.click("text=Save project"); await pg.wait_for_timeout(300)
        await shot("10_portfolio", True); await ovf("portfolio")
        n_items = await pg.locator(".pf").count()
        await saved()

        # reload: state must come back from the database
        await pg.reload(); await pg.wait_for_timeout(400)
        check("portfolio persisted after reload", await pg.locator(".pf").count() == n_items, f"{n_items} items")
        await go("/roadmap/cybersecurity")
        check("roadmap progress persisted", await pg.text_content(".ring") == ring, ring)
        await go("/dashboard"); await shot("11_dashboard", True)
        dash = await pg.text_content("#main")

        # second device: log in fresh
        ctx2 = await phone(); p2 = await ctx2.new_page()
        p2.on("pageerror", lambda e: errs.append("p2 pageerror: " + str(e)))
        await p2.goto(BASE + "/dashboard"); await p2.wait_for_url("**/login**")
        check("protected page redirects to login", "/login" in p2.url)
        await p2.fill("input[name=email]", USER); await p2.fill("input[name=password]", PW)
        await p2.click("button:has-text('Log in')"); await p2.wait_for_url("**/dashboard"); await p2.wait_for_timeout(400)
        check("second device sees same dashboard", (await p2.text_content("#main")) == dash)
        await p2.goto(BASE + "/challenges"); await p2.wait_for_timeout(300)
        # public portfolio (no login)
        ctx3 = await phone(); p3 = await ctx3.new_page()
        await p3.goto(BASE + "/p/" + USER); await p3.wait_for_timeout(300)
        titles = await p3.locator(".pf h3").all_text_contents()
        check("public page shows only public items", "Readers Nook" in titles and "Private draft" not in titles and "Phishing" in " ".join(titles), titles)
        await p3.screenshot(path=f"{OUT}/12_public.png", full_page=True)
        r = await p3.goto(BASE + "/p/nobody-here-xyz"); check("unknown public portfolio 404", r.status == 404, r.status)

        # logout
        await go("/me"); await pg.click("#logout"); await pg.wait_for_url(BASE + "/"); await pg.wait_for_timeout(300)
        check("logout returns to landing", await pg.locator("text=Start exploring").count() > 0)
        r = await pg.goto(BASE + "/portfolio"); check("logged out -> login", "/login" in pg.url)

        # desktop
        ctx4 = await b.new_context(viewport={"width": 1440, "height": 900}); p4 = await ctx4.new_page()
        await p4.goto(BASE + "/"); await p4.wait_for_timeout(300); await p4.screenshot(path=f"{OUT}/13_desktop_landing.png")
        check("no page errors", not errs, json.dumps(errs))
        await b.close()
    failed = [n for n, ok in checks if not ok]
    print(f"\n{len(checks) - len(failed)}/{len(checks)} checks passed" + (": FAILED " + ", ".join(failed) if failed else ""))
    sys.exit(1 if failed else 0)

asyncio.run(main())
