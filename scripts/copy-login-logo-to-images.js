#!/usr/bin/env node
/**
 * Copy the logo used on the login page (mobile/src/assets/logo.png)
 * to both image folders so they stay in sync.
 * Run from mobile folder: node scripts/copy-login-logo-to-images.js
 */
const fs = require('fs');
const path = require('path');

const ASSETS_LOGO = path.join(__dirname, '..', 'src', 'assets', 'logo.png');
const MOBILE_IMAGES = path.join(__dirname, '..', 'images');
const WINDOWS_IMAGES = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  'SmartNotebook',
  'images'
);

if (!fs.existsSync(ASSETS_LOGO)) {
  console.error('Login logo not found at:', ASSETS_LOGO);
  process.exit(1);
}

function copyTo(dir, name) {
  const dest = path.join(dir, name);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(ASSETS_LOGO, dest);
    console.log('  ->', dest);
    return true;
  } catch (e) {
    console.error('  Failed', dest, e.message);
    return false;
  }
}

console.log('Copying login page logo to both image folders...');
console.log('Source:', ASSETS_LOGO);

let ok = 0;
if (copyTo(MOBILE_IMAGES, 'logo.png')) ok++;
if (copyTo(MOBILE_IMAGES, 'logo.jpg')) ok++;
if (copyTo(WINDOWS_IMAGES, 'logo.png')) ok++;
if (copyTo(WINDOWS_IMAGES, 'logo.jpg')) ok++;

console.log('Done. Copied to', ok, 'destination(s).');
console.log('Paths updated: mobile/images, SmartNotebook/images');
