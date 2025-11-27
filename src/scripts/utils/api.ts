/* =============================================
   API Utility Module
   Модуль утилиты API
   ============================================= */

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

const API_ENDPOINTS: ApiEndpoints = apiWindow.__API_ENDPOINTS || {
  lead: '/api/lead',
  program: '/api/program-interest'
};

const API_TIMEOUT = 6500;
const LOCAL_QUEUE_KEY = 'japanschool.pendingForms';

/**
 * EN: Persist request for retry when network unavailable
 * RU: Сохраняет запрос в очередь, если сеть недоступна
 */
function queuePending(type: string, payload: Payload): void {
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || '[]') as PendingRequest[];
    current.push({ type, payload, ts: Date.now() });

    if (current.length > 20) {
      current.shift();
    }

    localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(current));
  } catch {
    /* swallow localStorage errors */
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
    return JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || '[]') as PendingRequest[];
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
    localStorage.removeItem(LOCAL_QUEUE_KEY);
  } catch {
    /* swallow localStorage errors */
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
