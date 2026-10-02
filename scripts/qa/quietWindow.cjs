/**
 * Run any script in this folder without its browser getting in someone's way:
 *
 *   node -r ./scripts/qa/quietWindow.cjs scripts/qa/venueDashboard.cjs
 *
 * These runs have to be headed (Cloudflare refuses a headless Chromium on dev, README point 1), and a headed
 * window opens on top of whatever the person at the machine is doing and takes the keyboard. With this
 * preload the window opens off-screen, is minimized the moment it exists, and is never seen:
 *
 *   - A change of viewport HEIGHT is skipped. A minimized window does not paint beyond its own surface, so a
 *     full-page picture of a page that scrolls inside <main> (the dashboard) is taken one window-height at a
 *     time instead: name.png is the top, name.part2.png and on are the rest.
 *   - A change of viewport WIDTH (phone-width checks) has to go through Playwright, which resizes the real
 *     window and so restores it. It is restored off-screen and minimized again at once. Each one is counted
 *     and reported at the end: it may take the keyboard focus for about a tenth of a second.
 *   - The launch flags switch off the throttling Chromium applies to a window that is not in front, so the
 *     page keeps rendering and can be photographed.
 *
 * Nothing about the test changes: same browser, same build, same requests. Leave the preload out to watch.
 */
const { createRequire } = require('module');
const path = require('path');

// The same copy of Playwright the script itself will load. Patching a different copy does nothing.
const { chromium } = createRequire(path.resolve(process.argv[1]))('playwright');

const FLAGS = [
    '--window-position=-2400,-2400',
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-features=CalculateNativeWinOcclusion',
];
const launch = chromium.launch.bind(chromium);
let widthChanges = 0;
let longestUp = 0;

chromium.launch = async (options = {}) => {
    const browser = await launch({ ...options, args: [...(options.args || []), ...FLAGS] });
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async (contextOptions = {}) => {
        const ctx = await newContext(contextOptions);
        const newPage = ctx.newPage.bind(ctx);
        ctx.newPage = async (...pageArgs) => {
            const page = await newPage(...pageArgs);
            const cdp = await ctx.newCDPSession(page);
            const { windowId } = await cdp.send('Browser.getWindowForTarget');
            const opened = (await cdp.send('Browser.getWindowBounds', { windowId })).bounds;
            const down = async () => {
                const { bounds } = await cdp.send('Browser.getWindowBounds', { windowId });
                if (bounds.windowState === 'minimized') return false;
                await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } });
                return true;
            };
            await down().catch((e) => console.log(`NOTE  could not minimize the test window: ${e.message}`));
            console.log(`NOTE  test window opened at ${opened.left},${opened.top} (off-screen) and was minimized`);

            const surfaceHeight = (contextOptions.viewport || page.viewportSize() || { height: 720 }).height;
            const setViewportSize = page.setViewportSize.bind(page);
            page.setViewportSize = async (size) => {
                if (size.width === page.viewportSize().width) return;
                const started = Date.now();
                await setViewportSize({ width: size.width, height: Math.min(size.height, surfaceHeight) });
                await down().catch(() => {});
                widthChanges += 1;
                longestUp = Math.max(longestUp, Date.now() - started);
            };

            const screenshot = page.screenshot.bind(page);
            page.screenshot = async (shot = {}) => {
                if (!shot.fullPage || !shot.path) return screenshot(shot);
                const main = await page.evaluate(() => {
                    const m = document.querySelector('main');
                    return m ? { scroll: m.scrollHeight, client: m.clientHeight } : null;
                });
                if (!main || main.scroll <= main.client + 1) return screenshot({ ...shot, fullPage: false });
                const parts = Math.ceil(main.scroll / main.client);
                for (let i = 1; i < parts; i += 1) {
                    await page.evaluate((top) => { document.querySelector('main').scrollTop = top; }, i * main.client);
                    await page.waitForTimeout(350);
                    await screenshot({ ...shot, fullPage: false, path: shot.path.replace(/\.png$/, `.part${i + 1}.png`) });
                }
                await page.evaluate(() => { document.querySelector('main').scrollTop = 0; });
                await page.waitForTimeout(200);
                return screenshot({ ...shot, fullPage: false });
            };
            return page;
        };
        return ctx;
    };
    const close = browser.close.bind(browser);
    browser.close = async (...a) => {
        console.log(`NOTE  test window: never shown; ${widthChanges} width change(s), each restored off-screen and minimized again within ${longestUp} ms`);
        return close(...a);
    };
    return browser;
};
