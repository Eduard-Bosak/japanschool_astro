#!/usr/bin/env node
/* eslint-disable no-console */
/*
 * Admin panel smoke test (Stage 8).
 * Spins up the backend in JSON email mode, seeds a submission, and
 * drives the admin UI in headless Chromium to verify authentication,
 * table filtering, modal rendering, and sanitisation safeguards.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { setTimeout as wait } from 'timers/promises';
import puppeteer from 'puppeteer';

const serverOrigin = 'http://localhost:3000';
const adminUrl = `${serverOrigin}/admin`;
const serverDir = fileURLToPath(new URL('../', import.meta.url));

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
      // still starting
    }
    await wait(250);
  }

  throw new Error('Backend did not pass health check within timeout');
}

async function runStep(title, fn, results) {
  try {
    await fn();
    results.push({ title, status: 'passed' });
  } catch (error) {
    results.push({ title, status: 'failed', error });
  }
}

async function seedSubmission(uniqueToken) {
  const payload = {
    name: 'Stage8 Inspector',
    email: `stage8.inspector+${uniqueToken}@example.com`,
    phone: '+79990001122',
    level: 'N3',
    message: '<script>alert("XSS")</script> -- проверка экранирования',
    formType: 'hero'
  };

  const response = await fetch(`${serverOrigin}/api/submit-form`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Не удалось создать тестовую заявку (HTTP ${response.status})`);
  }

  return payload;
}

async function fetchSubmissionFromApi(email) {
  const response = await fetch(`${serverOrigin}/api/submissions`);
  if (!response.ok) {
    throw new Error(`Не удалось получить список заявок (HTTP ${response.status})`);
  }

  const payload = await response.json();
  if (!payload.success || !Array.isArray(payload.data)) {
    throw new Error('Ответ API не содержит данных');
  }

  const target = payload.data.find((submission) => submission.email === email);
  if (!target) {
    throw new Error('Тестовая заявка отсутствует в API после создания');
  }

  return target;
}

async function main() {
  const results = [];
  const uniqueToken = Date.now();

  const serverProcess = startServer();
  serverProcess.stdout.on('data', (chunk) => process.stdout.write(chunk));
  serverProcess.stderr.on('data', (chunk) => process.stderr.write(chunk));

  let browser;

  try {
    await waitForServer();
    const seededSubmission = await seedSubmission(uniqueToken);
    const apiSubmission = await fetchSubmissionFromApi(seededSubmission.email);

    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await runStep(
      'Логин с паролем admin123 открывает панель',
      async () => {
        await page.goto(adminUrl, { waitUntil: 'networkidle0' });
        await page.waitForSelector('#loginScreen', { visible: true });

        await page.type('#password', 'admin123');
        await page.click('.login-btn');

        await page.waitForSelector('#adminPanel.authenticated', { timeout: 5000 });
        await page.waitForSelector('#tableContainer', { timeout: 5000 });
      },
      results
    );

    await runStep(
      'Поиск по email находит свежую заявку',
      async () => {
        await page.waitForFunction(() => document.querySelector('tbody tr') !== null, {
          timeout: 5000
        });

        await page.evaluate((targetEmail) => {
          const input = document.querySelector('#searchInput');
          if (!input) {
            throw new Error('Search input not found');
          }
          input.value = targetEmail;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }, seededSubmission.email);

        await page.waitForFunction(
          (targetEmail) => {
            const row = document.querySelector('tbody tr');
            return row && row.textContent.includes(targetEmail);
          },
          { timeout: 5000 },
          seededSubmission.email
        );

        const rowData = await page.evaluate(() => {
          const cells = Array.from(document.querySelectorAll('tbody tr td'));
          return cells.map((cell) => cell.textContent.trim());
        });

        if (!rowData.some((value) => value.includes('Stage8 Inspector'))) {
          throw new Error('Имя не найдено в таблице');
        }
        if (!rowData.some((value) => value.includes('stage8.inspector'))) {
          throw new Error('Email не найден в таблице');
        }
      },
      results
    );

    await runStep(
      'Модальное окно показывает данные без внедрения script',
      async () => {
        await page.evaluate((submission) => {
          window.viewDetails(submission);
        }, apiSubmission);

        await page.waitForFunction(
          () => document.getElementById('detailModal').classList.contains('active'),
          { timeout: 5000 }
        );

        const modalText = await page.$eval('#modalBody', (el) => el.textContent);
        if (!modalText.includes('Stage8 Inspector')) {
          throw new Error('Имя в модальном окне не отображается');
        }
        if (!modalText.includes('<script>alert("XSS")</script>')) {
          throw new Error('Санитизированное сообщение не отображается');
        }

        const scriptInsideModal = await page.$('#modalBody script');
        if (scriptInsideModal) {
          throw new Error('В модальном окне найден тег <script>');
        }
      },
      results
    );
  } finally {
    if (browser) {
      await browser.close();
    }
    serverProcess.kill();
    await wait(500);
  }

  const failed = results.filter((step) => step.status === 'failed');

  console.log('\nStage 8 admin panel smoke results:');
  for (const step of results) {
    if (step.status === 'passed') {
      console.log(`  ✅ ${step.title}`);
    } else {
      console.log(`  ❌ ${step.title}`);
      if (step.error) {
        console.log(`     ↳ ${step.error.message}`);
      }
    }
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Stage 8 admin panel smoke crashed:', error);
  process.exit(1);
});
