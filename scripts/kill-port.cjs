'use strict';
/**
 * Free a TCP listen port (Metro). Windows: netstat + taskkill. Unix: lsof + kill.
 * Refuses to kill svchost on Windows (use Metro on another port instead).
 */
const { execSync } = require('child_process');
const os = require('os');

const port = parseInt(process.argv[2] || '8082', 10);
if (Number.isNaN(port) || port < 1 || port > 65535) {
  console.error('[kill-port] Bad port:', process.argv[2]);
  process.exit(1);
}

function killWindows() {
  let output = '';
  try {
    output = execSync('netstat -ano', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch (e) {
    console.error('[kill-port] netstat failed:', e.message);
    process.exit(1);
  }

  const pids = new Set();
  const portTag = `:${port}`;
  for (const line of output.split(/\r?\n/)) {
    if (!/LISTENING/i.test(line)) continue;
    if (!line.includes(portTag)) continue;
    const m = line.match(/LISTENING\s+(\d+)\s*$/i);
    if (m) pids.add(m[1]);
  }

  if (pids.size === 0) {
    console.log(`[kill-port] Nothing listening on ${port}.`);
    return;
  }

  for (const pid of pids) {
    let procLine = '';
    try {
      procLine = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
        encoding: 'utf8',
      }).trim();
    } catch (_) {
      procLine = '';
    }
    const nameMatch = procLine.match(/^"([^"]+)"/);
    const image = nameMatch ? nameMatch[1].toLowerCase() : '';

    if (image === 'svchost.exe') {
      console.error(
        `[kill-port] Port ${port} is used by svchost (PID ${pid}). Do not kill. Use Metro on 8082 and update gradle + package.json.`,
      );
      process.exit(1);
    }

    console.log(`[kill-port] Stopping ${image || 'process'} (PID ${pid})`);
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
    } catch {
      console.error(`[kill-port] taskkill failed for PID ${pid}`);
      process.exit(1);
    }
  }
  console.log('[kill-port] Done. Run: npm run start');
}

function killUnix() {
  try {
    const out = execSync(`lsof -ti :${port} -sTCP:LISTEN`, {
      encoding: 'utf8',
    }).trim();
    if (!out) {
      console.log(`[kill-port] Nothing listening on ${port}.`);
      return;
    }
    const pids = [...new Set(out.split(/\n/).filter(Boolean))];
    for (const pid of pids) {
      execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
      console.log(`[kill-port] Stopped PID ${pid}`);
    }
    console.log('[kill-port] Done.');
  } catch (e) {
    if (e.status === 1) {
      console.log(`[kill-port] Nothing listening on ${port}.`);
      return;
    }
    console.error('[kill-port]', e.message);
    process.exit(1);
  }
}

if (os.platform() === 'win32') {
  killWindows();
} else {
  killUnix();
}
