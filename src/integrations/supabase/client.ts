import { createClient } from '@supabase/supabase-js';
import type { Database } from './types'; // Возвращаем импорт типов

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Создаем неубиваемую безопасную заглушку на случай отсутствия ключей в продакшене
const createMockSupabase = () => {
  console.warn("Supabase keys are missing. Cloud sync is disabled, app running in offline mode.");
  
  // Универсальная цепочка, которая возвращает саму себя на любой вызов метода базы данных
  const chain = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single', 'maybe', 'limit', 'range'];
  
  methods.forEach(method => {
    (chain as any)[method] = () => chain;
  });
  
  // Добавляем Promise-совместимость (then), чтобы await возвращал пустые структуры без ошибок
  (chain as any).then = (onfulfilled: any) => onfulfilled({ data: [], error: null });

  return {
    from: () => chain,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    }
  } as any;
};

// Экспортируем реальный клиент или безопасную заглушку
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: window.localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : createMockSupabase();
