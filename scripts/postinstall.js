#!/usr/bin/env node

/**
 * Postinstall script that applies patches gracefully
 * Handles cases where packages might not be installed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const patchesDir = path.join(__dirname, '..', 'patches');

// Check if patches directory exists
if (!fs.existsSync(patchesDir)) {
  process.exit(0);
}

// Get all patch files
const patchFiles = fs.readdirSync(patchesDir).filter(file => file.endsWith('.patch'));

if (patchFiles.length === 0) {
  process.exit(0);
}

// Run patch-package - it will apply patches for installed packages
// We catch errors because some packages might not be installed
try {
  execSync('npx patch-package', {
    stdio: 'pipe', // Use pipe instead of inherit to suppress errors for missing packages
    cwd: path.join(__dirname, '..'),
  });
} catch (error) {
  // Don't fail the install if patches fail
  // This can happen if packages are missing or patches are outdated
  // The error output will show which packages failed, but we continue anyway
  const stderr = error.stderr ? error.stderr.toString() : '';
  if (stderr.includes('ENOENT') || stderr.includes('no such file')) {
    // This is expected for packages that aren't installed
    console.log('ℹ️  Some patches skipped (packages not installed)');
  } else {
    // Other errors might be important, but we still don't fail the install
    console.warn('⚠️  Some patches may have failed');
  }
}

