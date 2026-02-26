const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
const binaryName = isWindows ? 'app.exe' : 'app';
const appPath = path.join(rootDir, 'src-tauri', 'target', 'debug', binaryName);

let tauriDriver;

function closeTauriDriver() {
  if (tauriDriver) {
    tauriDriver.kill();
    tauriDriver = null;
  }
}

exports.config = {
  host: '127.0.0.1',
  port: 4444,
  specs: ['./specs/**/*.e2e.cjs'],
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      'tauri:options': {
        application: appPath,
      },
    },
  ],
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 90000,
  },
  onPrepare: function () {
    spawnSync(
      'npm',
      ['run', 'tauri', 'build', '--', '--debug', '--no-bundle'],
      { cwd: rootDir, stdio: 'inherit', shell: true }
    );
  },
  beforeSession: function () {
    const driverName = isWindows ? 'tauri-driver.exe' : 'tauri-driver';
    const driverPath = path.join(os.homedir(), '.cargo', 'bin', driverName);
    tauriDriver = spawn(driverPath, [], { stdio: [null, process.stdout, process.stderr], shell: isWindows });
    tauriDriver.on('error', (err) => {
      console.error('tauri-driver error:', err);
      process.exit(1);
    });
    tauriDriver.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error('tauri-driver exited with code:', code);
        process.exit(1);
      }
    });
  },
  afterSession: function () {
    closeTauriDriver();
  },
};

process.on('exit', closeTauriDriver);
process.on('SIGINT', () => { closeTauriDriver(); process.exit(); });
process.on('SIGTERM', () => { closeTauriDriver(); process.exit(); });
