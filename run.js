#!/usr/bin/env node

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

const validTargets = ['backend', 'frontend', 'both'];

function readScripts(dir) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    return Object.keys(pkg.scripts || {});
  } catch {
    return [];
  }
}

function showHelp() {
  const backendScripts = readScripts(backendDir);
  const frontendScripts = readScripts(frontendDir);

  console.log('\nUsage: node run.js <target> <command>\n');
  console.log(`\x1b[33mTargets:\x1b[0m  ${validTargets.join(', ')}\n`);
  console.log(`\x1b[36mBackend commands:\x1b[0m   ${backendScripts.join(', ')}`);
  console.log(`\x1b[35mFrontend commands:\x1b[0m  ${frontendScripts.join(', ')}\n`);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

const target = args[0];
const command = args[1] || 'dev';

if (!validTargets.includes(target)) {
  console.error(`\x1b[31mInvalid target: ${target}\x1b[0m`);
  showHelp();
  process.exit(1);
}

function isDockerRunning() {
  try {
    const result = spawnSync('docker', ['ps'], { timeout: 5000, stdio: 'pipe' });
    return result.status === 0;
  } catch {
    return false;
  }
}

function startService(directory, label, args) {
  console.log(`\x1b[36mLaunching: ${label}\x1b[0m`);

  const child = spawn('pnpm', args, {
    cwd: directory,
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    console.error(`\x1b[31mError starting ${label}: ${err.message}\x1b[0m`);
  });

  return child;
}

if (command.includes('docker') && !isDockerRunning()) {
  console.error('\x1b[31mError: Docker is not running. Please start Docker Desktop and try again.\x1b[0m');
  process.exit(1);
}

switch (target.toLowerCase()) {
  case 'backend':
    startService(backendDir, 'Backend', [command]);
    break;
  case 'frontend':
    startService(frontendDir, 'Frontend', ['run', command]);
    break;
  case 'both':
    startService(backendDir, 'Backend', [command]);
    startService(frontendDir, 'Frontend', ['run', command]);
    break;
}

console.log(`\x1b[32mStarted: ${target} → ${command}\x1b[0m`);
