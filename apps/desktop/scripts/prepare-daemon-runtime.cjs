const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const desktopRoot = path.join(__dirname, '..');
const workspaceRoot = path.join(desktopRoot, '..', '..');
const daemonRoot = path.join(desktopRoot, '..', 'daemon');
const stageRoot = path.join(desktopRoot, 'daemon-runtime');
const stageNodeModules = path.join(stageRoot, 'node_modules');
const stagePackageJson = path.join(stageRoot, 'package.json');

const nodeRoot = path.join(
  desktopRoot,
  'resources',
  'nodejs',
  'win32-x64',
  'node-v20.18.1-win-x64',
);
const nodeExe = path.join(nodeRoot, 'node.exe');
const npmCli = path.join(nodeRoot, 'node_modules', 'npm', 'bin', 'npm-cli.js');

function copyPackageDir(sourceDir, destDir) {
  fs.rmSync(destDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destDir), { recursive: true });
  fs.cpSync(sourceDir, destDir, { recursive: true, force: true });
}

function resolvePackageDir(specifier, basedir) {
  const pkgJson = require.resolve(`${specifier}/package.json`, { paths: [basedir, workspaceRoot] });
  return path.dirname(pkgJson);
}

if (process.platform !== 'win32') {
  console.log('[prepare-daemon-runtime] Skipping: Windows-only helper');
  process.exit(0);
}

if (!fs.existsSync(nodeExe) || !fs.existsSync(npmCli)) {
  throw new Error(
    `Bundled Node/npm not found at ${nodeExe} / ${npmCli}. Run download:nodejs first.`,
  );
}

const nodePtyDir = resolvePackageDir('node-pty', daemonRoot);
const nodeAddonApiDir = resolvePackageDir('node-addon-api', nodePtyDir);

console.log('[prepare-daemon-runtime] Creating isolated daemon runtime...');
fs.rmSync(stageRoot, { recursive: true, force: true });
fs.mkdirSync(stageNodeModules, { recursive: true });
fs.writeFileSync(stagePackageJson, JSON.stringify({ private: true }, null, 2));

console.log('[prepare-daemon-runtime] Installing better-sqlite3 with bundled Node 20...');
execFileSync(
  nodeExe,
  [npmCli, 'install', '--no-save', 'better-sqlite3@12.8.0'],
  {
    cwd: stageRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      npm_config_runtime: 'node',
      npm_config_target: '20.18.1',
      npm_config_build_from_source: 'false',
    },
  },
);

console.log('[prepare-daemon-runtime] Done');
copyPackageDir(nodePtyDir, path.join(stageNodeModules, 'node-pty'));
copyPackageDir(nodeAddonApiDir, path.join(stageNodeModules, 'node-addon-api'));
execFileSync(nodeExe, ['-e', "require('./node_modules/better-sqlite3'); console.log('daemon-runtime better-sqlite3 ok ' + process.versions.modules)"], {
  cwd: stageRoot,
  stdio: 'inherit',
  env: process.env,
});
execFileSync(nodeExe, ['-e', "require('./node_modules/node-pty'); console.log('daemon-runtime node-pty ok ' + process.versions.modules)"], {
  cwd: stageRoot,
  stdio: 'inherit',
  env: process.env,
});
