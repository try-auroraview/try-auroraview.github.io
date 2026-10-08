import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const digest = (data) => createHash('sha256').update(data).digest('hex');
const records = [];
for (const path of ['/', '/zh/', '/media/', '/zh/media/', '/ecosystem/', '/zh/ecosystem/', '/how-it-works/', '/zh/how-it-works/', '/data/ecosystem.json', '/styles.css', '/site.js', '/assets/logo-original.png', '/assets/logo-72.webp', '/assets/logo-184.webp', '/favicon.png', '/assets/brand-source.json', '/assets/BRAND-SOURCE.md', '/assets/hero-1200.webp', '/assets/architecture-original.webp', '/assets/architecture.drawio', '/assets/architecture-en.svg', '/assets/architecture-zh.png', '/assets/architecture-proposed.drawio', '/assets/architecture-proposed-zh.svg', '/assets/architecture-proposed-zh.png', '/sitemap.xml', '/llms.txt']) {
  const file = path.endsWith('/') ? `${path}index.html` : path;
  const local = await readFile(resolve(root, 'dist', '.' + file));
  const response = await fetch(`https://try-auroraview.github.io${path}?verify=${digest(local).slice(0, 12)}`, { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, `${path}: public HTTP status`);
  const remote = Buffer.from(await response.arrayBuffer());
  if (path.endsWith('.png') && path.includes('/architecture')) {
    assert.equal(remote.subarray(1, 4).toString(), 'PNG', `${path}: PNG signature`);
    assert.equal(remote.readUInt32BE(16), 2560, `${path}: PNG width`);
    assert.equal(remote.readUInt32BE(20), path.includes('-proposed') ? 2160 : 2320, `${path}: PNG height`);
    records.push({ url: response.url, status: response.status, sha256: digest(remote), bytes: remote.length, formatAndDimensionsVerified: true, note: 'Raster text may differ across OS font installations; paired SVG and draw.io model are checked byte-for-byte.' });
  } else {
    assert.equal(digest(remote), digest(local), `${path}: public artifact differs from tested production build`);
    records.push({ url: response.url, status: response.status, sha256: digest(remote), bytes: remote.length, matchesTestedBuild: true });
  }
}
for (const path of ['/auroraview/', '/auroraview/zh/', '/auroraview/zh/guide/communication.html']) {
  const docs = await fetch(`https://try-auroraview.github.io${path}`, { signal: AbortSignal.timeout(30000) });
  assert.equal(docs.status, 200, `${path}: framework documentation remains available`);
  records.push({ url: docs.url, status: docs.status, method: 'HTTP availability; documentation is a separate deployment' });
}
for (const name of ['auroraview-compact-light.svg', 'auroraview-lockup-dark.svg', 'auroraview-avatar-dark.png', 'auroraview-master.blend']) {
  const draft = await fetch(`https://try-auroraview.github.io/assets/brand/${name}`, { signal: AbortSignal.timeout(30000) });
  assert.equal(draft.status, 404, `${name}: discarded draft must not be published`);
  records.push({ url: draft.url, status: draft.status, removedDraftVerified: true });
}
await mkdir(resolve(root, 'reports'), { recursive: true });
await writeFile(resolve(root, 'reports/public-readback.json'), JSON.stringify({ checkedAtUtc: new Date().toISOString(), method: 'HTTP artifact readback, not live-browser or host interaction', records }, null, 2));
console.log(`Read back ${records.length} public resources. HTML, CSS, JavaScript, WebP, SVG, draw.io, and metadata match the tested build; PNG format/dimensions and documentation availability verified.`);
