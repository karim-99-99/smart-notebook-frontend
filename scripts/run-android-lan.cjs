#!/usr/bin/env node
/**
 * Wi‑Fi / same-LAN dev: embed this PC's IPv4 in the debug APK so the phone loads JS from Metro
 * (localhost on the phone is wrong — it points at the phone, not your computer).
 */
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const mobileRoot = path.join(__dirname, '..');

function pickLanIPv4() {
  const nets = os.networkInterfaces();
  const preferred = [];
  const fallback = [];
  for (const name of Object.keys(nets)) {
    const low = name.toLowerCase();
    for (const net of nets[name] || []) {
      const fam = net.family;
      if ((fam === 'IPv4' || fam === 4) && !net.internal) {
        const rec = { address: net.address, name };
        if (/wi-?fi|wlan|wireless|eth|以太|vEthernet/i.test(low)) preferred.push(rec);
        else fallback.push(rec);
      }
    }
  }
  const first = [...preferred, ...fallback][0];
  return first ? first.address : null;
}

const existing = process.env.REACT_NATIVE_PACKAGER_HOSTNAME?.trim();
const ip = existing || pickLanIPv4();

if (!ip) {
  console.error(
    '[run-android-lan] No LAN IPv4 found. Set REACT_NATIVE_PACKAGER_HOSTNAME to your PC IP (ipconfig) and retry.',
  );
  process.exit(1);
}

process.env.REACT_NATIVE_PACKAGER_HOSTNAME = ip;
console.log(`[run-android-lan] REACT_NATIVE_PACKAGER_HOSTNAME=${ip}`);
console.log('[run-android-lan] Metro must listen on all interfaces: npm run start');
const METRO_PORT = process.env.METRO_PORT || '8082';
console.log(`[run-android-lan] If it still fails, allow TCP ${METRO_PORT} inbound in Windows Firewall for Node.js.\n`);

try {
  execSync(`adb reverse tcp:${METRO_PORT} tcp:${METRO_PORT}`, { stdio: 'inherit', cwd: mobileRoot });
} catch {
  console.log('[run-android-lan] adb reverse skipped (Wi-Fi only - OK)\n');
}

execSync(`npx react-native run-android --port ${METRO_PORT}`, {
  stdio: 'inherit',
  cwd: mobileRoot,
  env: process.env,
});
