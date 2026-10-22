'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  ['/kuyruk', 'Kuyruk ve onay'],
  ['/video-iste', 'Video iste'],
  ['/takvim', 'Takvim'],
  ['/performans', 'Performans'],
  ['/fikirler', 'Fikir bankası'],
  ['/urunler', 'Ürünler'],
  ['/ayarlar', 'Ayarlar'],
] as const;

export function Nav() {
  const path = usePathname();
  return (
    <nav aria-label="Ana menü" className="flex gap-1 overflow-x-auto">
      {ITEMS.map(([href, label]) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${active ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white'}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
