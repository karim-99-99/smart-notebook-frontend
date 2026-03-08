#!/usr/bin/env node
/**
 * Sync all mobile files from current (WSL) project to Windows path.
 * Run from repo root: node mobile/scripts/sync-all-to-windows.js
 * Or from mobile: node scripts/sync-all-to-windows.js
 */
const fs = require('fs');
const path = require('path');

const isWsl = process.platform === 'linux' && (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP));
const mobileRoot = path.resolve(__dirname, '..');
const windowsRoot = isWsl
  ? '/mnt/c/Users/DELL/SmartNotebook/mobile'
  : path.join(process.env.USERPROFILE || '', 'SmartNotebook', 'mobile');

const EXCLUDE = new Set(['node_modules', '.gradle', 'build', '.expo', 'dist', '.git', 'android/app/build', 'ios/build']);

function shouldExclude(relPath) {
  const parts = relPath.split(path.sep);
  return parts.some(p => EXCLUDE.has(p));
}

function copyRecursive(srcDir, destDir, relBase = '') {
  let count = 0;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const e of entries) {
    const rel = path.join(relBase, e.name);
    if (shouldExclude(rel)) continue;
    const srcPath = path.join(srcDir, e.name);
    const destPath = path.join(destDir, e.name);
    if (e.isDirectory()) {
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      count += copyRecursive(srcPath, destPath, rel);
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

if (!fs.existsSync(mobileRoot)) {
  console.error('Mobile root not found:', mobileRoot);
  process.exit(1);
}
if (!fs.existsSync(windowsRoot)) {
  fs.mkdirSync(windowsRoot, { recursive: true });
}

let total = 0;
for (const dir of ['src', 'scripts']) {
  const src = path.join(mobileRoot, dir);
  const dest = path.join(windowsRoot, dir);
  if (fs.existsSync(src)) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    total += copyRecursive(src, dest, dir);
  }
}
const rootFiles = ['App.tsx', 'index.js', 'app.json', 'babel.config.js', 'metro.config.js', 'package.json', 'tsconfig.json', 'eas.json'];
for (const f of rootFiles) {
  const src = path.join(mobileRoot, f);
  const dest = path.join(windowsRoot, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    total++;
  }
}

console.log('Synced', total, 'items to', windowsRoot);
process.exit(0);
