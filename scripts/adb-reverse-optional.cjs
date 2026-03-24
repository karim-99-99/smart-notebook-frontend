/**
 * USB: forwards device localhost:8082 -> PC (Metro). Wi-Fi-only: adb may be absent; ignore failure.
 */
const { execSync } = require('child_process');

const PORT = process.env.METRO_PORT || '8082';

try {
  execSync(`adb reverse tcp:${PORT} tcp:${PORT}`, { stdio: 'inherit' });
} catch {
  console.log('[adb-reverse-optional] adb reverse skipped (no device / Wi-Fi only - OK)');
}
