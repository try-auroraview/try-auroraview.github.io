import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const decode = (value) => value.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&amp;', '&');
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const attributes = (source) => Object.fromEntries([...source.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]));
function wrap(text, width, fontSize) {
  const measure = (line) => [...line].reduce((sum, character) => sum + fontSize * (character.charCodeAt(0) > 255 ? 1 : .54), 0);
  const lines = [];
  let current = '';
  for (const character of text) {
    current += character;
    if (measure(current) > width) {
      const space = current.lastIndexOf(' ');
      const at = space > 0 ? space : current.length - 1;
      lines.push(current.slice(0, at).trim());
      current = current.slice(at).trimStart();
    }
  }
  lines.push(current);
  return lines;
}
const zh = {
  title: '当前源码：AuroraView 的 Web 契约与原生宿主边界',
  people: '<b>人 / Web 界面</b><br>HTML / CSS / React / Vue<br>AI 辅助前端开发',
  agents: '<b>Agent / 可选的 DCC-MCP</b><br>显式工具与限定范围的注册<br>不会自动把界面转换成工具',
  sdk: '<b>JavaScript / TypeScript SDK</b><br>call() / api.* / on() / trigger()',
  mcp: '<b>AuroraViewAdapter + 服务</b><br>eval_js / screenshot / load_url / load_html<br>会话标识与 FileRegistry 注册',
  core: '<b>AuroraView 共享核心与 API 契约</b><br>Rust / IPC / Python + PyO3 / WebView 后端抽象<br>请求、响应与事件',
  browser: '<b>可选的浏览器能力</b><br>标签页 / 窗口 / 存储 / 运行时消息<br>实际行为取决于后端和功能配置',
  extensions: '<b>可选的扩展与插件</b><br>Manifest / 生命周期 / 消息 / API 兼容<br>兼容性需按具体 API 验证',
  adapter: '<b>原生宿主适配器</b><br>Qt / Python，或引擎原生集成<br>宿主 API / 停靠 / UI 线程调度 / 焦点 / 关闭',
  host: '<b>创作应用 / 宿主拥有生命周期</b><br>Maya / Houdini / Nuke / Blender / Unreal / Unity<br>每个目标都需要独立的原生与交互验收',
  pack: '<b>打包与分发</b><br><br>构建时路径<br>前端资源<br>Python 服务<br>原生应用启动<br><br>平台对应的分发产物<br>CLI / wheel / Gallery / 应用<br><br>不替代原生宿主适配',
  scope: '<b>当前 Agent 会话上下文</b><br>窗口标题 / URL / PID / CDP 端口 / 宿主<br>场景工具与场景上下文<br>需要额外的宿主或 Skill 注册',
  sta: 'Windows WebView2 对象留在创建它的 STA 线程。宿主调度与生命周期属于适配器。',
  'sdk-core': '调用 / 事件', 'mcp-core': '配置的工具', 'adapter-host': '宿主 API', 'core-pack': '构建输入',
  note: '实线：运行时契约与能力。虚线：构建时打包。图中的宿主是架构目标，不代表已经完整支持。',
};
const proposedZh = {
  title: '计划中的共享运行时：同一宿主能力，两条调用入口',
  people: '<b>人 / Web 界面</b><br>现代前端开发<br>AI 辅助实现界面',
  agents: '<b>Agent / 显式工具与 Skill</b><br>参数、结果、错误和线程要求<br>复用同一宿主业务能力',
  ui: '<b>AuroraView</b><br>WebView / 渲染 / HTML 与资源<br>前端桥接与事件<br>原生区域显示与停靠',
  thin: '<b>薄集成层 / 计划</b><br>显式调用与事件映射<br>运行时附着、连接和订阅<br>资源所有权与释放',
  mcp: '<b>DCC-MCP Core / 已有基础设施</b><br>Server / MCP / 工具与 Skill 注册<br>宿主执行桥与诊断<br>服务生命周期',
  ownership: '<b>计划中的资源所有权</b><br><br>优先附着已有宿主服务<br>缺少资源时按需创建<br><br>面板释放自己的连接与任务<br>借用服务仍由宿主拥有<br>创建者完整关闭自己拥有的资源<br>关闭应可重复调用',
  bridge: '<b>宿主执行桥与原生适配器</b><br>主线程调度 / 场景 API / 原生窗口 / 事件循环<br>页面与 Agent 共享已声明的业务能力',
  host: '<b>同一个原生宿主实例与生命周期</b><br>Maya / Blender / Unreal / Unity / 其他适配器<br>场景状态与操作结果需要实际回读',
  status: '<b>计划中的整合，不代表重构已经交付</b><br>兼容性、事件与错误映射、所有权、重连、原生停靠和真实宿主行为，仍需实现与验收。',
  note: 'AuroraView 保留 Web 资源、渲染、可选浏览器与扩展、构建时打包。DCC-MCP 负责宿主执行和服务基础设施。此图说明职责，不定义新公共 API 名称，也不宣称已经测得的复用比例。',
  'ui-bridge': '原生显示', 'bridge-host': '场景能力',
};

export async function renderDiagrams(output) {
  for (const model of ['architecture', 'architecture-proposed']) await renderModel(output, model);
}

async function renderModel(output, model) {
  const source = (await readFile(resolve(import.meta.dirname, `../public/assets/${model}.drawio`), 'utf8')).replaceAll('\r\n', '\n');
  const dimensions = attributes(source.match(/<mxGraphModel\b([^>]*)/)[1]);
  const width = Number(dimensions.pageWidth);
  const height = Number(dimensions.pageHeight);
  const translations = model === 'architecture' ? zh : proposedZh;
  await writeFile(resolve(output, `${model}.drawio`), source);
  for (const lang of ['en', 'zh']) {
    const cells = [...source.matchAll(/<mxCell\b((?=[^>]*\b(?:vertex|edge)="1")[^>]*)>([\s\S]*?)<\/mxCell>/g)].map((m) => {
      const cell = attributes(m[1]);
      const geometry = attributes(m[2].match(/<mxGeometry\b([^>]*)/)[1]);
      cell.style = Object.fromEntries(cell.style.split(';').filter(Boolean).map((pair) => pair.split('=')));
      cell.geometry = Object.fromEntries(Object.entries(geometry).filter(([k]) => ['x', 'y', 'width', 'height'].includes(k)).map(([k, v]) => [k, Number(v)]));
      if (lang === 'zh') cell.value = translations[cell.id] ?? cell.value;
      return cell;
    });
    const vertices = new Map(cells.filter((c) => c.vertex).map((c) => [c.id, c]));
    const nativeXml = lang === 'en' ? source : source.replace(/<mxCell\b[^>]*>/g, (tag) => {
      const cell = attributes(tag);
      return translations[cell.id] ? tag.replace(/value="[^"]*"/, `value="${escape(translations[cell.id])}"`) : tag;
    });
    const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc" content="${escape(nativeXml)}"><title id="title">${escape(translations.title && lang === 'zh' ? translations.title : cells.find((c) => c.id === 'title').value)}</title><desc id="desc">${escape(lang === 'en' ? 'People and registered agent tools connect through declared contracts to native host adapters. Current source and proposed shared-runtime integration are labeled separately. Host evidence gates remain distinct.' : '人和已注册的 Agent 工具通过显式契约连接原生宿主适配器。当前源码与计划中的共享运行时分别标注，宿主验收单独记录。')}</desc><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 Z" fill="#14674f"/></marker><marker id="build-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#526460"/></marker></defs><rect width="${width}" height="${height}" fill="#f6f7f5"/>`];
    for (const cell of cells.filter((c) => c.edge)) {
      const a = vertices.get(cell.source).geometry;
      const b = vertices.get(cell.target).geometry;
      let x1, y1, x2, y2, path;
      if (cell.id === 'core-pack' || (cell.style.exitX === '1' && cell.style.entryX === '0')) {
        x1 = a.x + a.width; y1 = a.y + a.height / 2; x2 = b.x; y2 = b.y + b.height / 2;
        path = `M${x1},${y1} H${(x1 + x2) / 2} V${y2} H${x2}`;
      } else {
        x1 = a.x + a.width / 2; y1 = a.y + a.height; x2 = b.x + b.width / 2; y2 = b.y;
        path = `M${x1},${y1} V${(y1 + y2) / 2} H${x2} V${y2}`;
      }
      const dashed = cell.style.dashed === '1';
      svg.push(`<path d="${path}" fill="none" stroke="${dashed ? '#526460' : '#14674f'}" stroke-width="${dashed ? 1.4 : 1.8}" ${dashed ? 'stroke-dasharray="5 5"' : ''} marker-end="url(#${dashed ? 'build-arrow' : 'arrow'})"${cell.style.startArrow ? ' marker-start="url(#arrow)"' : ''}/>`);
      if (cell.value) svg.push(`<text x="${(x1 + x2) / 2}" y="${dashed ? y1 - 14 : (y1 + y2) / 2 - 9}" text-anchor="middle" fill="#14674f" font-size="11" font-family="Segoe UI,Microsoft YaHei,sans-serif">${escape(cell.value)}</text>`);
    }
    for (const cell of vertices.values()) {
      const { x, y, width, height } = cell.geometry;
      const textOnly = Object.hasOwn(cell.style, 'text');
      const fontSize = Number(cell.style.fontSize || 14);
      const lines = cell.value.split(/<br\s*\/?>(?:\s*)/i).flatMap((v) => wrap(v.replace(/<[^>]*>/g, ''), width - (textOnly ? 0 : 30), fontSize));
      const lineHeight = fontSize * 1.55;
      if (!textOnly) svg.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${cell.style.fillColor}" stroke="${cell.style.strokeColor}"${cell.style.dashed ? ' stroke-dasharray="5 5"' : ''}/>`);
      const start = textOnly ? y + fontSize + 5 : y + height / 2 - (lines.length - 1) * lineHeight / 2 + fontSize * .35;
      lines.forEach((line, index) => {
        svg.push(`<text x="${textOnly ? x : x + width / 2}" y="${start + index * lineHeight}" text-anchor="${textOnly ? 'start' : 'middle'}" fill="${cell.style.fontColor || '#172b2a'}" font-size="${fontSize}" font-weight="${index === 0 && (cell.value.includes('<b>') || cell.style.fontStyle === '1') ? 600 : 400}" font-family="Segoe UI,Microsoft YaHei,Noto Sans CJK SC,sans-serif">${escape(line)}</text>`);
      });
    }
    const sourceLabel = model === 'architecture'
      ? (lang === 'en' ? 'Source: github.com/try-auroraview/auroraview (core, SDK, python/dcc_mcp, extensions, pack). Reviewed 2026-10-08.' : '来源：github.com/try-auroraview/auroraview（core、SDK、python/dcc_mcp、extensions、pack）。核对日期 2026-10-08。')
      : (lang === 'en' ? 'Proposed direction reviewed 2026-10-09. Infrastructure reference: github.com/dcc-mcp/dcc-mcp-core. Integration is not yet delivered.' : '计划方向核对日期 2026-10-09。基础设施参考：github.com/dcc-mcp/dcc-mcp-core。整合尚未交付。');
    svg.push(`<text x="40" y="${height - 30}" fill="#526460" font-size="11" font-family="Segoe UI,Microsoft YaHei,sans-serif">${sourceLabel}</text></svg>`);
    const data = svg.join('');
    await writeFile(resolve(output, `${model}-${lang}.svg`), data);
    await sharp(Buffer.from(data), { density: 144 }).png().toFile(resolve(output, `${model}-${lang}.png`));
    if (lang === 'zh') await writeFile(resolve(output, `${model}-zh.drawio`), nativeXml);
    if (lang === 'en') await writeFile(resolve(output, `${model}.svg`), data);
  }
}
