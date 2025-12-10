import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createSubmissionAppender, readSubmissionsSafe } from '../storage.js';

async function createTempFile(initialContent) {
  const dir = await mkdtemp(join(tmpdir(), 'japanschool-storage-'));
  const filePath = join(dir, 'submissions.json');
  if (typeof initialContent === 'string') {
    await writeFile(filePath, initialContent);
  } else if (Array.isArray(initialContent)) {
    await writeFile(filePath, JSON.stringify(initialContent, null, 2));
  }
  return { dir, filePath };
}

test('readSubmissionsSafe returns empty array when file missing', async () => {
  const { filePath, dir } = await createTempFile();
  const result = await readSubmissionsSafe(filePath);
  assert.deepStrictEqual(result, []);
  await rm(dir, { recursive: true, force: true });
});

test('readSubmissionsSafe handles malformed JSON gracefully', async () => {
  const { filePath, dir } = await createTempFile('{"bad":');
  const result = await readSubmissionsSafe(filePath);
  assert.deepStrictEqual(result, []);
  await rm(dir, { recursive: true, force: true });
});

test('createSubmissionAppender serialises concurrent writes', async () => {
  const { filePath, dir } = await createTempFile([]);
  const appendSubmission = createSubmissionAppender(filePath);

  const entries = Array.from({ length: 12 }, (_, index) => ({
    id: index,
    email: `auto+${index}@example.com`
  }));

  await Promise.all(entries.map((entry) => appendSubmission(entry)));

  const finalContent = JSON.parse(await readFile(filePath, 'utf8'));
  assert.equal(finalContent.length, entries.length);
  const emails = new Set(finalContent.map((item) => item.email));
  assert.equal(emails.size, entries.length);

  await rm(dir, { recursive: true, force: true });
});
