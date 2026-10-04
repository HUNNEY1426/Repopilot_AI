import { spawn, execSync } from 'node:child_process';
import readline from 'node:readline';

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '=====================================================');
console.log('\x1b[1;36m%s\x1b[0m', '   RepoPilot AI - Multi-Service Dev Runner          ');
console.log('\x1b[36m%s\x1b[0m', '=====================================================');
console.log('\x1b[1;36m[BACKEND]\x1b[0m  API Server  -> \x1b[4;34mhttp://localhost:5000\x1b[0m');
console.log('\x1b[1;35m[FRONTEND]\x1b[0m Web App UI  -> \x1b[4;34mhttp://localhost:5173\x1b[0m');
console.log('\x1b[90m%s\x1b[0m', 'Press Ctrl+C to gracefully stop both services');
console.log('\x1b[36m%s\x1b[0m', '=====================================================\n');

function attachLogger(child, prefix, colorCode) {
  const cleanLine = (line) => line.replace(/\x1b\[2J|\x1b\[0f|\x1b\[3J|\x1b\[H/g, '');

  if (child.stdout) {
    const rlOut = readline.createInterface({ input: child.stdout });
    rlOut.on('line', (line) => {
      const cleaned = cleanLine(line);
      if (cleaned.trim()) {
        console.log(`${colorCode}${prefix}\x1b[0m ${cleaned}`);
      }
    });
  }

  if (child.stderr) {
    const rlErr = readline.createInterface({ input: child.stderr });
    rlErr.on('line', (line) => {
      const cleaned = cleanLine(line);
      if (cleaned.trim()) {
        console.error(`${colorCode}${prefix}\x1b[0m \x1b[31m${cleaned}\x1b[0m`);
      }
    });
  }
}

const backend = spawn(`${npmCmd} run dev`, {
  cwd: './backend',
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' },
});

const frontend = spawn(`${npmCmd} run dev`, {
  cwd: './frontend',
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' },
});

attachLogger(backend, '[BACKEND] ', '\x1b[1;36m');
attachLogger(frontend, '[FRONTEND]', '\x1b[1;35m');

let isExiting = false;
function cleanup() {
  if (isExiting) return;
  isExiting = true;

  console.log('\n\x1b[33mShutting down RepoPilot services...\x1b[0m');

  if (isWin) {
    try {
      if (backend.pid) execSync(`taskkill /pid ${backend.pid} /T /F`, { stdio: 'ignore' });
    } catch {}
    try {
      if (frontend.pid) execSync(`taskkill /pid ${frontend.pid} /T /F`, { stdio: 'ignore' });
    } catch {}
  } else {
    try { backend.kill('SIGTERM'); } catch {}
    try { frontend.kill('SIGTERM'); } catch {}
  }

  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
