import { access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 19)) {
  throw new Error(`Node >=22.19 is required. Run this task through vx just (actual ${process.versions.node}).`);
}
const directory = dirname(process.execPath);
const npm = process.platform === 'win32'
  ? resolve(directory, 'node_modules/npm/bin/npm-cli.js')
  : resolve(directory, '../lib/node_modules/npm/bin/npm-cli.js');
await access(npm);
const result = spawnSync(process.execPath, [npm, ...process.argv.slice(2)], { stdio: 'inherit', env: process.env });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
