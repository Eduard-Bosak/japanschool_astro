import fs from 'fs/promises';

/**
 * Safely read submissions array from storage file.
 * Возвращает массив из файла или пустой массив при ошибке.
 *
 * @param {string} filePath - Absolute path to submissions file.
 * @returns {Promise<object[]>} Parsed submissions array.
 */
export async function readSubmissionsSafe(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

/**
 * Create append function that serialises writes to avoid data loss.
 * Создаёт аппендер, сериализующий записи, чтобы избежать потерь данных.
 *
 * @param {string} filePath - Absolute path to submissions file.
 * @returns {(entry: Record<string, unknown>) => Promise<void>} Enqueued append function.
 */
export function createSubmissionAppender(filePath) {
  let writeQueue = Promise.resolve();

  return async function appendSubmission(entry) {
    const nextOperation = writeQueue.then(async () => {
      const submissions = await readSubmissionsSafe(filePath);
      submissions.push(entry);
      await fs.writeFile(filePath, JSON.stringify(submissions, null, 2));
    });

    writeQueue = nextOperation.catch((error) => {
      console.error('❌ Failed to persist submission:', error);
    });

    return nextOperation;
  };
}
