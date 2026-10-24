const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🚀 Starting Ward 5 Voting System (Backend + Frontend)');
console.log('====================================================\n');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'backend'),
  stdio: 'inherit',
});

const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'frontend'),
  stdio: 'inherit',
});

function cleanup() {
  console.log('\n🛑 Shutting down backend and frontend...');
  try {
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
  } catch (_) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

backend.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`⚠️ Backend exited with code ${code}`);
  }
});

frontend.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`⚠️ Frontend exited with code ${code}`);
  }
});
