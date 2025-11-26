#!/usr/bin/env node
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import net from 'net';
import path from 'path';
import { setTimeout as delay } from 'timers/promises';
import { fileURLToPath } from 'url';

const BASE_PORT = Number(process.env.PREVIEW_SMOKE_PORT) || 8080;
const MAX_PORT_ATTEMPTS = 10;
const READY_TIMEOUT_MS = 15000;
const RETRY_INTERVAL_MS = 500;
let serverProcess;
let ready = false;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

async function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, '0.0.0.0');
  });
}

async function findPort(start) {
  for (let offset = 0; offset < MAX_PORT_ATTEMPTS; offset += 1) {
    const port = start + offset;
    if (await isPortFree(port)) {
      return port;
    }
  }
  throw new Error(`No free port found in range ${start}-${start + MAX_PORT_ATTEMPTS - 1}`);
}

async function waitForReady(url) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < READY_TIMEOUT_MS) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'preview-smoke-check' },
        cache: 'no-store'
      });
      if (res.ok) {
        return;
      }
    } catch (err) {
      void err;
    }
    await delay(RETRY_INTERVAL_MS);
  }
  throw new Error(`Preview server did not respond within ${READY_TIMEOUT_MS}ms`);
}

async function locateMainBundle() {
  const distEntries = await fs.readdir(DIST_DIR);
  const bundle = distEntries.find((name) => /^main\.[\w-]+\.js$/iu.test(name));
  if (!bundle) {
    throw new Error('main.*.js bundle not found in dist/');
  }
  return bundle;
}

async function shutdownServer() {
  if (!serverProcess || serverProcess.killed) {
    return;
  }
  serverProcess.kill('SIGTERM');
  await delay(800);
  if (!serverProcess.killed) {
    serverProcess.kill('SIGKILL');
    await delay(200);
  }
}

function registerCleanup() {
  const handler = async () => {
    await shutdownServer();
  };
  process.on('exit', handler);
  process.on('SIGINT', () => {
    handler().finally(() => process.exit(130));
  });
  process.on('SIGTERM', () => {
    handler().finally(() => process.exit(143));
  });
}

async function runSmokeCheck() {
  const port = await findPort(BASE_PORT);
  const url = `http://localhost:${port}/`;
  process.stdout.write(`[preview:smoke] starting static server on ${url}\n`);

  serverProcess = spawn('npx', ['http-server', 'dist', '-p', String(port), '-c-1', '--silent'], {
    stdio: 'ignore',
    shell: process.platform === 'win32'
  });

  serverProcess.on('error', async (err) => {
    await shutdownServer();
    process.stderr.write('[preview:smoke] failed to start preview server\n');
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  });

  const exitWatcher = new Promise((_, reject) => {
    serverProcess.on('exit', (code) => {
      if (ready) {
        return;
      }
      reject(new Error(`Preview server exited before readiness (code ${code})`));
    });
  });

  await Promise.race([waitForReady(url), exitWatcher]);
  ready = true;
  process.stdout.write('[preview:smoke] homepage responded with 200\n');

  const mainBundle = await locateMainBundle();
  const bundleResponse = await fetch(`${url}${mainBundle}`, {
    headers: { 'user-agent': 'preview-smoke-check' },
    cache: 'no-store'
  });
  if (!bundleResponse.ok) {
    throw new Error(`${mainBundle} responded with status ${bundleResponse.status}`);
  }
  process.stdout.write(`[preview:smoke] ${mainBundle} accessible\n`);

  await shutdownServer();
  process.stdout.write('[preview:smoke] server stopped successfully\n');
}

registerCleanup();

runSmokeCheck().catch(async (err) => {
  process.stderr.write(`[preview:smoke] ${err.message}\n`);
  await shutdownServer();
  process.exit(1);
});
