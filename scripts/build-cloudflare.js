const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const workerDistRoot = path.join(projectRoot, '.vercel/output/static/_worker.js/__next-on-pages-dist__');

const build = spawnSync('npx', ['@cloudflare/next-on-pages@1'], {
  cwd: projectRoot,
  env: process.env,
  shell: process.platform === 'win32',
  stdio: 'inherit'
});

if (build.error) {
  throw build.error;
}

if (build.signal) {
  console.error(`Cloudflare build exited from signal ${build.signal}`);
  process.exit(1);
}

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

function normalizeNodeCompatImports(directory) {
  if (!fs.existsSync(directory)) return 0;

  let updatedFiles = 0;
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      updatedFiles += normalizeNodeCompatImports(entryPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;

    const source = fs.readFileSync(entryPath, 'utf8');
    const normalized = source
      .replace(/from(["'])async_hooks\1/g, 'from$1node:async_hooks$1')
      .replace(/import\((["'])async_hooks\1\)/g, 'import($1node:async_hooks$1)');

    if (normalized !== source) {
      fs.writeFileSync(entryPath, normalized);
      updatedFiles += 1;
    }
  }

  return updatedFiles;
}

const normalizedImportCount = normalizeNodeCompatImports(workerDistRoot);
if (normalizedImportCount > 0) {
  console.log(`Normalized node:async_hooks imports in ${normalizedImportCount} Cloudflare worker module(s).`);
}

require('./write-cloudflare-assetsignore');
