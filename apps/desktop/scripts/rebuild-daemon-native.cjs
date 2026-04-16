const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const desktopRoot = path.join(__dirname, '..');
const daemonRoot = path.join(desktopRoot, '..', 'daemon');
const nodeRoot = path.join(
  desktopRoot,
  'resources',
  'nodejs',
  'win32-x64',
  'node-v20.18.1-win-x64',
);
const nodeExe = path.join(nodeRoot, 'node.exe');
const npmCli = path.join(nodeRoot, 'node_modules', 'npm', 'bin', 'npm-cli.js');

if (process.platform !== 'win32') {
  console.log('[rebuild-daemon-native] Skipping: Windows-only helper');
  process.exit(0);
}

if (!fs.existsSync(nodeExe) || !fs.existsSync(npmCli)) {
  throw new Error(
    `Bundled Node/npm not found at ${nodeExe} / ${npmCli}. Run download:nodejs first.`,
  );
}

console.log('[rebuild-daemon-native] Rebuilding better-sqlite3 with bundled Node 20...');
execFileSync(nodeExe, [npmCli, 'rebuild', 'better-sqlite3'], {
  cwd: daemonRoot,
  stdio: 'inherit',
  env: process.env,
});
console.log('[rebuild-daemon-native] Done');
