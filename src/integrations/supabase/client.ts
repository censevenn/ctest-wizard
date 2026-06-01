import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Создаем безопасную заглушку на случай отсутствия ключей
const createMockSupabase = () => {
  console.warn("Supabase keys are missing. Cloud sync is disabled, app running in offline mode.");
  
  const chain = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single', 'maybe', 'limit', 'range'];
  
  methods.forEach(method => {
    (chain as any)[method] = () => chain;
  });
  
  (chain as any).then = (onfulfilled: any) => onfulfilled({ data: [], error: null });

  return {
    from: () => chain,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    }
  } as any;
};

// Проверяем наличие ключей и экспортируем либо реальный клиент, либо заглушку
const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey) 
  : createMockSupabase();
