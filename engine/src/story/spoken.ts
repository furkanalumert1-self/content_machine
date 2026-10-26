// Seslendirme için Türkçe okunuş: ondalık sayılar "3,6" → "üç virgül altı" (ses motoru aksi hâlde "nokta" diyebiliyor).
const ONES = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];

export function intToTr(n: number): string {
  if (n < 10) return ONES[n];
  if (n < 100) return [TENS[Math.floor(n / 10)], n % 10 ? ONES[n % 10] : ''].filter(Boolean).join(' ');
  if (n < 1000) {
    const h = Math.floor(n / 100);
    return [h === 1 ? 'yüz' : `${ONES[h]} yüz`, n % 100 ? intToTr(n % 100) : ''].filter(Boolean).join(' ');
  }
  return String(n);
}

/** "0,5" / "3,6" / "%47,3" gibi ondalıklar. Binlik ayraçlı sayılara ("1.170") dokunulmaz. */
const DECIMAL = /(%?)(\d{1,3}),(\d{1,2})(?!\d)/g;

export interface Replacement { from: number; to: number; original: string }

export function spoken(text: string): { text: string; replacements: Replacement[] } {
  const replacements: Replacement[] = [];
  let out = '';
  let last = 0;
  for (const m of text.matchAll(DECIMAL)) {
    const [all, pct, a, b] = m;
    const words = `${pct ? 'yüzde ' : ''}${intToTr(Number(a))} virgül ${b.split('').length === 2 && b[0] !== '0' ? intToTr(Number(b)) : b.split('').map((d) => ONES[Number(d)]).join(' ')}`;
    out += text.slice(last, m.index);
    replacements.push({ from: out.length, to: out.length + words.length, original: all });
    out += words;
    last = m.index! + all.length;
  }
  return { text: out + text.slice(last), replacements };
}
