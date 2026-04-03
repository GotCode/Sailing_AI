const { spawn, execSync } = require('child_process');
const http = require('http');

// Start Expo with full stdio inheritance so it stays interactive
const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['expo', 'start', '--web'], { stdio: 'inherit' });

let opened = false;

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, () => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => { req.destroy(); resolve(false); });
  });
}

async function pollAndOpen() {
  const ports = [8081, 8082, 8083, 8084, 8085, 19006];
  for (let i = 0; i < 60 && !opened; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    for (const port of ports) {
      if (await checkPort(port) && !opened) {
        opened = true;
        const url = `http://localhost:${port}`;
        if (process.platform === 'win32') execSync(`start "" "${url}"`);
        else if (process.platform === 'darwin') execSync(`open "${url}"`);
        else execSync(`xdg-open "${url}"`);
        return;
      }
    }
  }
}

pollAndOpen();

child.on('exit', (code) => process.exit(code ?? 1));
