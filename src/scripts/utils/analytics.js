/* =============================================
   Analytics Utility Module
   Модуль утилиты аналитики
   ============================================= */

/* EN: Lightweight analytics queue for tracking user interactions
   RU: Легковесная очередь аналитики для отслеживания взаимодействий пользователя */

/* EN: Initialize analytics queue on window object
   RU: Инициализация очереди аналитики на объекте window */
window.analyticsQueue = window.analyticsQueue || [];

/**
 * EN: Track analytics event with optional data payload
 * RU: Отслеживание события аналитики с опциональными данными
 * 
 * @param {string} evt - Event name | Название события
 * @param {Object} data - Event data payload | Данные события
 */
export function track(evt, data = {}) {
  const payload = { 
    evt, 
    ts: Date.now(), 
    ...data 
  };
  
  window.analyticsQueue.push(payload);
  
  /* EN: Development logging (remove in production)
     RU: Логирование для разработки (удалить в продакшене) */
  const isDev = !window.__PRODUCTION_BUILD;
  if (isDev && !window.__NO_ANALYTICS_LOG) {
    // eslint-disable-next-line no-console
    console.log(
      '%cANALYTICS',
      'background:#ff4f8b;color:#fff;padding:2px 6px;border-radius:4px',
      payload
    );
  }
  
  /* EN: Dispatch custom event for listeners
     RU: Отправка пользовательского события для слушателей */
  window.dispatchEvent(new CustomEvent('analytics', { detail: payload }));
}

/**
 * EN: Get all tracked events from queue
 * RU: Получить все отслеженные события из очереди
 * 
 * @returns {Array} - Analytics queue | Очередь аналитики
 */
export function getAnalyticsQueue() {
  return window.analyticsQueue || [];
}

/**
 * EN: Clear analytics queue
 * RU: Очистить очередь аналитики
 */
export function clearAnalyticsQueue() {
  window.analyticsQueue = [];
}

/* EN: Export track function globally for backward compatibility
   RU: Экспорт функции track глобально для обратной совместимости */
window.track = track;
