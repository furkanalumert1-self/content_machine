import { Notice } from '@/components/ui';
import { LoginForm } from './form';

const REASONS: Record<string, string> = {
  'yetkisiz hesap': 'Bu hesabın panele erişim yetkisi yok.',
  'yönetici değil': 'Bu hesap yönetici olarak tanımlı değil (kurulum rehberi: admins tablosu).',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ neden?: string }> }) {
  const { neden } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-cyan shadow-[0_0_12px_#5fd4e6]" />
          <span className="font-semibold">İçerik Makinesi</span>
        </div>
        <h1 className="text-xl font-semibold">Giriş</h1>
        <p className="mb-5 mt-1 text-sm text-muted">E-posta ve şifrenizle girin. Yalnızca yönetici hesabı girebilir.</p>
        {neden && neden !== 'oturum yok' && <div className="mb-4"><Notice tone="warn">{REASONS[neden] ?? 'Lütfen tekrar giriş yapın.'}</Notice></div>}
        <LoginForm />
      </div>
    </main>
  );
}
