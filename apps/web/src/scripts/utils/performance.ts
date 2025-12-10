/* =============================================
   Performance Monitoring - Web Vitals Integration
   Мониторинг производительности - Интеграция Web Vitals
   ============================================= */

import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import { track } from './analytics';

/**
 * EN: Initialize Web Vitals monitoring
 * RU: Инициализация мониторинга Web Vitals
 *
 * Tracks Core Web Vitals and sends them to analytics:
 * - CLS (Cumulative Layout Shift) - visual stability
 * - INP (Interaction to Next Paint) - interactivity (replaces FID)
 * - LCP (Largest Contentful Paint) - loading performance
 * - FCP (First Contentful Paint) - perceived load speed
 * - TTFB (Time to First Byte) - server response time
 */
export function initPerformanceMonitoring(): void {
  /* EN: Only run in production or when explicitly enabled
     RU: Запускаем только в продакшене или при явном включении */
  if (import.meta.env.DEV && !import.meta.env.PUBLIC_ENABLE_WEB_VITALS) {
    return;
  }

  /**
   * EN: Cumulative Layout Shift - measures visual stability
   * RU: Кумулятивный сдвиг макета - измеряет визуальную стабильность
   * Good: 0-0.1 | Needs improvement: 0.1-0.25 | Poor: >0.25
   */
  onCLS((metric) => {
    track('web_vitals', {
      name: 'CLS',
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType
    });
  });

  /**
   * EN: Interaction to Next Paint - measures responsiveness (replaces FID)
   * RU: Взаимодействие до следующей отрисовки - измеряет отзывчивость
   * Good: 0-200ms | Needs improvement: 200-500ms | Poor: >500ms
   */
  onINP((metric) => {
    track('web_vitals', {
      name: 'INP',
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType
    });
  });

  /**
   * EN: Largest Contentful Paint - measures loading performance
   * RU: Отрисовка самого крупного контента - измеряет скорость загрузки
   * Good: 0-2500ms | Needs improvement: 2500-4000ms | Poor: >4000ms
   */
  onLCP((metric) => {
    track('web_vitals', {
      name: 'LCP',
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType
    });
  });

  /**
   * EN: First Contentful Paint - measures perceived load speed
   * RU: Первая отрисовка контента - измеряет воспринимаемую скорость
   * Good: 0-1800ms | Needs improvement: 1800-3000ms | Poor: >3000ms
   */
  onFCP((metric) => {
    track('web_vitals', {
      name: 'FCP',
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType
    });
  });

  /**
   * EN: Time to First Byte - measures server response time
   * RU: Время до первого байта - измеряет скорость ответа сервера
   * Good: 0-800ms | Needs improvement: 800-1800ms | Poor: >1800ms
   */
  onTTFB((metric) => {
    track('web_vitals', {
      name: 'TTFB',
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType
    });
  });
}
