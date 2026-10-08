import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import lighthouse from 'lighthouse';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { serve } from './serve.mjs';
import { createServer } from 'node:net';

const reports = resolve(import.meta.dirname, '../reports');
await mkdir(reports, { recursive: true });
const server = await serve(0);
const origin = `http://127.0.0.1:${server.address().port}`;
const probe = createServer();
await new Promise((done) => probe.listen(0, '127.0.0.1', done));
const debugPort = probe.address().port;
await new Promise((done) => probe.close(done));
const browser = await chromium.launch({ headless: true, args: [`--remote-debugging-port=${debugPort}`, '--no-sandbox'] });
const records = [];
const lighthouseScores = {};
try {
  for (const path of ['/', '/zh/']) {
    for (const colorScheme of ['light', 'dark']) {
      for (const width of [390, 768, 1440]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));
        await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
        assert.deepEqual(errors, [], 'No JavaScript errors');
        await page.locator('img').evaluateAll((images) => Promise.all(images.map(async (image) => {
          image.loading = 'eager';
          try { await image.decode(); } catch {}
        })));
        assert.deepEqual(await page.locator('img').evaluateAll((images) => images.filter((image) => getComputedStyle(image).display !== 'none' && (!image.complete || image.naturalWidth === 0)).map((image) => image.src)), [], 'All visible images decode successfully');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} ${colorScheme} ${width}: horizontal overflow`);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        assert.deepEqual(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), [], `${path} ${colorScheme} ${width}: axe violations`);
        await page.keyboard.press('Tab');
        assert.equal(await page.locator(':focus').textContent(), path === '/' ? 'Skip to content' : '跳到正文');
        await page.keyboard.press('Enter');
        assert.equal(await page.evaluate(() => location.hash), '#main');
        const button = page.locator('.theme');
        const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        await button.click();
        const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        assert.notEqual(before, after, 'Theme control changes the page theme');
        await button.click();
        assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), before, 'Restore original color scheme before recording screenshot');
        assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), colorScheme, 'Recorded color scheme matches actual page theme');
        const heroLines = await page.locator('h1').evaluate((element) => Math.round(element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight)));
        assert(heroLines <= 2, `${path} ${width}: hero heading exceeds two lines`);
        const other = page.locator('.locale');
        assert.equal(await other.getAttribute('href'), path === '/' ? '/zh/' : '/');
        await page.screenshot({ path: resolve(reports, `${path === '/' ? 'en' : 'zh'}-${colorScheme}-${width}.png`), fullPage: true });
        if (width !== 768) await page.screenshot({ path: resolve(reports, `${path === '/' ? 'en' : 'zh'}-${colorScheme}-${width}-viewport.png`) });
        records.push({ path, colorScheme, width, axeViolations: 0, javascriptErrors: 0, overflow: false, keyboardSkip: true, themeToggle: true, imageDecode: true, heroLines, restoredBackground: before });
        await context.close();
      }
    }
  }
  for (const [path, width] of [['/', 1440], ['/zh/', 390]]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
    assert(await page.locator('h1').isVisible(), 'Normal-motion smoke test keeps content visible');
    assert.equal(await page.locator('.hero-copy').evaluate((element) => getComputedStyle(element).opacity), '1');
    await context.close();
  }
  for (const path of ['/ecosystem/', '/zh/ecosystem/', '/how-it-works/', '/zh/how-it-works/']) {
    for (const colorScheme of ['light', 'dark']) {
      for (const width of [390, 1440]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
        await page.locator('img').evaluateAll((images) => Promise.all(images.map(async (image) => {
          image.loading = 'eager';
          try { await image.decode(); } catch {}
        })));
        assert.deepEqual(errors, [], `${path}: no JavaScript errors`);
        assert.deepEqual(await page.locator('img').evaluateAll((images) => images.filter((image) => !image.complete || !image.naturalWidth).map((image) => image.src)), [], `${path}: image decoding`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} ${colorScheme} ${width}: horizontal overflow`);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        assert.deepEqual(results.violations.map((violation) => violation.id), [], `${path}: accessibility violations`);
        if (path.includes('ecosystem/')) {
          assert.equal(await page.locator('.host-entry').count(), 38);
          const first = page.locator('.host-entry').first();
          const initial = await first.evaluate((element) => element.open);
          await first.locator('summary').focus();
          await page.keyboard.press('Enter');
          assert.equal(await first.evaluate((element) => element.open), !initial, 'Host details toggle with keyboard');
          await page.keyboard.press('Enter');
          assert.equal(await first.evaluate((element) => element.open), initial, 'Restore details state before screenshot');
          assert.equal(await first.locator('[data-gate]').count(), 7);
        }
        const expectedLocale = path.startsWith('/zh/') ? path.replace('/zh/', '/') : `/zh${path}`;
        assert.equal(await page.locator('.locale').getAttribute('href'), expectedLocale);
        if ((width === 390 && colorScheme === 'light') || (width === 1440 && colorScheme === 'dark')) {
          const name = `${path.replaceAll('/', '-').slice(1, -1)}-${colorScheme}-${width}`;
          await page.screenshot({ path: resolve(reports, `${name}.png`), fullPage: true });
        }
        records.push({ path, colorScheme, width, axeViolations: 0, javascriptErrors: 0, overflow: false, imageDecode: true, keyboardHostDetails: path.includes('ecosystem/'), localeDestination: expectedLocale });
        await context.close();
      }
    }
  }
  const desktop = await lighthouse(`${origin}/`, { port: debugPort, output: ['json', 'html'], onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], formFactor: 'desktop', screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false } });
  const mobile = await lighthouse(`${origin}/zh/`, { port: debugPort, output: ['json', 'html'], onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
  for (const [name, result] of [['desktop', desktop], ['mobile', mobile]]) {
    await writeFile(resolve(reports, `lighthouse-${name}.json`), result.report[0]);
    await writeFile(resolve(reports, `lighthouse-${name}.html`), result.report[1]);
    const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
    lighthouseScores[name] = scores;
    console.log(`${name}: ${JSON.stringify(scores)}`);
    assert(scores.performance >= 85, `${name}: Lighthouse performance below 85`);
    assert(scores.accessibility === 100, `${name}: Lighthouse accessibility below 100`);
    assert(scores.seo === 100, `${name}: Lighthouse SEO below 100`);
  }
  await writeFile(resolve(reports, 'headless-validation.json'), JSON.stringify({ checkedAtUtc: new Date().toISOString(), method: 'headless automated; isolated Chromium test process, not dcc-cua live-browser acceptance', normalMotionSmokeTests: 2, lighthouseScores, records }, null, 2));
  console.log('Headless automated checks passed: 12 homepage combinations, 16 matrix/principles combinations, and 2 normal-motion smoke tests.');
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
