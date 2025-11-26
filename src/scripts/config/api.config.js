/* =============================================
   API Configuration
   Конфигурация API
   ============================================= */

/**
 * EN: Configure API endpoints for backend integration
 * RU: Настройка эндпоинтов API для интеграции с бэкендом
 *
 * Development: http://localhost:3000
 * Production: https://your-backend-domain.com
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  endpoints: {
    submitForm: `${API_BASE_URL}/api/submit-form`,
    submissions: `${API_BASE_URL}/api/submissions`,
    health: `${API_BASE_URL}/health`
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
