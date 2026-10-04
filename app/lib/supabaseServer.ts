import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '@/app/lib/supabaseClient';

// Cliente de Supabase para Server Components, generateMetadata y la ruta de imagen
// OG (next/og) — nunca reutilizar el `supabase` de app/lib/supabaseClient.ts ahí:
// ese está pensado para el navegador y, al importarse, lee `window.location.hash` a
// nivel de módulo (ver comentario en ese archivo) y deja la sesión persistiendo en
// localStorage por defecto — ninguna de las dos cosas existe ni tiene sentido en el
// server, donde cada request es anónimo y de un solo uso.
//
// Mismo proyecto/anon key (no hay credenciales separadas por entorno en este repo),
// pero con persistSession/detectSessionInUrl/autoRefreshToken apagados: solo lee
// datos públicos (profiles_with_rank, user_trades con status='active'), nunca actúa
// en nombre de un usuario logueado, así que no hace falta nada de manejo de sesión.
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false,
    autoRefreshToken: false,
  },
});
