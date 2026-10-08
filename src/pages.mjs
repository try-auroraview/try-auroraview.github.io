import { ecosystem, focusHosts, hostRecord } from './ecosystem.mjs';
import { principles } from './principles.mjs';

const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const link = (url, label, cls = '') => `<a${cls ? ` class="${cls}"` : ''} href="${escape(url)}">${escape(label)}</a>`;
const locale = (lang) => lang === 'zh' ? '/zh/' : '/';
const words = {
  en: {
    title: 'DCC ecosystem and host evidence',
    intro: 'A complete ecosystem joins native interfaces, host services, explicit Agent contracts, installation, and end-to-end examples. This matrix records that work per host. DCC-MCP catalog presence and AuroraView acceptance are separate facts.',
    focus: 'Host integrations in focus', all: 'The broader ecosystem target', routes: 'Additional application routes',
    expand: 'Expand a host to inspect all seven responsibilities.', source: 'AuroraView host source', reference: 'Source / installation reference',
    directory: 'Open the complete host matrix', principles: 'Follow a click through the architecture',
    snapshot: 'Directory snapshot', reviewed: 'AuroraView evidence reviewed', catalog: 'Inspect catalog source', data: 'Download matrix data (JSON)',
    snapshotNote: 'The directory below comes from a DCC-MCP snapshot checked on 2 September 2026, with repository references checked on 3 September. It contains 35 product entries and 3 additional application routes. It is not a claim of current AuroraView coverage or an exhaustive current DCC-MCP catalog.',
    targetNote: 'For these entries, AuroraView native UI, shared contracts, examples, scene readback, and cleanup remain ecosystem targets unless a separate record below says otherwise. A directory adapter link alone does not complete those gates.',
    foundation: 'Shared foundation and teaching source', back: 'Return to AuroraView',
  },
  zh: {
    title: 'DCC 生态与宿主验证矩阵',
    intro: '完整配套需要原生界面、宿主服务、显式 Agent 契约、安装和端到端示例一起落地。本矩阵按宿主记录这些工作；DCC-MCP 目录收录与 AuroraView 验收是两项独立事实。',
    focus: '重点宿主集成', all: '更完整的生态建设目标', routes: '其他应用路由',
    expand: '展开宿主，查看七项职责的实际记录。', source: 'AuroraView 宿主源码', reference: '源码 / 安装参考',
    directory: '打开完整宿主矩阵', principles: '沿一次点击了解架构原理',
    snapshot: '目录快照', reviewed: 'AuroraView 证据核对', catalog: '查看目录来源', data: '下载矩阵数据（JSON）',
    snapshotNote: '下方目录来自 2026 年 9 月 2 日核对的 DCC-MCP 快照，仓库引用于 9 月 3 日核对，包含 35 个产品条目与 3 个其他应用路由。它不代表 AuroraView 当前已覆盖这些宿主，也不宣称是最新 DCC-MCP 目录全集。',
    targetNote: '除下方另有独立记录外，这些条目的 AuroraView 原生界面、共用契约、示例、场景回读与资源清理均属于生态目标。目录中的适配器链接本身不能完成这些验收项。',
    foundation: '共享基础与教学源码', back: '返回 AuroraView',
  },
};

function hostEntry(host, lang, open = false) {
  const w = words[lang];
  const status = (gate) => ecosystem.statusLabels[gate.status][lang];
  return `<details class="host-entry" id="host-${host.id}"${open ? ' open' : ''}><summary><span class="host-name">${escape(host.name)}</span><span class="host-summary"><span class="status-label">${escape(status(host.gates.verification))}</span><span>${escape(host.gates.verification[lang])}</span></span></summary><div class="host-content">${host.repository ? `<p class="host-source">${link(host.repository, `${w.source} ↗`)}</p>` : ''}<dl class="host-gates">${ecosystem.gates.map((gate) => {
    const record = host.gates[gate.id];
    return `<div data-gate="${gate.id}"><dt>${escape(gate[lang])}</dt><dd><span class="status-label">${escape(status(record))}</span><p>${escape(record[lang])}</p>${record.url ? link(record.url, `${w.reference} ↗`) : ''}</dd></div>`;
  }).join('')}</dl></div></details>`;
}

export function hostIndex(lang) {
  const w = words[lang];
  return `<div class="matrix-intro"><h3>${w.focus}</h3><p>${w.expand}</p></div><div class="host-matrix">${focusHosts.map((host) => hostEntry(host, lang)).join('')}</div><div class="text-links">${link(`${locale(lang)}ecosystem/`, w.directory)}${link(`${locale(lang)}how-it-works/`, w.principles)}</div>`;
}

export function ecosystemPage(lang) {
  const w = words[lang];
  const remaining = ecosystem.catalog.products.filter((host) => !ecosystem.focus.includes(host.id));
  const body = `<main id="main" class="container detail-page"><p class="eyebrow">AURORAVIEW / DCC ECOSYSTEM</p><h1>${w.title}</h1><p class="page-intro">${w.intro}</p><div class="matrix-dates"><span>${w.reviewed}: <time datetime="${ecosystem.reviewedAt}">${ecosystem.reviewedAt}</time></span><span>${w.snapshot}: <time datetime="${ecosystem.catalog.checkedAt}">${ecosystem.catalog.checkedAt}</time></span></div><div class="text-links">${link('/data/ecosystem.json', w.data)}${link(ecosystem.catalog.sourceUrl, w.catalog)}${link(`${locale(lang)}how-it-works/`, w.principles)}</div><section aria-labelledby="focus-hosts"><h2 id="focus-hosts">${w.focus}</h2><p>${w.expand}</p><div class="host-matrix">${focusHosts.map((host, i) => hostEntry(host, lang, i === 0)).join('')}</div></section><section aria-labelledby="target-hosts"><h2 id="target-hosts">${w.all}</h2><p>${w.snapshotNote}</p><p>${w.targetNote}</p><nav class="host-index" aria-label="${w.all}">${remaining.map((host) => link(`#host-${host.id}`, host.name)).join('')}</nav><div class="host-matrix">${remaining.map((host) => hostEntry(hostRecord(host.id), lang)).join('')}</div></section><section aria-labelledby="application-routes"><h2 id="application-routes">${w.routes}</h2><div class="host-matrix">${ecosystem.catalog.applicationRoutes.map((host) => hostEntry(hostRecord(host.id), lang)).join('')}</div></section>${link(locale(lang), w.back, 'text-link')}</main>`;
  return { title: `${w.title} | AuroraView`, description: w.intro, body };
}

const articleList = (entries) => entries.map(([title, detail, label, url]) => `<article><h3>${escape(title)}</h3><p>${escape(detail)}</p>${link(url, `${label} ↗`, 'text-link')}</article>`).join('');

export function principlesPage(lang) {
  const p = principles[lang];
  const home = locale(lang);
  const docs = `https://try-auroraview.github.io/auroraview/${lang === 'zh' ? 'zh/' : ''}`;
  const body = `<main id="main" class="container detail-page principles-page"><p class="eyebrow">AURORAVIEW / HOW IT WORKS</p><h1>${p.title}</h1><p class="page-intro">${p.intro}</p><div class="text-links">${link(`${home}#start`, p.quickLink)}${link(`${home}ecosystem/`, p.matrixLink)}</div><section aria-labelledby="original-model"><h2 id="original-model">${p.originalTitle}</h2><figure class="original-architecture"><img src="/assets/architecture-original.webp" width="1328" height="800" alt="${escape(p.originalAlt)}" loading="lazy" decoding="async"><figcaption>${p.originalCaption}</figcaption></figure><div class="text-links">${link('https://github.com/try-auroraview/auroraview/blob/main/assets/images/architecture.png', lang === 'en' ? 'Original repository image' : '仓库原图')}${link(`${docs}guide/architecture.html`, lang === 'en' ? 'Architecture documentation' : '架构文档')}</div></section><section aria-labelledby="click-flow"><h2 id="click-flow">${p.flowTitle}</h2><ol class="execution-flow">${p.flow.map(([title, detail, label, url], i) => `<li><span class="flow-number" aria-hidden="true">0${i + 1}</span><div><h3>${escape(title)}</h3><p>${escape(detail)}</p>${link(url, `${label} ↗`, 'text-link')}</div></li>`).join('')}</ol></section><section aria-labelledby="communication-model"><h2 id="communication-model">${p.communicationTitle}</h2><p>${p.communicationIntro}</p><div class="protocol-table"><table><caption class="sr-only">${p.communicationTitle}</caption><thead><tr>${p.communicationHeaders.map((label) => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${p.communication.map(([direction, page, host]) => `<tr><th scope="row">${direction}</th><td><code>${escape(page)}</code></td><td><code>${escape(host)}</code></td></tr>`).join('')}</tbody></table></div><p class="contract-note">${p.communicationNote}</p><p>${p.dispatchNote}</p>${link(`${docs}guide/communication.html`, `${p.communicationSource} ↗`, 'text-link')}</section><section aria-labelledby="stack-model"><h2 id="stack-model">${p.stackTitle}</h2><div class="principle-articles">${articleList(p.stack)}</div><aside class="contract-note"><p>${p.engineNote}</p>${link('https://github.com/try-auroraview/auroraview/blob/main/Cargo.toml', `${p.engineSource} ↗`, 'text-link')}</aside></section><section aria-labelledby="agent-model"><h2 id="agent-model">${p.agentTitle}</h2><p>${p.agentDetail}</p>${link('https://github.com/try-auroraview/auroraview/blob/main/python/auroraview/dcc_mcp/adapter.py', `${p.agentSource} ↗`, 'text-link')}</section><section aria-labelledby="lifecycle-model"><h2 id="lifecycle-model">${p.lifecycleTitle}</h2><p>${p.lifecycleDetail}</p>${link(`${home}#shared-runtime`, `${p.lifecycleLink} ↗`, 'text-link')}</section><section aria-labelledby="module-model"><h2 id="module-model">${p.modulesTitle}</h2><div class="principle-articles">${articleList(p.modules)}</div></section><section aria-labelledby="learning-path"><h2 id="learning-path">${p.quickTitle}</h2><p>${p.quickDetail}</p><div class="text-links">${link(`${home}#start`, p.quickLink)}${link(`${home}ecosystem/`, p.matrixLink)}</div></section>${link(home, p.back, 'text-link')}</main>`;
  return { title: `${p.title} | AuroraView`, description: p.intro, body };
}
