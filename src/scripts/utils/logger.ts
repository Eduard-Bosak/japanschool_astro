/* =============================================
   Centralized Error Logger
   Централизованный логгер ошибок
   ============================================= */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: number;
  url: string;
}

const LOG_QUEUE: LogEntry[] = [];
const MAX_QUEUE_SIZE = 50;

/**
 * EN: Check if we're in development mode
 * RU: Проверка режима разработки
 */
const isDev = (): boolean => {
  try {
    return import.meta.env?.DEV ?? false;
  } catch {
    return false;
  }
};

/**
 * EN: Format log entry for console output
 * RU: Форматирование записи лога для вывода в консоль
 */
function formatLogEntry(entry: LogEntry): string {
  const time = new Date(entry.timestamp).toISOString().slice(11, 23);
  const ctx = entry.context ? `[${entry.context}]` : '';
  return `${time} ${ctx} ${entry.message}`;
}

/**
 * EN: Create log entry and optionally send to remote
 * RU: Создание записи лога и опциональная отправка на сервер
 */
function log(level: LogLevel, message: string, context?: string, data?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    context,
    data,
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : ''
  };

  // EN: Add to queue | RU: Добавление в очередь
  LOG_QUEUE.push(entry);
  if (LOG_QUEUE.length > MAX_QUEUE_SIZE) {
    LOG_QUEUE.shift();
  }

  // EN: Console output in dev mode | RU: Вывод в консоль в dev-режиме
  if (isDev() || level === 'error' || level === 'warn') {
    const formatted = formatLogEntry(entry);
    const consoleMethod =
      level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

    if (data !== undefined) {
      consoleMethod(formatted, data);
    } else {
      consoleMethod(formatted);
    }
  }

  // EN: Send errors to analytics/monitoring in production
  // RU: Отправка ошибок в аналитику/мониторинг в продакшене
  if (level === 'error' && !isDev()) {
    sendToMonitoring(entry);
  }
}

/**
 * EN: Send error to monitoring service
 * RU: Отправка ошибки в сервис мониторинга
 */
function sendToMonitoring(_entry: LogEntry): void {
  // EN: Use sendBeacon for reliable delivery | RU: Используем sendBeacon для надёжной доставки
  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    try {
      // EN: Replace with your monitoring endpoint | RU: Замените на ваш endpoint мониторинга
      // navigator.sendBeacon('/api/log', JSON.stringify(_entry));
    } catch {
      // EN: Silently fail | RU: Тихий отказ
    }
  }
}

/**
 * EN: Log debug message (dev only)
 * RU: Лог отладочного сообщения (только dev)
 */
export function debug(message: string, context?: string, data?: unknown): void {
  log('debug', message, context, data);
}

/**
 * EN: Log info message
 * RU: Лог информационного сообщения
 */
export function info(message: string, context?: string, data?: unknown): void {
  log('info', message, context, data);
}

/**
 * EN: Log warning message
 * RU: Лог предупреждения
 */
export function warn(message: string, context?: string, data?: unknown): void {
  log('warn', message, context, data);
}

/**
 * EN: Log error message
 * RU: Лог ошибки
 */
export function error(message: string, context?: string, data?: unknown): void {
  log('error', message, context, data);
}

/**
 * EN: Wrap function with error boundary
 * RU: Обёртка функции с error boundary
 */
export function withErrorBoundary<T extends (...args: unknown[]) => unknown>(
  fn: T,
  context: string
): T {
  return ((...args: unknown[]) => {
    try {
      const result = fn(...args);
      // EN: Handle async functions | RU: Обработка async функций
      if (result instanceof Promise) {
        return result.catch((err) => {
          error(`Async error: ${err?.message || err}`, context, { args, stack: err?.stack });
          throw err;
        });
      }
      return result;
    } catch (err) {
      error(`Error: ${(err as Error)?.message || err}`, context, {
        args,
        stack: (err as Error)?.stack
      });
      throw err;
    }
  }) as T;
}

/**
 * EN: Safe initialization wrapper
 * RU: Безопасная обёртка инициализации
 */
export function safeInit(name: string, initFn: () => void): void {
  try {
    initFn();
    debug(`${name} initialized`, 'Init');
  } catch (err) {
    error(`${name} init failed: ${(err as Error)?.message}`, 'Init', {
      stack: (err as Error)?.stack
    });
  }
}

/**
 * EN: Get recent log entries
 * RU: Получение последних записей лога
 */
export function getRecentLogs(): LogEntry[] {
  return [...LOG_QUEUE];
}

/**
 * EN: Setup global error handlers
 * RU: Настройка глобальных обработчиков ошибок
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  // EN: Unhandled errors | RU: Необработанные ошибки
  window.addEventListener('error', (event) => {
    error(`Uncaught error: ${event.message}`, 'Global', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  // EN: Unhandled promise rejections | RU: Необработанные promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    error(`Unhandled rejection: ${event.reason}`, 'Global', {
      reason: event.reason,
      stack: event.reason?.stack
    });
  });
}

// EN: Auto-setup global handlers | RU: Автоматическая настройка глобальных обработчиков
if (typeof window !== 'undefined') {
  setupGlobalErrorHandlers();
}
