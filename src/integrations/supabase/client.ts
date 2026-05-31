import { createClient } from '@supabase/supabase-js';
import type { Database } from './types'; // Возвращаем импорт типов

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Создаем безопасную заглушку на случай отсутствия ключей в продакшене
const createMockSupabase = () => {
  console.warn("Supabase keys are missing. Cloud sync is disabled, app running in offline mode.");
  return {
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    }
  } as any; // Принудительно приводим к any, чтобы обмануть строгие проверки типов
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
