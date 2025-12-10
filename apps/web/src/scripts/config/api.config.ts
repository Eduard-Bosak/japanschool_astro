/* =============================================
   API Configuration
   Конфигурация API
   ============================================= */

/**
 * EN: Configure API endpoints for backend integration
 * RU: Настройка эндпоинтов API для интеграции с бэкендом
 *
 * Development: http://localhost:3000
 * Production: Portal on Vercel
 */

interface APIEndpoints {
  submitForm: string;
  submissions: string;
  health: string;
}

interface APIConfig {
  baseURL: string;
  endpoints: APIEndpoints;
  timeout: number;
  retries: number;
}

declare global {
  interface Window {
    __API_ENDPOINTS: {
      lead: string;
      program: string;
    };
  }
}

/* EN: Portal URL - production Vercel deployment
   RU: URL портала - продакшен деплой на Vercel */
const PORTAL_URL = 'https://japanschool-astro-9szg.vercel.app';

/* EN: Use local backend in development, portal in production
   RU: Локальный бэкенд в разработке, портал в продакшене */
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE_URL = isDev ? 'http://localhost:3000' : PORTAL_URL;

export const API_CONFIG: APIConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    submitForm: `${API_BASE_URL}/api/trial`,
    submissions: `${API_BASE_URL}/api/trial`,
    health: `${API_BASE_URL}/api/health`
  },
  timeout: 10000, // 10 seconds
  retries: 3
};

/**
 * EN: Set API configuration globally
 * RU: Установка глобальной конфигурации API
 */
if (typeof window !== 'undefined') {
  window.__API_ENDPOINTS = {
    lead: API_CONFIG.endpoints.submitForm,
    program: API_CONFIG.endpoints.submitForm
  };
}
