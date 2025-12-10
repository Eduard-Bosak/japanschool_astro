/* =============================================
   Typed Store - Centralized Type-Safe State Management
   Типизированное Хранилище - Централизованное типобезопасное управление состоянием
   ============================================= */

/* EN: Application state schema - define all storage keys here
   RU: Схема состояния приложения - определите все ключи хранилища здесь */
export interface StoreSchema {
  // Theme
  theme: 'light' | 'dark';

  // FAQ state
  'faq.state': {
    q: string;
    cat: string;
    open: string[];
  };
  faq_expanded_items: number[];

  // Blog
  'blog.fontSize': number;
  'blog.bookmarks': string[];

  // API queue
  'api.queue': Array<{
    type: string;
    payload: Record<string, unknown>;
    ts: number;
  }>;
}

type StoreListener<K extends keyof StoreSchema> = (value: StoreSchema[K] | null) => void;

/**
 * EN: Type-safe localStorage wrapper with reactivity
 * RU: Типобезопасная обёртка для localStorage с реактивностью
 *
 * @example
 * // Get with autocomplete
 * const theme = store.get('theme'); // 'light' | 'dark' | null
 *
 * // Set with type checking
 * store.set('theme', 'dark'); // ✓
 * store.set('theme', 'blue'); // ❌ Compile error!
 *
 * // Subscribe to changes
 * const unsubscribe = store.subscribe('theme', (theme) => {
 *   console.log('Theme changed:', theme);
 * });
 */
class TypedStore {
  private listeners: Map<keyof StoreSchema, Set<Function>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * EN: Get value from storage
   * RU: Получить значение из хранилища
   */
  get<K extends keyof StoreSchema>(key: K): StoreSchema[K] | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const raw = localStorage.getItem(key as string);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as StoreSchema[K];
    } catch (error) {
      console.error(`[Store] Failed to get "${String(key)}":`, error);
      return null;
    }
  }

  /**
   * EN: Set value in storage and notify listeners
   * RU: Установить значение в хранилище и уведомить слушателей
   */
  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(key as string, JSON.stringify(value));
      this.notify(key, value);
    } catch (error) {
      console.error(`[Store] Failed to set "${String(key)}":`, error);
    }
  }

  /**
   * EN: Remove value from storage
   * RU: Удалить значение из хранилища
   */
  remove(key: keyof StoreSchema): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(key as string);
      this.notify(key, null);
    } catch (error) {
      console.error(`[Store] Failed to remove "${String(key)}":`, error);
    }
  }

  /**
   * EN: Subscribe to value changes
   * RU: Подписаться на изменения значения
   *
   * @returns Unsubscribe function
   */
  subscribe<K extends keyof StoreSchema>(key: K, callback: StoreListener<K>): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  /**
   * EN: Notify all listeners of a key
   * RU: Уведомить всех слушателей ключа
   */
  private notify<K extends keyof StoreSchema>(key: K, value: StoreSchema[K] | null): void {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(value);
        } catch (error) {
          console.error(`[Store] Error in ${String(key)} listener:`, error);
        }
      });
    }
  }

  /**
   * EN: Clear all storage or specific key
   * RU: Очистить всё хранилище или конкретный ключ
   */
  clear(key?: keyof StoreSchema): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (key) {
        this.remove(key);
      } else {
        localStorage.clear();
        // Notify all listeners
        this.listeners.forEach((_, k) => {
          this.notify(k, null);
        });
      }
    } catch (error) {
      console.error('[Store] Failed to clear:', error);
    }
  }
}

/* EN: Export singleton instance
   RU: Экспорт singleton инстанса */
export const store = new TypedStore();

/* EN: Export class for testing
   RU: Экспорт класса для тестирования */
export { TypedStore };
