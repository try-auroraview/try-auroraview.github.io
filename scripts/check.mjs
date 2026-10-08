import assert from 'node:assert/strict';
import { readFile, access, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const dist = resolve(import.meta.dirname, '../dist');
const brand = JSON.parse(await readFile(resolve(dist, 'assets/brand-source.json'), 'utf8'));
const brandHash = createHash('sha256').update(await readFile(resolve(dist, brand.websiteAsset))).digest('hex');
assert.equal(brandHash, brand.sha256, 'Published brand must match the original repository PNG');
for (const name of ['logo-72.webp', 'logo-184.webp']) {
  assert((await stat(resolve(dist, 'assets', name))).size < 30000, `${name}: display-size brand image budget exceeded`);
}
await assert.rejects(access(resolve(dist, 'assets/brand')), { code: 'ENOENT' }, 'Draft redraw assets must stay outside the public build');
for (const page of ['index.html', 'zh/index.html', 'media/index.html', 'zh/media/index.html', 'ecosystem/index.html', 'zh/ecosystem/index.html', 'how-it-works/index.html', 'zh/how-it-works/index.html']) {
  const html = await readFile(resolve(dist, page), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${page}: duplicate IDs`);
  assert(!html.includes('—'), `${page}: avoid em-dashes in site copy`);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${page}: one H1`);
  assert(html.includes('rel="canonical"'), `${page}: canonical required`);
  assert(html.includes('hreflang="zh-CN"'), `${page}: alternate locale required`);
  assert(html.includes('application/ld+json'), `${page}: structured data required`);
  if (page.includes('ecosystem/')) assert.equal([...html.matchAll(/class="host-entry"/g)].length, 38, `${page}: complete dated host catalog`);
  if (page.includes('how-it-works/')) assert(html.includes('architecture-original.webp') && html.includes('__auroraview_call_result'), `${page}: original layers and communication contract required`);
  for (const [, target] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (target.startsWith('#')) {
      // Media and not-found pages share the site navigation.
      assert(ids.includes(target.slice(1)) || page.startsWith('media/'), `${page}: missing anchor ${target}`);
    } else if (target.startsWith('/')) {
      const destination = new URL(target, 'https://try-auroraview.github.io');
      const file = destination.pathname.endsWith('/') ? destination.pathname + 'index.html' : destination.pathname;
      await access(resolve(dist, '.' + file));
      if (destination.hash) {
        const targetHtml = await readFile(resolve(dist, '.' + file), 'utf8');
        assert(targetHtml.includes(`id="${destination.hash.slice(1)}"`), `${page}: missing cross-page anchor ${target}`);
      }
    } else {
      assert(target.startsWith('https://'), `${page}: insecure or unexpected URL ${target}`);
      assert(!target.includes('loonghao.github.io'), `${page}: old documentation URL`);
    }
  }
  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    assert(image[0].includes('alt='), `${page}: image alt required`);
    assert(image[0].includes('width=') && image[0].includes('height='), `${page}: image dimensions required`);
  }
}
for (const name of ['hero-1200.webp', 'why-1200.webp']) {
  assert((await stat(resolve(dist, 'assets', name))).size < 230000, `${name}: image budget exceeded`);
}
const css = await readFile(resolve(dist, 'styles.css'), 'utf8');
assert(css.includes('prefers-reduced-motion'), 'Reduced motion support required');
assert(css.includes('prefers-color-scheme:dark'), 'System dark theme required');
assert(css.includes(':focus-visible'), 'Visible keyboard focus required');
console.log('Static checks passed: locales, internal links, metadata, assets, and accessibility contracts.');
