// Yayın saati seçimi (Europe/Istanbul). Az veride keşif; yeterli veride en iyi ortalamayı kullan + düzenli keşif.
// Seçilen saat "kanıtlanmış en iyi saat" olarak sunulmaz; gerekçede örnek sayısı yazılır.
import { tzOffsetMinutes } from '../plan/time.ts';

export const SLOT_MINUTES = 30;
export const MIN_SCORED_FOR_EXPLOIT = 8;  // toplamda bu kadar ölçülmüş videodan önce hep keşif
export const MIN_PER_SLOT = 2;            // bir saatin "bilinen" sayılması için en az örnek
export const EXPLORE_EVERY = 4;           // yeterli veride bile 4 günde bir keşif
export const LEAD_MINUTES = 45;           // render + onay için en az bu kadar önce (elle istenen video)
export const AUTO_LEAD_MINUTES = 240;     // otomatik plan: onay için en az 4 saat (08:41 → aynı gün 13:00 sonrası + akşam)

export interface Window { start: string; end: string } // "12:00" – "14:00" (bitiş hariç)

export interface PastVideo { publishedAt: Date; score: number | null } // score: etkileşim puanı; metriği yoksa null

export interface SlotChoice {
  publishAt: Date;
  slot: string;       // "HH:MM" İstanbul
  mode: 'keşif' | 'kullan';
  reason: string;
}

const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const fmt = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export function candidateSlots(windows: Window[]): string[] {
  const out: string[] = [];
  for (const w of windows) for (let m = toMin(w.start); m < toMin(w.end); m += SLOT_MINUTES) out.push(fmt(m));
  return [...new Set(out)].sort();
}

/** Bir anın İstanbul'daki tarihini (YYYY-MM-DD) ve dakikasını verir. */
export function localParts(at: Date, tz: string) {
  const off = tzOffsetMinutes(at, tz);
  const local = new Date(at.getTime() + off * 60000);
  return { date: local.toISOString().slice(0, 10), minute: local.getUTCHours() * 60 + local.getUTCMinutes() };
}

/** Yerel tarih + "HH:MM" → UTC an. */
export function localToUtc(date: string, hhmm: string, tz: string): Date {
  const guess = new Date(`${date}T${hhmm}:00Z`);
  const off = tzOffsetMinutes(guess, tz);
  return new Date(guess.getTime() - off * 60000);
}

const slotOf = (at: Date, tz: string, slots: string[]) => {
  const m = localParts(at, tz).minute;
  const nearest = slots.map((s) => ({ s, d: Math.abs(toMin(s) - m) })).sort((a, b) => a.d - b.d)[0];
  return nearest && nearest.d <= SLOT_MINUTES / 2 ? nearest.s : null;
};

export interface ChooseInput {
  windows: Window[];
  timezone: string;
  now: Date;
  history: PastVideo[];            // yayınlanmış videolar
  recentPlanned: Date[];           // son 14 günde planlanan publish_at'ler (henüz ölçülmemiş olanlar dahil)
  onlineByHour?: number[] | null;  // İstanbul saatine göre 0–23 ortalama çevrimiçi takipçi
  /** Verilirse: her yayın aralığına günde en fazla bir video; bu anlarda (yerel gün + aralık) dolu sayılır. */
  occupied?: Date[];
  /** Şu andan en az kaç dakika sonra (varsayılan LEAD_MINUTES). */
  minLeadMinutes?: number;
}

export function chooseSlot(input: ChooseInput): SlotChoice {
  const { timezone: tz, now } = input;
  const allSlots = candidateSlots(input.windows);
  if (!allSlots.length) throw new Error('Yayın saat aralığı tanımlı değil.');
  const lead = input.minLeadMinutes ?? LEAD_MINUTES;
  const earliest = new Date(now.getTime() + lead * 60_000);

  // İlk uygun (gün, aralık): yeterince ileride ve (occupied verildiyse) o gün o aralıkta başka video yok.
  const winSlots = input.windows.map((w) => allSlots.filter((s) => toMin(s) >= toMin(w.start) && toMin(s) < toMin(w.end)));
  const busy = new Set((input.occupied ?? []).map((d) => {
    const lp = localParts(d, tz);
    return `${lp.date}|${input.windows.findIndex((w) => lp.minute >= toMin(w.start) - SLOT_MINUTES && lp.minute < toMin(w.end) + SLOT_MINUTES)}`;
  }));
  const today = localParts(now, tz);
  let date = today.date;
  let slots = allSlots;
  let usable: string[] = [];
  let windowNote = '';
  search: for (let day = 0; day < 14; day++) {
    date = new Date(Date.parse(`${today.date}T00:00:00Z`) + day * 86_400_000).toISOString().slice(0, 10);
    for (const [wi, ws] of (input.occupied ? winSlots.map((x, i) => [i, x] as const) : [[-1, allSlots] as const])) {
      if (wi >= 0 && busy.has(`${date}|${wi}`)) continue;
      const ok = ws.filter((s) => localToUtc(date, s, tz) >= earliest);
      if (ok.length) {
        usable = ok;
        slots = ws;
        if (wi >= 0) windowNote = ` Aralık: ${input.windows[wi].start}–${input.windows[wi].end} (her aralığa günde bir video).`;
        break search;
      }
    }
  }
  if (!usable.length) throw new Error('Önümüzdeki 14 günde boş yayın aralığı yok.');

  // Saat başına örnek ve ortalama
  const stats = new Map(slots.map((s) => [s, { n: 0, sum: 0, tried: 0 }]));
  for (const v of input.history) {
    const s = slotOf(v.publishedAt, tz, slots);
    if (!s) continue;
    const st = stats.get(s)!;
    st.tried++;
    if (v.score != null) { st.n++; st.sum += v.score; }
  }
  for (const p of input.recentPlanned) { const s = slotOf(p, tz, slots); if (s) stats.get(s)!.tried += 0.5; }

  const online = (s: string) => input.onlineByHour?.[Math.floor(toMin(s) / 60)] ?? 0;
  const scored = input.history.filter((v) => v.score != null).length;
  const dayIndex = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  const known = usable.filter((s) => stats.get(s)!.n >= MIN_PER_SLOT);

  // Eşitlikte: önce takipçi aktifliği yüksek saat, sonra güne göre dönen sıra (her gün aynı saat seçilmesin).
  const rotation = (s: string) => (((slots.indexOf(s) - dayIndex) % slots.length) + slots.length) % slots.length;
  const leastTried = () =>
    [...usable].sort((a, b) => stats.get(a)!.tried - stats.get(b)!.tried || online(b) - online(a) || rotation(a) - rotation(b))[0];
  const hasActivity = !!input.onlineByHour?.some((x) => x > 0);
  const activity = (s: string) => hasActivity
    ? ` Bu saatte ortalama ${Math.round(online(s))} takipçi çevrimiçi (Instagram verisi).`
    : ' Takipçi aktif saat verisi yok (100 takipçi altı veya izin yok).';

  let slot: string;
  let mode: SlotChoice['mode'];
  let reason: string;
  if (scored < MIN_SCORED_FOR_EXPLOIT || !known.length) {
    slot = leastTried();
    mode = 'keşif';
    reason = `Keşif: ölçülmüş video sayısı ${scored} (en az ${MIN_SCORED_FOR_EXPLOIT} gerekli). En az denenen saat seçildi (${stats.get(slot)!.tried} deneme).${activity(slot)} Bu bir deneme saatidir, kanıtlanmış en iyi saat değildir.`;
  } else if (dayIndex % EXPLORE_EVERY === 0) {
    slot = leastTried();
    mode = 'keşif';
    reason = `Düzenli keşif günü (${EXPLORE_EVERY} günde bir): en az denenen saat (${stats.get(slot)!.tried} deneme) yeniden ölçülüyor.${activity(slot)}`;
  } else {
    const mean = (s: string) => stats.get(s)!.sum / stats.get(s)!.n;
    slot = [...known].sort((a, b) => mean(b) - mean(a) || online(b) - online(a))[0];
    mode = 'kullan';
    const ranking = known.map((s) => `${s}: ${Math.round(mean(s))} (n=${stats.get(s)!.n})`).join(', ');
    reason = `Şimdiye kadarki en yüksek ortalama etkileşim ${slot} (n=${stats.get(slot)!.n}). Karşılaştırma: ${ranking}.${activity(slot)} Örnek sayısı az olduğu için kesin değildir.`;
  }

  return { publishAt: localToUtc(date, slot, tz), slot, mode, reason: `${date} ${slot} (İstanbul).${windowNote} ${reason}` };
}
