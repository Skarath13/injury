const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const wranglerConfigPath = path.join(projectRoot, 'wrangler.toml');

function getTurnstileSiteKey() {
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  }

  const wranglerConfig = fs.readFileSync(wranglerConfigPath, 'utf8');
  const match = wranglerConfig.match(/^\s*NEXT_PUBLIC_TURNSTILE_SITE_KEY\s*=\s*"([^"]+)"\s*$/m);

  if (!match) {
    throw new Error('NEXT_PUBLIC_TURNSTILE_SITE_KEY must be set in the build environment or wrangler.toml.');
  }

  return match[1];
}

const build = spawnSync('npx', ['@cloudflare/next-on-pages@1'], {
  cwd: projectRoot,
  env: {
    ...process.env,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: getTurnstileSiteKey()
  },
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

require('./write-cloudflare-assetsignore');
