/**
 * Sentry Error Tracking
 * Monitors and reports errors in production
 */

import * as Sentry from '@sentry/browser';

// Sentry DSN from environment or config
const SENTRY_DSN = import.meta.env.PUBLIC_SENTRY_DSN || '';

// Environment detection
const environment = import.meta.env.MODE || 'development';
const isProduction = environment === 'production';

/**
 * Initialize Sentry error tracking
 * Should be called once at app startup
 */
export function initSentry(): void {
  // Only initialize in production with valid DSN
  if (!SENTRY_DSN) {
    if (isProduction) {
      console.warn('[Sentry] No DSN configured, error tracking disabled');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment,

      // Performance monitoring
      tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev

      // Release info (set during build)
      release: import.meta.env.PUBLIC_APP_VERSION || 'unknown',

      // Filter out known non-critical errors
      beforeSend(event, hint) {
        const error = hint.originalException;

        // Ignore network errors from extensions
        if (error instanceof Error) {
          const message = error.message.toLowerCase();

          // Skip browser extension errors
          if (message.includes('extension')) {
            return null;
          }

          // Skip cancelled requests
          if (message.includes('aborted') || message.includes('cancelled')) {
            return null;
          }

          // Skip ResizeObserver errors (browser quirk)
          if (message.includes('resizeobserver')) {
            return null;
          }
        }

        return event;
      },

      // Ignore specific error types
      ignoreErrors: [
        // Network issues
        'Network Error',
        'Failed to fetch',
        'Load failed',
        'NetworkError',

        // Third-party scripts
        /^Script error\.?$/,

        // Browser extensions
        /chrome-extension/,
        /moz-extension/,

        // Known browser issues
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',

        // User-initiated navigation
        'AbortError',
        'The operation was aborted'
      ],

      // Limit breadcrumbs
      maxBreadcrumbs: 50,

      // Don't send PII
      sendDefaultPii: false
    });

    console.log('[Sentry] Initialized for', environment);
  } catch (err) {
    console.error('[Sentry] Failed to initialize:', err);
  }
}

/**
 * Capture an exception manually
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!SENTRY_DSN) {
    console.error('[Error]', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a message (info/warning)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (!SENTRY_DSN) {
    console.log(`[${level}]`, message);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id?: string; email?: string } | null): void {
  if (!SENTRY_DSN) return;
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string = 'navigation',
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000
  });
}

/**
 * Create error boundary wrapper for async functions
 */
export function withSentryTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        operation: operationName,
        args: args.map((arg) => (typeof arg === 'object' ? '[object]' : String(arg)))
      });
      throw error;
    }
  }) as T;
}

export { Sentry };
