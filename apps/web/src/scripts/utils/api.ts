/* =============================================
   API Utility Module
   Модуль утилиты API
   ============================================= */

import { store } from './store';

export type BackendResponse =
  | { ok: true; status: number; data: unknown; mock?: false }
  | { ok: false; mock: true; error: string; status?: number }
  | { ok: false; mock?: false; error?: string; status?: number };

type Payload = Record<string, unknown>;
type ApiEndpoints = Record<string, string> & {
  lead: string;
  program: string;
};

type PendingRequest = {
  type: string;
  payload: Payload;
  ts: number;
};

const apiWindow = window as Window & { __API_ENDPOINTS?: ApiEndpoints };

/* EN: Default API endpoints - can be overridden by site.config.json
   RU: Дефолтные API эндпоинты - могут быть переопределены через site.config.json */
const DEFAULT_ENDPOINTS: ApiEndpoints = {
  lead: '/api/lead',
  program: '/api/program-interest'
};

/* EN: Portal API configuration - for production use portal URL
   RU: Конфигурация портала - в проде используй URL портала */
const PORTAL_URL = import.meta.env.PUBLIC_PORTAL_URL || '';

const API_ENDPOINTS: ApiEndpoints = apiWindow.__API_ENDPOINTS || {
  // If portal URL is set, use it; otherwise use relative paths (for local backend)
  lead: PORTAL_URL ? `${PORTAL_URL}/api/trial` : DEFAULT_ENDPOINTS.lead,
  program: PORTAL_URL ? `${PORTAL_URL}/api/program-interest` : DEFAULT_ENDPOINTS.program
};

const API_TIMEOUT = 6500;
const LOCAL_QUEUE_KEY = 'api.queue' as const;

/**
 * EN: Persist request for retry when network unavailable
 * RU: Сохраняет запрос в очередь, если сеть недоступна
 */
function queuePending(type: string, payload: Payload): void {
  try {
    const current = store.get(LOCAL_QUEUE_KEY) || [];
    current.push({ type, payload, ts: Date.now() });

    if (current.length > 20) {
      current.shift();
    }

    store.set(LOCAL_QUEUE_KEY, current);
  } catch {
    /* swallow store errors */
  }
}

/**
 * EN: Lightweight delay used to имитировать ответ сервера
 * RU: Небольшая пауза для симуляции сетевого запроса
 */
function simulateNetwork(delay = 900): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * EN: Send payload to configured endpoint with graceful fallbacks
 * RU: Отправляет данные на бэкенд и аккуратно обрабатывает ошибки/таймауты
 */
export async function sendToBackend(type: string, payload: Payload): Promise<BackendResponse> {
  const endpoint = API_ENDPOINTS?.[type];

  const enriched: Payload = {
    ...payload,
    page: window.location.pathname,
    utm: window.location.search,
    timestamp: new Date().toISOString()
  };

  const body = JSON.stringify(enriched);

  if (!endpoint) {
    queuePending(type, enriched);
    await simulateNetwork();
    return { ok: false, mock: true, error: 'endpoint_missing' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
      credentials: 'omit'
    });

    const isJSON = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJSON ? await res.json().catch(() => null) : null;

    if (res.ok) {
      return { ok: true, data, status: res.status };
    }

    throw new Error(`status_${res.status}`);
  } catch (err) {
    queuePending(type, enriched);
    return {
      ok: false,
      mock: true,
      error: err instanceof Error ? err.message : 'network_error'
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * EN: Read queued requests for telemetry/debug
 * RU: Возвращает очередь отложенных запросов для диагностики
 */
export function getPendingRequests(): PendingRequest[] {
  try {
    return store.get(LOCAL_QUEUE_KEY) || [];
  } catch {
    return [];
  }
}

/**
 * EN: Clear retry queue (например после успешной синхронизации)
 * RU: Полностью очищает очередь отложенных запросов
 */
export function clearPendingRequests(): void {
  try {
    store.remove(LOCAL_QUEUE_KEY);
  } catch {
    /* swallow store errors */
  }
}

/**
 * EN: Allow runtime override of API routes (для тестов/Stage)
 * RU: Позволяет переопределить эндпоинты без пересборки
 */
export function setAPIEndpoints(endpoints: Partial<ApiEndpoints>): void {
  Object.assign(API_ENDPOINTS, endpoints);
  apiWindow.__API_ENDPOINTS = API_ENDPOINTS;
}
