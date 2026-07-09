import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan las credenciales de Supabase en el archivo .env.local");
}

export const supabase = createClient(
  supabaseUrl || 'https://jvdebozykkmvzhpxcqmk.supabase.co', 
  supabaseAnonKey || 'sb_publishable_QJAGPkYs_qicJDVw-YVgKQ_ucCYlNHO'
);
