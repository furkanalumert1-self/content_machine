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

/** Kısaltmaların okunuşu (altyazıda özgün hâli kalır). "CEO'suna" → "si-i-o'suna": ek olduğu gibi kalır. */
const ABBR: Record<string, string> = { CEO: 'si-i-o', GTA: 'ci-ti-ey' };
const ABBR_RE = new RegExp(`(?<![\\p{L}\\d])(${Object.keys(ABBR).join('|')})(?![\\p{L}\\d])`, 'gu');

function decimalWords(pct: string, a: string, b: string) {
  return `${pct ? 'yüzde ' : ''}${intToTr(Number(a))} virgül ${b.split('').length === 2 && b[0] !== '0' ? intToTr(Number(b)) : b.split('').map((d) => ONES[Number(d)]).join(' ')}`;
}

export function spoken(text: string): { text: string; replacements: Replacement[] } {
  const replacements: Replacement[] = [];
  let out = '';
  let last = 0;
  const matches = [
    ...[...text.matchAll(DECIMAL)].map((m) => ({ index: m.index!, all: m[0], words: decimalWords(m[1], m[2], m[3]) })),
    ...[...text.matchAll(ABBR_RE)].map((m) => ({ index: m.index!, all: m[0], words: ABBR[m[1]] })),
  ].sort((x, y) => x.index - y.index);
  for (const m of matches) {
    if (m.index < last) continue;
    const { all, words } = m;
    out += text.slice(last, m.index);
    replacements.push({ from: out.length, to: out.length + words.length, original: all });
    out += words;
    last = m.index! + all.length;
  }
  return { text: out + text.slice(last), replacements };
}
