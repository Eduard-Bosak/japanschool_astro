/* =============================================
   API Utility Module
   Модуль утилиты API
   ============================================= */

/* EN: API endpoints configuration
   RU: Конфигурация эндпоинтов API */
const API_ENDPOINTS = window.__API_ENDPOINTS || {
  lead: '/api/lead',
  program: '/api/program-interest'
};

/* EN: API request timeout in milliseconds
   RU: Таймаут запроса API в миллисекундах */
const API_TIMEOUT = 6500;

/* EN: LocalStorage key for pending requests queue
   RU: Ключ LocalStorage для очереди ожидающих запросов */
const LOCAL_QUEUE_KEY = 'japanschool.pendingForms';

/**
 * EN: Queue failed request to localStorage for retry
 * RU: Добавление неудавшегося запроса в LocalStorage для повтора
 * 
 * @param {string} type - Request type | Тип запроса
 * @param {Object} payload - Request payload | Данные запроса
 */
function queuePending(type, payload) {
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || '[]');
    current.push({ type, payload, ts: Date.now() });
    
    /* EN: Keep only last 20 items to prevent storage overflow
       RU: Хранить только последние 20 элементов для предотвращения переполнения */
    if (current.length > 20) current.shift();
    
    localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(current));
  } catch (_) {
    /* EN: Silently fail if localStorage is unavailable
       RU: Тихий отказ если localStorage недоступен */
  }
}

/**
 * EN: Simulate network delay for development
 * RU: Имитация задержки сети для разработки
 * 
 * @param {number} delay - Delay in milliseconds | Задержка в миллисекундах
 * @returns {Promise} - Resolves after delay | Разрешается после задержки
 */
function simulateNetwork(delay = 900) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * EN: Send data to backend API endpoint
 * RU: Отправка данных на API бэкенда
 * 
 * @param {string} type - API endpoint type | Тип эндпоинта API
 * @param {Object} payload - Data to send | Данные для отправки
 * @returns {Promise<Object>} - Response object | Объект ответа
 */
export async function sendToBackend(type, payload) {
  const endpoint = API_ENDPOINTS?.[type];
  
  /* EN: Enrich payload with tracking data
     RU: Обогащение данных информацией для отслеживания */
  const enriched = {
    ...payload,
    page: window.location.pathname,
    utm: window.location.search,
    timestamp: new Date().toISOString()
  };
  
  const body = JSON.stringify(enriched);
  
  /* EN: Handle missing endpoint (mock mode)
     RU: Обработка отсутствующего эндпоинта (режим имитации) */
  if (!endpoint) {
    queuePending(type, enriched);
    await simulateNetwork();
    return { ok: false, mock: true, error: 'endpoint_missing' };
  }
  
  /* EN: Setup request timeout controller
     RU: Настройка контроллера таймаута запроса */
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    /* EN: Send POST request to API
       RU: Отправка POST запроса к API */
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
      credentials: 'omit'
    });
    
    /* EN: Parse JSON response if content-type is JSON
       RU: Парсинг JSON ответа если content-type JSON */
    const isJSON = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJSON ? await res.json().catch(() => null) : null;
    
    /* EN: Return success response
       RU: Возврат успешного ответа */
    if (res.ok) {
      return { ok: true, data, status: res.status };
    }
    
    /* EN: Throw error for non-OK status
       RU: Выброс ошибки для не-OK статуса */
    throw new Error(`status_${res.status}`);
  } catch (err) {
    /* EN: Queue request on error and return mock response
       RU: Добавление запроса в очередь при ошибке и возврат имитационного ответа */
    queuePending(type, enriched);
    return { 
      ok: false, 
      mock: true, 
      error: err?.message || 'network_error' 
    };
  } finally {
    /* EN: Clear timeout
       RU: Очистка таймаута */
    clearTimeout(timeoutId);
  }
}

/**
 * EN: Get pending requests from localStorage queue
 * RU: Получение ожидающих запросов из очереди в localStorage
 * 
 * @returns {Array} - Pending requests | Ожидающие запросы
 */
export function getPendingRequests() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || '[]');
  } catch (_) {
    return [];
  }
}

/**
 * EN: Clear pending requests queue
 * RU: Очистка очереди ожидающих запросов
 */
export function clearPendingRequests() {
  try {
    localStorage.removeItem(LOCAL_QUEUE_KEY);
  } catch (_) {
    /* EN: Silently fail
       RU: Тихий отказ */
  }
}

/**
 * EN: Update API endpoints configuration
 * RU: Обновление конфигурации эндпоинтов API
 * 
 * @param {Object} endpoints - New endpoints | Новые эндпоинты
 */
export function setAPIEndpoints(endpoints) {
  Object.assign(API_ENDPOINTS, endpoints);
  window.__API_ENDPOINTS = API_ENDPOINTS;
}
