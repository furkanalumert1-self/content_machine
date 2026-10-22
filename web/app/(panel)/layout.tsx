import type { ReactNode } from 'react';
import { Nav } from '@/components/nav';
import { requireAdminPage } from '@/lib/dal';
import { signOut } from '../giris/actions';
import { redirect } from 'next/navigation';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const { db, user } = await requireAdminPage();
  const { data: s } = await db.from('app_settings').select('mode, paused').single();
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
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
