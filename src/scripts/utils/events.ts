/* =============================================
   Event Bus - Type-Safe Pub/Sub for Component Decoupling
   Event Bus - Типобезопасный Pub/Sub для развязки компонентов
   ============================================= */

/* EN: Application event registry - add all app events here
   RU: Реестр событий приложения - добавляйте все события сюда */
export interface AppEvents {
  // Images
  'images:ready': void;

  // Theme
  'theme:changed': { theme: 'light' | 'dark' };

  // FAQ
  'faq:opened': { id: string };
  'faq:closed': { id: string };
  'faq:expand-all': void;
  'faq:collapse-all': void;

  // Gallery
  'gallery:loaded': { count: number };
  'gallery:image-opened': { index: number; src: string };

  // Forms
  'form:submitted': { type: string };
  'form:error': { type: string; error: string };

  // Preloader
  'preloader:will-hide': void;
  'preloader:done': void;
}

/**
 * EN: Type-safe Event Bus for decoupling components
 * RU: Типобезопасный Event Bus для развязки компонентов
 *
 * @example
 * // Subscribe with autocomplete
 * eventBus.on('theme:changed', (data) => {
 *   console.log(data.theme); // Autocomplete works!
 * });
 *
 * // Emit with type checking
 * eventBus.emit('theme:changed', { theme: 'dark' }); // ✓
 * eventBus.emit('theme:changed', { theme: 'blue' }); // ❌ Compile error!
 */
class TypedEventBus {
  private events: Map<keyof AppEvents, Set<Function>>;

  constructor() {
    this.events = new Map();
  }

  /**
   * EN: Subscribe to an event
   * RU: Подписаться на событие
   */
  on<K extends keyof AppEvents>(event: K, callback: (data: AppEvents[K]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  /**
   * EN: Unsubscribe from an event
   * RU: Отписаться от события
   */
  off<K extends keyof AppEvents>(event: K, callback: (data: AppEvents[K]) => void): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * EN: Emit an event with type-safe data
   * RU: Отправить событие с типобезопасными данными
   */
  emit<K extends keyof AppEvents>(
    event: K,
    ...args: AppEvents[K] extends void ? [] : [AppEvents[K]]
  ): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const data = args[0];
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in ${String(event)} handler:`, error);
        }
      });
    }
  }

  /**
   * EN: Subscribe to event once (auto-unsubscribe after first call)
   * RU: Подписаться на событие один раз (авто-отписка после первого вызова)
   */
  once<K extends keyof AppEvents>(event: K, callback: (data: AppEvents[K]) => void): void {
    const onceWrapper = (data: AppEvents[K]) => {
      callback(data);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * EN: Clear all listeners for an event (or all events if no event specified)
   * RU: Очистить все слушатели события (или всех событий, если не указано)
   */
  clear(event?: keyof AppEvents): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * EN: Get count of listeners for an event
   * RU: Получить количество слушателей события
   */
  listenerCount(event: keyof AppEvents): number {
    return this.events.get(event)?.size || 0;
  }
}

/* EN: Export singleton instance
   RU: Экспорт singleton инстанса */
export const eventBus = new TypedEventBus();

/* EN: Export class for testing/custom instances
   RU: Экспорт класса для тестирования/кастомных инстансов */
export { TypedEventBus as EventBus };
