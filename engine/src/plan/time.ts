// Saat dilimi hesapları (Europe/Istanbul vb.) — harici kütüphane olmadan.

/** Verilen anın, saat dilimindeki ofsetini dakika olarak döndürür (İstanbul: +180). */
export function tzOffsetMinutes(at: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(at).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** Saat dilimindeki günün başlangıcını (00:00) UTC an olarak döndürür. */
export function startOfLocalDay(at: Date, timeZone: string): Date {
  const off = tzOffsetMinutes(at, timeZone);
  const local = new Date(at.getTime() + off * 60000);
  const midnightLocalAsUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return new Date(midnightLocalAsUtc - off * 60000);
}
