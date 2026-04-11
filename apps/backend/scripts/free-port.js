const { execSync } = require('node:child_process');

function getPortFromArgs() {
  const raw = process.argv[2] || '3001';
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid port: ${raw}`);
  }
  return port;
}

function killOnWindows(port) {
  const output = execSync(`netstat -ano -p tcp | findstr :${port}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  const pids = new Set();
  for (const line of output.split(/\r?\n/)) {
    if (!line.includes('LISTENING')) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid)) pids.add(pid);
  }

  if (pids.size === 0) return;

  for (const pid of pids) {
    execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
    console.log(`[free-port] Killed PID ${pid} on port ${port}`);
  }
}

function killOnUnix(port) {
  const output = execSync(`lsof -ti tcp:${port}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  const pids = output
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter((x) => /^\d+$/.test(x));

  if (pids.length === 0) return;

  execSync(`kill -9 ${pids.join(' ')}`, { stdio: 'ignore' });
  console.log(`[free-port] Killed PID(s) ${pids.join(', ')} on port ${port}`);
}

function main() {
  const port = getPortFromArgs();

  try {
    if (process.platform === 'win32') {
      killOnWindows(port);
    } else {
      killOnUnix(port);
    }
  } catch {
    // If no process is listening (or command unavailable), continue silently.
  }
}

main();
