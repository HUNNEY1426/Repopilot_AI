import { spawn } from 'node:child_process';

console.log('\x1b[36m%s\x1b[0m', '=====================================================');
console.log('\x1b[36m%s\x1b[0m', '   RepoPilot AI - GitHub Project Reviewer Starting   ');
console.log('\x1b[36m%s\x1b[0m', '=====================================================');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: './backend',
  stdio: 'inherit',
  shell: true,
});

const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: './frontend',
  stdio: 'inherit',
  shell: true,
});

function cleanup() {
  console.log('\nShutting down RepoPilot services...');
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
