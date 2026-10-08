import { readFile } from 'node:fs/promises';

export const ecosystem = JSON.parse(await readFile(new URL('../data/ecosystem.json', import.meta.url), 'utf8'));
export const allHosts = [...ecosystem.catalog.products, ...ecosystem.catalog.applicationRoutes];

export function hostRecord(id) {
  const catalog = allHosts.find((host) => host.id === id);
  if (!catalog) throw new Error(`Unknown ecosystem host: ${id}`);
  const integration = ecosystem.integrations[id] || {};
  const dccMcp = {
    status: 'catalog',
    url: `https://github.com/dcc-mcp/${catalog.adapter}`,
    en: `${catalog.adapter}. Listed in the dated DCC-MCP snapshot; catalog installation ${catalog.install ? 'listed' : 'not listed'}. This does not establish AuroraView host support.`,
    zh: `${catalog.adapter}。已收录于注明日期的 DCC-MCP 快照；${catalog.install ? '目录列出安装入口' : '目录未列出安装入口'}。这不代表 AuroraView 已支持该宿主。`,
  };
  const gates = Object.fromEntries(ecosystem.gates.map(({ id: gate }) => [gate, gate === 'dccMcp' ? dccMcp : { ...ecosystem.defaults[gate], ...integration[gate] }]));
  return { ...catalog, repository: integration.repository, gates };
}

export const focusHosts = ecosystem.focus.map(hostRecord);
