#!/usr/bin/env node
/* eslint-disable no-console */
/*
 * Stage 9: backend security and robustness checks.
 *
 * 1. Launch backend with JSON mail transport.
 * 2. Execute focused negative test cases against /api/submit-form.
 * 3. Exercise /api/submissions for admin-only exposure (read-only here; access control manual).
 * 4. Evaluate submissions.json integrity post stress.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { setTimeout as wait } from 'timers/promises';
import { readFile } from 'fs/promises';

const serverOrigin = 'http://localhost:3000';
const serverDir = fileURLToPath(new URL('../', import.meta.url));
const submissionsFile = join(serverDir, 'submissions.json');

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

async function waitForServer(timeoutMs = 8000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${serverOrigin}/health`);
      if (response.ok) {
        return;
      }
    } catch (_) {
      // retry
    }
    await wait(250);
  }
  throw new Error('Backend did not pass health check');
}

async function callSubmitForm(payload) {
  const response = await fetch(`${serverOrigin}/api/submit-form`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await response.json().catch(() => ({ malformed: true }));
  return { response, json };
}

async function runAssertion(name, fn, results) {
  try {
    await fn();
    results.push({ name, status: 'passed' });
  } catch (error) {
    results.push({ name, status: 'failed', error });
  }
}

async function captureBaselineSubmissions() {
  try {
    const content = await readFile(submissionsFile, 'utf8');
    return JSON.parse(content);
  } catch (_) {
    return [];
  }
}

async function stressConcurrentWrites(payload, iterations = 10) {
  await Promise.all(
    Array.from({ length: iterations }).map((_, index) =>
      callSubmitForm({ ...payload, email: `${payload.email}+${index}@example.com` })
    )
  );
}

async function main() {
  const server = startServer();
  server.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));

  const results = [];

  try {
    await waitForServer();

    const initialData = await captureBaselineSubmissions();

    await runAssertion(
      'Rejects empty payload',
      async () => {
        const { response } = await callSubmitForm({});
        if (response.status !== 400) {
          throw new Error(`Expected 400, got ${response.status}`);
        }
      },
      results
    );

    await runAssertion(
      'Rejects XSS in name field',
      async () => {
        const { response, json } = await callSubmitForm({
          name: '<img src=x onerror=alert(1)>',
          email: 'xss@example.com',
          phone: '+79990000000',
          level: 'N5',
          message: 'payload',
          formType: 'hero'
        });
        if (response.status !== 400) {
          throw new Error(`Expected 400, got ${response.status}`);
        }
        if (!json?.error?.includes('Имя')) {
          throw new Error('Response must highlight недопустимые символы в имени');
        }
      },
      results
    );

    await runAssertion(
      'Rejects extremely long message',
      async () => {
        const longMessage = 'A'.repeat(20000);
        const { response } = await callSubmitForm({
          name: 'Long Message Tester',
          email: 'long@example.com',
          phone: '+79991112233',
          level: 'N4',
          message: longMessage,
          formType: 'contact'
        });
        if (response.status !== 400) {
          throw new Error(`Expected 400 for long message, got ${response.status}`);
        }
      },
      results
    );

    await runAssertion(
      'Rejects invalid phone format',
      async () => {
        const { response, json } = await callSubmitForm({
          name: 'Bad Phone',
          email: 'phone@example.com',
          phone: '12345',
          level: 'N5',
          message: 'Invalid phone test',
          formType: 'hero'
        });
        if (response.status !== 400 || !json?.error?.includes('телеф')) {
          throw new Error('Invalid phone should produce error');
        }
      },
      results
    );

    await runAssertion(
      'Allows stress writes without corrupting submissions.json',
      async () => {
        const stressPayload = {
          name: 'Stress User',
          email: 'stress@example.com',
          phone: '+79993334455',
          level: 'N3',
          message: 'Stress test submission',
          formType: 'contact'
        };

        await stressConcurrentWrites(stressPayload, 5);

        const latestContent = await readFile(submissionsFile, 'utf8');
        JSON.parse(latestContent);
      },
      results
    );

    await runAssertion(
      'Submissions file remains append-only',
      async () => {
        const latestContent = await readFile(submissionsFile, 'utf8');
        const data = JSON.parse(latestContent);
        if (data.length < initialData.length) {
          throw new Error('submissions.json lost entries after stress test');
        }
      },
      results
    );

    await runAssertion(
      'API returns success flag for /api/submissions',
      async () => {
        const response = await fetch(`${serverOrigin}/api/submissions`);
        const json = await response.json();
        if (!json.success || !Array.isArray(json.data)) {
          throw new Error('Unexpected payload from /api/submissions');
        }
      },
      results
    );

    console.log('\nStage 9 backend security results:');
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

    const failed = results.filter((entry) => entry.status === 'failed');
    if (failed.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    server.kill();
    await wait(500);
  }
}

main().catch((error) => {
  console.error('Stage 9 run crashed:', error);
  process.exit(1);
});
