"""Usage: python tests/e2e.py <base-url> <output-dir>   e.g. python tests/e2e.py http://localhost:8000/ ./shots
Needs: pip install playwright && playwright install chromium (or set CHROMIUM_PATH)."""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
BASE = sys.argv[1]; OUT = sys.argv[2]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None, args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width":390,"height":844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        errs=[]
        pg.on("pageerror", lambda e: errs.append("pageerror: "+str(e)))
        pg.on("console", lambda m: errs.append("console: "+m.text) if m.type=="error" else None)
        async def shot(name, full=False):
            await pg.wait_for_timeout(350)
            await pg.screenshot(path=f"{OUT}/{name}.png", full_page=full)
        await pg.goto(BASE+"#/"); await shot("01_landing")
        # overflow check
        async def ovf(tag):
            w = await pg.evaluate("document.documentElement.scrollWidth")
            if w>390: errs.append(f"overflow {tag}: {w}")
        await ovf("landing")
        await pg.click("text=Start exploring"); 
        await pg.fill("input[name=name]","Bunmi"); await pg.fill("input[name=uni]","FUTA"); await pg.fill("input[name=course]","Software Engineering")
        await pg.click("text=Prepare for internships / SIWES"); await pg.click("text=Build a portfolio")
        await pg.click("label.chip:has-text('Cybersecurity Analyst')")
        await shot("02_onboard"); await ovf("onboard")
        await pg.click("text=Start my quest")
        await pg.wait_for_timeout(300)
        print("after onboard:", pg.url)
        await shot("03_dashboard_new"); await ovf("dash")
        # quiz
        await pg.goto(BASE+"#/quiz")
        for i in range(10):
            await pg.click(".qopt >> nth=%d" % (i%4))
        await shot("04_quiz_result", True); await ovf("quiz")
        # careers search
        await pg.goto(BASE+"#/careers"); await pg.fill("#q","sql"); await pg.wait_for_timeout(200)
        print("sql count:", await pg.text_content("#count"))
        await pg.fill("#q",""); await pg.click("[data-cat=design]"); print("design:", await pg.text_content("#count"))
        await pg.click("[data-cat=all]"); await shot("05_careers"); await ovf("careers")
        await pg.goto(BASE+"#/career/cybersecurity"); await shot("06_career", True); await ovf("career")
        # PHISHING
        await pg.goto(BASE+"#/sim/phishing")
        await pg.click("details.raw summary")
        for k in ["from","replyto","subject","auth","greeting","threat","link","creds","attach","footer"]:
            await pg.click(f".tok[data-k={k}]")
        await pg.click("#hintBtn")
        print("hint:", await pg.text_content("#hintOut"))
        await shot("07_phish", True); await ovf("phish")
        await pg.click("#nextBtn"); await pg.click("label.choice >> nth=2"); await pg.click("#finishBtn")
        await pg.wait_for_timeout(500)
        print("phish result:", (await pg.text_content(".res-top")).strip()[:160])
        await shot("08_phish_result", True)
        await pg.click("label.switch:has(#pubNow)")
        # DATA
        await pg.goto(BASE+"#/sim/data")
        await pg.click(".cell[data-r='0'][data-c='0']")  # wrong
        await pg.click(".cell[data-r='4'][data-c='1']")  # right
        await pg.click("#contBtn")
        await pg.click("#totBtn")
        await pg.click(".choice-btn:has-text('Jollof rice')"); await pg.click("#contBtn")
        await pg.click(".choice-btn:has-text('Zobo')"); await pg.click("#contBtn")
        await pg.click(".choice-btn:has-text('Check the context')"); await pg.click("#contBtn")
        await pg.click(".chart-pick .choice-btn[data-k=pie]")
        await shot("09_data_chart", True)
        await pg.click(".chart-pick .choice-btn[data-k=line]"); await pg.click("#contBtn")
        await pg.click(".choice-btn:has-text('Zobo demand')"); await pg.click("#contBtn")
        await pg.wait_for_timeout(400)
        print("data result:", (await pg.text_content(".res-top")).strip()[:160])
        await ovf("data")
        # UX
        await pg.goto(BASE+"#/sim/uiux")
        await pg.click(".hs[data-k=logo]")
        for k in ["contrast","icons","jargon","error","placeholder","tap","buttons"]:
            await pg.click(f".hs[data-k={k}]")
            await pg.click("#uxPanel .choice-btn >> nth=0")
        await shot("10_ux", True); await ovf("ux")
        await pg.click("#finishBtn"); await pg.wait_for_timeout(300)
        print("ux result:", (await pg.text_content(".res-top")).strip()[:160])
        # PRODUCT
        await pg.goto(BASE+"#/sim/product")
        # move E (last) to top
        for i in range(5,0,-1):
            await pg.click(f"[data-up='{i}']")
        await shot("11_product", True); await ovf("product")
        await pg.click("#lockBtn"); await pg.wait_for_timeout(300)
        print("product result:", (await pg.text_content(".res-top")).strip()[:160])
        # CLOUD & MKT: pick correct
        for sid, answers in [("cloud",[2,1,0,0,0]),("marketing",[1,1,1,1,1])]:
            await pg.goto(BASE+"#/sim/"+sid)
            for a in answers:
                await pg.click(f".choice-btn >> nth=0")  # try a wrong-ish first
                if not await pg.is_visible("#contBtn"):
                    await pg.click(f".choice-btn >> nth={a}")
                await pg.click("#contBtn")
            await pg.wait_for_timeout(300)
            print(sid, "result:", (await pg.text_content(".res-top")).strip()[:120])
        # roadmap
        await pg.goto(BASE+"#/roadmap/cybersecurity")
        for i in ["c1","c2","c3","c4"]:
            await pg.click(f"label:has(input[data-it={i}])")
        await shot("12_roadmap", True); await ovf("roadmap")
        print("roadmap ring:", await pg.text_content(".ring"))
        # portfolio
        await pg.goto(BASE+"#/portfolio"); await pg.click("#addBtn")
        await pg.fill("input[name=title]","Readers Nook"); await pg.fill("textarea[name=problem]","Students lacked a shared library app"); await pg.fill("input[name=skills]","Next.js, TypeScript"); await pg.fill("input[name=link]","https://readersnook.vercel.app")
        await pg.click("form#pfForm .switch"); await pg.click("text=Save project")
        await pg.wait_for_timeout(300)
        await shot("13_portfolio", True); await ovf("portfolio")
        href = await pg.get_attribute("#viewPub","href")
        print("pub href len", len(href))
        # dashboard final
        await pg.goto(BASE+"#/dashboard"); await shot("14_dashboard", True); await ovf("dash2")
        # public view in fresh context (other device)
        ctx2 = await b.new_context(viewport={"width":390,"height":844}, device_scale_factor=2)
        p2 = await ctx2.new_page(); p2.on("pageerror", lambda e: errs.append("p2 pageerror: "+str(e)))
        await p2.goto(BASE+href); await p2.wait_for_timeout(400)
        print("public items:", await p2.locator(".pf").count(), (await p2.text_content("h1")))
        await p2.screenshot(path=f"{OUT}/15_public.png", full_page=True)
        # desktop
        ctx3 = await b.new_context(viewport={"width":1440,"height":900})
        p3 = await ctx3.new_page(); p3.on("pageerror", lambda e: errs.append("p3 pageerror: "+str(e)))
        await p3.goto(BASE+"#/"); await p3.wait_for_timeout(300); await p3.screenshot(path=f"{OUT}/16_desktop_landing.png")
        print("ERRORS:", json.dumps(errs, indent=1))
        await b.close()
asyncio.run(main())
