/**
 * Free port 8081 (Metro) then start Metro — avoids EADDRINUSE on Windows.
 * If 8081 is svchost, the PowerShell script exits 1 and we do not start.
 */
const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const ps1 = path.join(__dirname, 'kill-metro-8081.ps1');

execSync(
  `powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1}" -Port 8081`,
  { stdio: 'inherit', cwd: root },
);

execSync('npx react-native start --port 8081 --host 0.0.0.0', {
  stdio: 'inherit',
  cwd: root,
});
