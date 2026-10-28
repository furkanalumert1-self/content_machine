import type { ReactNode } from 'react';
import { Nav } from '@/components/nav';
import { requireAdminPage } from '@/lib/dal';
import { signOut } from '../giris/actions';
import { redirect } from 'next/navigation';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const { db, user } = await requireAdminPage();
  const { data: s } = await db.from('app_settings').select('mode, paused').single();
  // Son 3 günün ElevenLabs kredi kaydı (günlük render işi yazar); yalnızca uyarıysa gösterilir.
  const { data: credit } = await db.from('logs').select('level, message, at').eq('job', 'elevenlabs-kredi')
    .gte('at', new Date(Date.now() - 3 * 86_400_000).toISOString()).order('at', { ascending: false }).limit(1).maybeSingle();
  async function logout() {
    'use server';
    await signOut();
    redirect('/giris');
  }
  return (
    <div className="min-h-dvh">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan shadow-[0_0_10px_#5fd4e6]" />
              <span className="font-semibold">İçerik Makinesi</span>
              <span className="hidden text-sm text-white/50 sm:inline">· Callypso Engage</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {s?.paused && <span className="rounded-full bg-red-500 px-2 py-0.5 font-semibold">DURDURULDU</span>}
              <span className="rounded-full bg-white/10 px-2 py-0.5">{s?.mode === 'auto' ? 'Otomatik mod' : 'Onaylı mod'}</span>
              <form action={logout}>
                <button className="rounded-lg px-2 py-1 text-white/70 hover:text-white" title={user.email}>Çıkış</button>
              </form>
            </div>
          </div>
          <Nav />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {credit?.level === 'warn' && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">⚠️ {credit.message}</div>
        )}
        {children}
      </main>
    </div>
  );
}
