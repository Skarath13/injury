const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');

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

require('./write-cloudflare-assetsignore');
