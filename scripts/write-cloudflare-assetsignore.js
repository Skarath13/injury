const fs = require('fs');
const path = require('path');

const staticOutputDir = path.join(__dirname, '..', '.vercel', 'output', 'static');
const assetsIgnorePath = path.join(staticOutputDir, '.assetsignore');

if (!fs.existsSync(staticOutputDir)) {
  throw new Error(`Cloudflare static output directory does not exist: ${staticOutputDir}`);
}

fs.writeFileSync(assetsIgnorePath, '_worker.js\n');
console.log(`Wrote ${path.relative(path.join(__dirname, '..'), assetsIgnorePath)}`);
