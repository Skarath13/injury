#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const COMMANDS = new Set(['audit', 'check', 'strip']);
const RASTER_PATTERN = /\.(?:avif|gif|jpe?g|png|webp)$/i;
const TRACKED_ROOT_PATTERN = /^(?:app|public|tmp)\//;
const DISALLOWED_METADATA_PATTERNS = [
  /^\s*profile-/i,
  /^\s*exif:/i,
  /^\s*xmp:/i,
  /^\s*iptc:/i,
  /^\s*icc:/i,
  /^\s*photoshop:/i,
  /^\s*comment:/i,
  /^\s*software:/i,
  /^\s*png:text/i,
  /^\s*png:iTXt/i,
  /^\s*png:tEXt/i,
  /^\s*png:zTXt/i
];

const command = process.argv[2] || 'audit';

if (!COMMANDS.has(command)) {
  console.error(`Unknown command "${command}". Use audit, check, or strip.`);
  process.exit(2);
}

ensureImageMagick();

const files = trackedRasterFiles();

if (!files.length) {
  console.log('No tracked raster images found under public/, app/, or tmp/.');
  process.exit(0);
}

if (command === 'strip') {
  stripFiles(files);
}

const findings = auditFiles(files);

if (!findings.length) {
  console.log(`Image metadata check passed for ${files.length} tracked raster image(s).`);
  process.exit(0);
}

for (const finding of findings) {
  console.log(`\n${finding.file}`);
  for (const line of finding.lines) {
    console.log(`  ${line}`);
  }
}

if (command === 'check') {
  console.error(`\nFound disallowed metadata in ${findings.length} image(s). Run npm run image:metadata:strip.`);
  process.exit(1);
}

console.log(`\nFound disallowed metadata in ${findings.length} image(s).`);

function trackedRasterFiles() {
  const output = execFileSync('git', ['ls-files'], { encoding: 'utf8' });

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => TRACKED_ROOT_PATTERN.test(file))
    .filter((file) => RASTER_PATTERN.test(file))
    .filter((file) => !file.includes('/node_modules/') && !file.includes('/.next/'))
    .filter((file) => existsSync(file));
}

function auditFiles(imageFiles) {
  const findings = [];

  for (const file of imageFiles) {
    const verbose = execFileSync('magick', ['identify', '-verbose', file], { encoding: 'utf8' });
    const lines = verbose
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => DISALLOWED_METADATA_PATTERNS.some((pattern) => pattern.test(line)));

    if (lines.length) {
      findings.push({ file, lines });
    }
  }

  return findings;
}

function stripFiles(imageFiles) {
  for (const file of imageFiles) {
    const tempDir = mkdtempSync(join(tmpdir(), 'image-strip-'));
    const tempFile = join(tempDir, basename(file));
    const result = spawnSync('magick', [file, '-strip', tempFile], {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    if (result.status !== 0) {
      rmSync(tempDir, { recursive: true, force: true });
      console.error(result.stderr || result.stdout || `Unable to strip ${file}`);
      process.exit(result.status || 1);
    }

    renameSync(tempFile, join(dirname(file), basename(file)));
    rmSync(tempDir, { recursive: true, force: true });
  }

  console.log(`Stripped metadata from ${imageFiles.length} tracked raster image(s).`);
}

function ensureImageMagick() {
  const result = spawnSync('magick', ['-version'], {
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.status !== 0) {
    console.error('ImageMagick is required for image metadata auditing. Install the magick CLI and retry.');
    process.exit(1);
  }
}
