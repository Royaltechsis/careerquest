"""Usage: python tests/shots.py <base-url> <output-dir>   e.g. python tests/shots.py http://localhost:8000/ ./shots
Needs: pip install playwright && playwright install chromium (or set CHROMIUM_PATH)."""
import asyncio, sys, os
from playwright.async_api import async_playwright
BASE=sys.argv[1]; OUT=sys.argv[2]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None, args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width":390,"height":844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on("pageerror", lambda e: errs.append(str(e)))
        async def hide_toast(): await pg.evaluate("document.getElementById('toast').classList.remove('show')")
        await pg.goto(BASE+"#/"); await pg.wait_for_timeout(600); await pg.screenshot(path=OUT+"/landing.png")
        await pg.goto(BASE+"#/start"); await pg.fill("input[name=name]","Bunmi"); await pg.fill("input[name=uni]","FUTA"); await pg.fill("input[name=course]","Software Engineering")
        await pg.click("text=Prepare for internships / SIWES"); await pg.click("label.chip:has-text('Cybersecurity Analyst')"); await pg.click("label.chip:has-text('Data Analyst')")
        await pg.click("text=Start my quest"); await pg.wait_for_timeout(300)
        await pg.goto(BASE+"#/career/cybersecurity"); await pg.goto(BASE+"#/career/data-analysis"); await pg.goto(BASE+"#/career/ui-ux")
        # phishing sim screenshot mid-task
        await pg.goto(BASE+"#/sim/phishing"); await pg.wait_for_timeout(300)
        for k in ["from","subject","link"]: await pg.click(f".tok[data-k={k}]")
        await pg.evaluate("document.querySelector('.email').scrollIntoView({block:'start'}); window.scrollBy(0,-70)")
        await hide_toast(); await pg.wait_for_timeout(300); await pg.screenshot(path=OUT+"/simulation.png")
        for k in ["replyto","greeting","threat","creds","attach"]: await pg.click(f".tok[data-k={k}]")
        await pg.click("#nextBtn"); await pg.click("label.choice >> nth=2"); await pg.click("#finishBtn"); await pg.wait_for_timeout(500)
        await pg.click("label.switch:has(#pubNow)")
        # data sim quick
        await pg.goto(BASE+"#/sim/data"); await pg.click(".cell[data-r='4'][data-c='1']"); await pg.click("#contBtn")
        for t in ["Jollof rice","Zobo","Check the context"]:
            await pg.click(f".choice-btn:has-text('{t}')"); await pg.click("#contBtn")
        await pg.click(".chart-pick .choice-btn[data-k=line]"); await pg.click("#contBtn")
        await pg.click(".choice-btn:has-text('Zobo demand')"); await pg.click("#contBtn"); await pg.wait_for_timeout(400)
        await pg.goto(BASE+"#/roadmap/cybersecurity")
        for i in ["c1","c2","c3","c4","c5"]: await pg.click(f"label:has(input[data-it={i}])")
        await pg.wait_for_timeout(400); await hide_toast()
        await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(200)
        await pg.evaluate("window.scrollTo(0,0)")
        await pg.wait_for_timeout(300); await pg.screenshot(path=OUT+"/roadmap.png")
        await pg.goto(BASE+"#/dashboard"); await pg.wait_for_timeout(500); await hide_toast(); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT+"/dashboard.png")
        # desktop + mobile proof shots
        d = await b.new_context(viewport={"width":1440,"height":900}); dp = await d.new_page()
        await dp.goto(BASE+"#/"); await dp.wait_for_timeout(500); await dp.screenshot(path=OUT+"/desktop_full.png", full_page=True)
        await dp.goto(BASE+"#/careers"); await dp.wait_for_timeout(400); await dp.screenshot(path=OUT+"/desktop_careers.png")
        print("errors", errs)
        await b.close()
asyncio.run(main())
