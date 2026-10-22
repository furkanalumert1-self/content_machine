import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicSupabase } from '../env';

/** Giriş yapan kullanıcının yetkisiyle çalışan istemci (RLS geçerli). Her istekte yeniden oluşturulur. */
export async function userClient() {
  const store = await cookies();
  const { url, anonKey } = publicSupabase();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Component içinde çerez yazılamaz; oturum yenilemesini proxy yapar.
        }
      },
    },
  });
}
