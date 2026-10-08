import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { content, links, snippets } from '../src/content.mjs';
import { ecosystemPage, hostIndex, principlesPage } from '../src/pages.mjs';
import { renderDiagrams } from './diagram.mjs';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, 'public'), output, { recursive: true });
await cp(resolve(root, 'src/styles.css'), resolve(output, 'styles.css'));
await cp(resolve(root, 'src/site.js'), resolve(output, 'site.js'));
await mkdir(resolve(output, 'data'), { recursive: true });
await copyFile(resolve(root, 'data/ecosystem.json'), resolve(output, 'data/ecosystem.json'));
await mkdir(resolve(output, 'assets/fonts'), { recursive: true });
await copyFile(resolve(root, 'node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2'), resolve(output, 'assets/fonts/geist.woff2'));
for (const name of ['hero', 'why', 'interface-case']) {
  for (const width of [720, 1200, 1774]) {
    await sharp(resolve(root, `public/assets/source/${name}.png`)).resize({ width }).webp({ quality: 84 }).toFile(resolve(output, `assets/${name}-${width}.webp`));
  }
}
await sharp(resolve(root, 'public/assets/source/hero.png')).resize(1200, 630, { fit: 'contain', background: '#f6f7f5' }).png().toFile(resolve(output, 'assets/og.png'));
await sharp(resolve(root, 'public/assets/source/gallery.png')).resize({ width: 1280 }).webp({ quality: 90 }).toFile(resolve(output, 'assets/gallery.webp'));
await sharp(resolve(root, 'public/assets/source/architecture-original.png')).webp({ quality: 90 }).toFile(resolve(output, 'assets/architecture-original.webp'));
await copyFile(resolve(root, 'public/assets/logo-original.png'), resolve(output, 'favicon.png'));
await renderDiagrams(resolve(output, 'assets'));

const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const a = (url, label, cls = '') => `<a${cls ? ` class="${cls}"` : ''} href="${url}">${label}</a>`;
const picture = (name, alt, eager = false) => `<img src="/assets/${name}-1200.webp" srcset="/assets/${name}-720.webp 720w, /assets/${name}-1200.webp 1200w, /assets/${name}-1774.webp 1774w" sizes="(max-width: 767px) 100vw, (max-width: 1200px) 75vw, 1000px" width="1774" height="887" alt="${escape(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
const code = (c, label, value, id, language) => `<div class="code-block"><div class="code-head"><span>${label}</span><button class="copy" type="button" data-copy="${id}" data-success="${c.copied}" data-failure="${c.copyFailed}">${c.copy}</button></div><pre><code id="${id}" class="language-${language}">${escape(value)}</code></pre><span class="copy-status" role="status" aria-live="polite"></span></div>`;

function document(c, path, body) {
  const url = `https://try-auroraview.github.io${path}`;
  const home = c.lang === 'en' ? '/' : '/zh/';
  const section = ['media', 'ecosystem', 'how-it-works'].find((name) => path.endsWith(`/${name}/`));
  const englishPath = section ? `/${section}/` : '/';
  const chinesePath = section ? `/zh/${section}/` : '/zh/';
  const otherPath = c.lang === 'en' ? chinesePath : englishPath;
  const organization = { '@context': 'https://schema.org', '@type': 'SoftwareSourceCode', name: 'AuroraView', description: c.description, codeRepository: links.source, programmingLanguage: ['Rust', 'Python', 'TypeScript'], license: 'https://opensource.org/license/mit', url, author: { '@type': 'Organization', name: 'AuroraView', url: links.organization } };
  return `<!doctype html>
<html lang="${c.lang}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${c.title}</title><meta name="description" content="${c.description}">
<meta name="color-scheme" content="light dark"><meta name="theme-color" content="#f6f7f5">
<link rel="canonical" href="${url}"><link rel="alternate" hreflang="en" href="https://try-auroraview.github.io${englishPath}"><link rel="alternate" hreflang="zh-CN" href="https://try-auroraview.github.io${chinesePath}"><link rel="alternate" hreflang="x-default" href="https://try-auroraview.github.io${englishPath}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AuroraView"><meta property="og:locale" content="${c.locale}"><meta property="og:title" content="${c.title}"><meta property="og:description" content="${c.description}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://try-auroraview.github.io/assets/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${c.heroAlt}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${c.title}"><meta name="twitter:description" content="${c.description}"><meta name="twitter:image" content="https://try-auroraview.github.io/assets/og.png">
<link rel="icon" href="/favicon.png" type="image/png"><link rel="preload" href="/assets/fonts/geist.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/styles.css">
<script>try{const t=localStorage.getItem('auroraview-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}</script>
<script type="application/ld+json">${JSON.stringify(organization)}</script><script src="/site.js" defer></script>
</head><body>
<a class="skip" href="#main">${c.skip}</a>
<header class="header"><div class="nav-wrap"><a class="brand" href="${home}" aria-label="AuroraView"><span class="brand-symbol"><img class="original-brand" src="/assets/logo-original.png" width="36" height="36" alt=""></span><span>AuroraView</span></a><nav aria-label="${c.lang === 'en' ? 'Main navigation' : '主导航'}">${['why', 'architecture', 'projects', 'start'].map((id, i) => a(`${path === home ? '' : home}#${id}`, c.nav[i])).join('')}</nav><div class="preferences">${a(otherPath, c.otherLabel, 'locale')}<button class="theme" aria-label="${c.theme}" data-light="${c.light}" data-dark="${c.dark}" type="button">${c.dark}</button></div></div></header>
${body}
<footer class="footer container"><div><a class="footer-brand" href="${home}" aria-label="AuroraView"><img class="original-brand" src="/assets/logo-original.png" width="92" height="91" alt="AuroraView"></a><p>${c.footer}</p></div><div class="footer-links">${a(links.organization, 'GitHub')}${a(links.docs + (c.lang === 'en' ? '' : 'zh/'), c.lang === 'en' ? 'Documentation' : '文档')}${a(c.lang === 'en' ? '/media/' : '/zh/media/', c.credits)}</div><p class="privacy">${c.privacy}</p></footer>
</body></html>`;
}

for (const [lang, c] of Object.entries(content)) {
  const path = lang === 'en' ? '/' : '/zh/';
  const docs = links.docs + (lang === 'en' ? '' : 'zh/');
  const body = `<main id="main">
<section class="hero container" aria-labelledby="hero-title"><div class="hero-copy"><p class="eyebrow">${c.heroLabel}</p><h1 id="hero-title">${c.hero}</h1><p class="hero-intro">${c.intro}</p><div class="actions">${a('#start', c.start, 'button primary')}${a('#projects', `${c.explore} <span aria-hidden="true">↗</span>`, 'button secondary')}</div></div><figure class="hero-art">${picture('hero', c.heroAlt, true)}<figcaption>${c.heroCaption}</figcaption></figure></section>
<div class="facts container">${c.facts.map(([term, detail]) => `<div><strong>${term}</strong><span>${detail}</span></div>`).join('')}</div>
<section class="section container" id="why" aria-labelledby="why-title"><div class="section-heading"><h2 id="why-title">${c.whyTitle}</h2><p>${c.whyIntro}</p></div><div class="why-layout"><figure class="why-art">${picture('why', c.whyAlt)}<figcaption>${c.concept}</figcaption></figure><ol class="problems">${c.problems.map(([title, detail], index) => `<li><span class="number" aria-hidden="true">0${index + 1}</span><div><h3>${title}</h3><p>${detail}</p></div></li>`).join('')}</ol></div></section>
<section class="section foundation" aria-labelledby="built-title"><div class="container"><div class="section-heading"><h2 id="built-title">${c.builtTitle}</h2><p>${c.builtIntro}</p></div><div class="built-layout"><figure class="gallery"><img src="/assets/gallery.webp" width="1280" height="800" alt="${c.galleryAlt}" loading="lazy" decoding="async"><figcaption>${c.galleryCaption}</figcaption></figure><div class="source-index"><a href="${links.source}"><span>01</span><strong>Rust + Python</strong><small>${c.sourceLabel} ↗</small></a><a href="${links.sdk}"><span>02</span><strong>@auroraview/sdk</strong><small>React / Vue / JavaScript ↗</small></a><a href="${links.releases}"><span>03</span><strong>CLI + Gallery</strong><small>${c.releaseLabel} ↗</small></a></div></div></div></section>
<section class="section container" id="architecture" aria-labelledby="architecture-title"><div class="section-heading"><h2 id="architecture-title">${c.architectureTitle}</h2><p>${c.architectureIntro}</p></div><div class="architecture"><ol class="layers">${c.layers.map(([title, api, description], i) => `<li><span class="layer-number" aria-hidden="true">0${i + 1}</span><div><h3>${title}</h3><code>${api}</code><p>${description}</p></div></li>`).join('')}</ol><div class="architecture-rail"><aside class="host-boundary"><span class="boundary-mark" aria-hidden="true">{ }</span><h3>${c.hostBoundary}</h3><p>${c.hostDetail}</p><div class="host-names"><span>Maya</span><span>Houdini</span><span>Nuke</span><span>Blender</span><span>Unreal</span><span>Unity</span></div></aside><aside class="pack-boundary"><h3>${c.packBoundary}</h3><p>${c.packDetail}</p><code>frontend + Python + CLI → artifact</code></aside></div></div><div class="text-links">${a(`${path}how-it-works/`, lang === 'en' ? 'Follow a click through the architecture' : '沿一次点击了解架构原理')}${a('/assets/architecture.drawio', c.diagramSource)}${a(docs + 'guide/architecture', c.architectureDocs)}</div></section>
<section class="section agent-section" aria-labelledby="agent-title"><div class="container"><div class="section-heading"><h2 id="agent-title">${c.agentTitle}</h2><p>${c.agentIntro}</p></div><div class="agent-entry"><article><span class="entry-label">WEB / SDK</span><h3>${c.humanTitle}</h3><p>${c.humanDetail}</p><code>auroraview.api.*<br>auroraview.on(...)</code></article><article><span class="entry-label">AGENT / DCC-MCP</span><h3>${c.agentPathTitle}</h3><p>${c.agentDetail}</p><code>AuroraViewAdapter(view)<br>start_server(adapter).start()</code></article></div><div class="agent-contract"><h3>${c.agentTools}</h3><div><div class="tool-names"><code>eval_js</code><code>screenshot</code><code>load_url</code><code>load_html</code></div><p>${c.agentContext}</p><p class="agent-note">${c.agentNote}</p>${a(links.source + '/tree/main/python/auroraview/dcc_mcp', `${c.agentSource} ↗`, 'text-link')}</div></div></div></section>
<section class="section container runtime-section" id="shared-runtime" aria-labelledby="runtime-title"><p class="eyebrow">${c.runtimeLabel}</p><div class="section-heading"><h2 id="runtime-title">${c.runtimeTitle}</h2><p>${c.runtimeIntro}</p></div><div class="architecture"><ol class="layers">${c.runtimeLayers.map(([title, api, description], i) => `<li><span class="layer-number" aria-hidden="true">0${i + 1}</span><div><h3>${title}</h3><code>${api}</code><p>${description}</p></div></li>`).join('')}</ol><aside class="host-boundary"><h3>${c.runtimeOwnership}</h3><p>${c.runtimeOwnershipDetail}</p><p>${c.runtimePending}</p></aside></div><div class="text-links">${a(`/assets/architecture-proposed${lang === 'zh' ? '-zh' : ''}.drawio`, c.runtimeSource)}${a(`/assets/architecture-proposed-${lang}.svg`, c.runtimeSvg)}${a(`/assets/architecture-proposed-${lang}.png`, c.runtimePng)}${a('https://github.com/dcc-mcp/dcc-mcp-core', c.runtimeCore)}</div></section>
<section class="section container capabilities" aria-labelledby="capability-title"><div class="section-heading"><h2 id="capability-title">${c.capabilityTitle}</h2></div><dl>${c.capabilities.map(([title, detail, source]) => `<div><dt>${title}</dt><dd><p>${detail}</p>${a(links.source + '/tree/main/' + source, `${source} ↗`)}</dd></div>`).join('')}</dl></section>
<section class="section projects-section" id="projects" aria-labelledby="projects-title"><div class="container" id="ecosystem"><div class="section-heading"><h2 id="projects-title">${c.projectsTitle}</h2><p>${c.projectsIntro}</p></div>${hostIndex(lang)}<h3 class="foundation-title">${lang === 'en' ? 'Shared foundation and teaching source' : '共享基础与教学源码'}</h3><div class="project-table"><table><caption class="sr-only">${c.projectsTitle}</caption><thead><tr>${c.projectHeaders.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${c.projects.map(([name, role, status, url]) => `<tr><th scope="row">${a(url, `${name} <span aria-hidden="true">↗</span>`)}</th><td>${role}</td><td>${status}</td></tr>`).join('')}</tbody></table></div><aside class="evidence"><h3>${c.evidenceTitle}</h3><div><p>${c.evidence}</p><small>${c.evidenceDate}</small></div></aside></div></section>
<section class="section container" id="start" aria-labelledby="start-title"><div class="section-heading"><h2 id="start-title">${c.startTitle}</h2><p>${c.startIntro}</p></div><div class="quickstart"><div>${code(c, c.installLabel, snippets.install, 'install-code', 'bash')}<p class="prerequisites">${c.prerequisites}</p>${a(docs + 'guide/installation', `${c.docLabel} ↗`, 'text-link')}</div>${code(c, c.codeLabel, snippets.python, 'python-code', 'python')}</div></section>
<section class="section container tutorials" aria-labelledby="tutorials-title"><div class="section-heading"><h2 id="tutorials-title">${c.tutorialsTitle}</h2><p>${c.tutorialsIntro}</p></div><div class="tutorial-grid">${c.tutorials.map(([title, detail, label, url]) => `<article><h3>${title}</h3><p>${detail}</p>${a(url, `${label} ↗`, 'text-link')}</article>`).join('')}</div></section>
<section class="contribute container"><h2>${c.contributing}</h2><p>${c.contribution}</p>${a(links.source + '/blob/main/CONTRIBUTING.md', `${c.contributionLink} ↗`, 'text-link')}</section>
</main>`;
  await mkdir(resolve(output, path.slice(1)), { recursive: true });
  await writeFile(resolve(output, path.slice(1), 'index.html'), document(c, path, body));
}
for (const [lang, c] of Object.entries(content)) {
  for (const [slug, render] of [['ecosystem', ecosystemPage], ['how-it-works', principlesPage]]) {
    const path = `${lang === 'en' ? '/' : '/zh/'}${slug}/`;
    const page = render(lang);
    await mkdir(resolve(output, path.slice(1)), { recursive: true });
    await writeFile(resolve(output, path.slice(1), 'index.html'), document({ ...c, title: page.title, description: page.description }, path, page.body));
  }
}
for (const [lang, c] of Object.entries(content)) {
  const home = lang === 'en' ? '/' : '/zh/';
  const path = `${home}media/`;
  const docs = links.docs + (lang === 'en' ? '' : 'zh/');
  const model = lang === 'en' ? 'architecture.drawio' : 'architecture-zh.drawio';
  const destinations = [
    ['/assets/source/hero.png', '/assets/source/why.png', '/assets/source/interface-case.png'],
    [links.source + '/blob/main/docs/public/gallery/main.png'],
    ['/assets/logo-original.png', '/assets/BRAND-SOURCE.md'],
    [`/assets/${model}`, `/assets/architecture-${lang}.svg`, `/assets/architecture-${lang}.png`, docs + 'guide/architecture'],
    ['/assets/source/architecture-original.png', links.source + '/blob/main/assets/images/architecture.png'],
    ['/assets/fonts/LICENSE'],
  ];
  let labelIndex = 0;
  const items = c.mediaItems.map(([title, detail], index) => `<dt>${title}</dt><dd><p>${detail}</p><div class="text-links">${destinations[index].map((url) => a(url, c.mediaLabels[labelIndex++])).join('')}</div></dd>`).join('');
  await mkdir(resolve(output, path.slice(1)), { recursive: true });
  await writeFile(resolve(output, path.slice(1), 'index.html'), document({ ...c, title: `${c.mediaTitle} | AuroraView`, description: c.mediaIntro }, path, `<main id="main" class="container media-page"><h1>${c.mediaTitle}</h1><p>${c.mediaIntro}</p><dl>${items}</dl>${a(home, `${c.back} ↗`, 'text-link')}</main>`));
}
const en = content.en;
await copyFile(resolve(root, 'node_modules/@fontsource-variable/geist/LICENSE'), resolve(output, 'assets/fonts/LICENSE'));
await writeFile(resolve(output, '404.html'), document(en, '/404.html', `<main id="main" class="container media-page"><h1>${en.notFound}</h1>${a('/', en.back, 'text-link')}</main>`));
await writeFile(resolve(output, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://try-auroraview.github.io/sitemap.xml\n');
await writeFile(resolve(output, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ['/', '/zh/', '/ecosystem/', '/zh/ecosystem/', '/how-it-works/', '/zh/how-it-works/', '/media/', '/zh/media/'].map((p) => `<url><loc>https://try-auroraview.github.io${p}</loc></url>`).join('') + '</urlset>');
await writeFile(resolve(output, '.nojekyll'), '');
await writeFile(resolve(output, 'llms.txt'), `# AuroraView\n\nAuroraView brings familiar web interfaces into creative software, with a Rust core, Python API, and TypeScript SDK. Human UI and Agent access use declared capabilities; a page does not automatically become an Agent tool.\n\n- Website: https://try-auroraview.github.io/\n- Chinese: https://try-auroraview.github.io/zh/\n- How it works: https://try-auroraview.github.io/how-it-works/\n- Host evidence: https://try-auroraview.github.io/ecosystem/\n- Machine-readable matrix: https://try-auroraview.github.io/data/ecosystem.json\n- Documentation: ${links.docs}\n- Source: ${links.source}\n- SDK: ${links.sdk}\n- Examples: ${links.examples}\n- Releases: ${links.releases}\n\ncall() is request/response; send_event() notifies Python; Python emit() delivers to JavaScript on() subscribers through trigger(). Host adapters own scene APIs, native docking, permitted-thread dispatch, and cleanup. The current AuroraViewAdapter exposes eval_js, screenshot, load_url, and load_html; scene tools require explicit host/Skill registration. Shared DCC-MCP Core attachment remains proposed. Source, tests, native build, live-host scene readback, and cleanup are distinct evidence gates. The dated DCC-MCP directory is not AuroraView coverage.\n`);
console.log('Built English and Chinese pages, media credits, metadata, and responsive assets.');
