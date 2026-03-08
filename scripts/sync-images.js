#!/usr/bin/env node
/**
 * Sync brand images between Windows and WSL paths.
 * Run: node scripts/sync-images.js
 */
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets');
// Sources: mobile/images (WSL) or SmartNotebook/images (Windows)
const MOBILE_IMAGES = path.join(__dirname, '..', 'images');
// Windows path: from PowerShell/CMD use USERPROFILE; from WSL use /mnt/c/Users/<user>
const isWsl = process.platform === 'linux' && process.env.WSL_DISTRO_NAME;
const WINDOWS_IMAGES = isWsl
  ? '/mnt/c/Users/DELL/SmartNotebook/images'
  : path.join(process.env.USERPROFILE || process.env.HOME || '', 'SmartNotebook', 'images');

const IMAGE_MAP = {
  'logo.jpg': ['logo.jpg', 'logo.jpg'],
  'logo-en.jpg': ['logo en.jpg', 'logo en.jpg'],
  'logo-ar.jpg': ['logo ar.jpg', 'logo ar.jpg'],
  'pattern.jpg': ['pattern.jpg', 'pattern.jpg'],
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true});
  }
}

function copyImage(srcPath, destPath) {
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('  Copied:', path.basename(srcPath));
    return true;
  }
  return false;
}

ensureDir(ASSETS_DIR);
console.log('Syncing images to', ASSETS_DIR);

let copied = 0;
for (const [destName, srcNames] of Object.entries(IMAGE_MAP)) {
  const srcName = srcNames[0];
  const destPath = path.join(ASSETS_DIR, destName);
  const srcPaths = [
    path.join(MOBILE_IMAGES, srcName),
    path.join(WINDOWS_IMAGES, srcName),
  ];
  let ok = false;
  for (const srcPath of srcPaths) {
    if (copyImage(srcPath, destPath)) {
      copied++;
      ok = true;
      break;
    }
  }
  // Ensure logo.jpg exists for LoginScreen require - use placeholder if no source
  if (!ok && destName === 'logo.jpg') {
    // Minimal 1x1 transparent PNG (43 bytes)
    const placeholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(destPath, placeholder);
  }
}

console.log(`Done. Copied ${copied} images to assets.`);

// Bidirectional sync: copy FROM assets TO source folders so both paths stay in sync
const SRC_NAMES = { 'logo.jpg': 'logo.jpg', 'logo-en.jpg': 'logo en.jpg', 'logo-ar.jpg': 'logo ar.jpg', 'pattern.jpg': 'pattern.jpg' };
if (copied > 0) {
  for (const [destName, srcNames] of Object.entries(IMAGE_MAP)) {
    const srcPath = path.join(ASSETS_DIR, destName);
    const originalName = srcNames[0];
    if (fs.existsSync(srcPath)) {
      for (const destDir of [MOBILE_IMAGES, WINDOWS_IMAGES]) {
        if (destDir) {
          ensureDir(destDir);
          const destPath = path.join(destDir, originalName);
          try {
            fs.copyFileSync(srcPath, destPath);
          } catch (e) {
            // Ignore if dest not writable
          }
        }
      }
    }
  }
  console.log('Synced images to mobile/images and SmartNotebook/images.');
}

if (copied < Object.keys(IMAGE_MAP).length) {
  console.log('Tip: Place logo.jpg, "logo en.jpg", "logo ar.jpg", pattern.jpg in mobile/images/ or C:\\Users\\<you>\\SmartNotebook\\images\\');
}
