#!/usr/bin/env node
/* eslint-disable no-console */
/*
 * Backend smoke test script for Japan School project.
 * Launches the Express server with JSON email transport and executes
 * a concrete set of API checks to validate Stage 7 requirements.
 */

import { spawn } from 'child_process';
import { setTimeout as wait } from 'timers/promises';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { join } from 'path';

const serverUrl = 'http://localhost:3000';
const serverDir = fileURLToPath(new URL('../', import.meta.url));
const submissionsPath = join(serverDir, 'submissions.json');

function startServer() {
  return spawn('node', ['index.js'], {
    cwd: serverDir,
    env: {
      ...process.env,
      EMAIL_TRANSPORT: 'json'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

async function waitForServer({ timeout = 8000 } = {}) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(`${serverUrl}/health`);
      if (response.ok) {
        return true;
      }
    } catch (_) {
      // Server not ready yet; keep polling
    }
    await wait(250);
  }

  throw new Error('Server did not become ready within timeout');
}

async function getJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON:', text);
    throw error;
  }
}

async function runTest(name, fn, results) {
  try {
    await fn();
    results.push({ name, status: 'passed' });
  } catch (error) {
    results.push({ name, status: 'failed', error });
  }
}

async function main() {
  const serverProcess = startServer();
  serverProcess.stdout.on('data', (chunk) => process.stdout.write(chunk));
  serverProcess.stderr.on('data', (chunk) => process.stderr.write(chunk));

  const results = [];

  try {
    await waitForServer();

    await runTest(
      'GET /health returns ok',
      async () => {
        const response = await fetch(`${serverUrl}/health`);
        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }
        const data = await getJson(response);
        if (data.status !== 'ok') {
          throw new Error(`Unexpected payload: ${JSON.stringify(data)}`);
        }
      },
      results
    );

    await runTest(
      'POST /api/submit-form validates email',
      async () => {
        const response = await fetch(`${serverUrl}/api/submit-form`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Invalid Email',
            email: 'wrong-email',
            phone: '+79001234567',
            level: 'B1',
            message: 'Testing invalid email',
            formType: 'hero'
          })
        });

        if (response.status !== 400) {
          throw new Error(`Expected 400, got ${response.status}`);
        }

        const data = await getJson(response);
        if (!data?.error?.includes('email')) {
          throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
        }
      },
      results
    );

    await wait(200);

    const uniqueSuffix = Date.now();
    const validPayload = {
      name: 'Stage7 Tester',
      email: `stage7.tester+${uniqueSuffix}@example.com`,
      phone: '+79998887766',
      level: 'N4',
      message: 'Stage 7 automated backend check',
      formType: 'contact'
    };

    await runTest(
      'POST /api/submit-form accepts valid payload',
      async () => {
        const response = await fetch(`${serverUrl}/api/submit-form`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validPayload)
        });

        if (!response.ok) {
          throw new Error(`Expected 200, got ${response.status}`);
        }

        const data = await getJson(response);
        if (!data?.success) {
          throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
        }
      },
      results
    );

    await wait(200);

    await runTest(
      'GET /api/submissions returns latest entry',
      async () => {
        const response = await fetch(`${serverUrl}/api/submissions`);
        if (!response.ok) {
          throw new Error(`Unexpected status ${response.status}`);
        }

        const submissions = await getJson(response);
        if (!Array.isArray(submissions?.data) || submissions.data.length === 0) {
          throw new Error('Submissions payload missing data array');
        }

        const latest = submissions.data.at(-1);
        if (!latest || latest.email !== validPayload.email) {
          throw new Error('Latest submission does not match test payload');
        }
      },
      results
    );

    await runTest(
      'submissions.json persisted data',
      async () => {
        const file = await readFile(submissionsPath, 'utf8');
        const stored = JSON.parse(file);
        const match = stored.find((item) => item.email === validPayload.email);
        if (!match) {
          throw new Error('Test payload not found in submissions.json');
        }
      },
      results
    );
  } finally {
    serverProcess.kill();
    await wait(500);
  }

  const failed = results.filter((result) => result.status === 'failed');

  console.log('\nStage 7 backend smoke results:');
  for (const result of results) {
    if (result.status === 'passed') {
      console.log(`  ✅ ${result.name}`);
    } else {
      console.log(`  ❌ ${result.name}`);
      if (result.error) {
        console.log(`     ↳ ${result.error.message}`);
      }
    }
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Unexpected test runner error:', error);
  process.exit(1);
});
