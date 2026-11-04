// Dünya: "Tuzak seçenek" (Economist aboneliği, Ariely). Tek sahne: bir abonelik sayfası ve önündeki 100 kişi.
// Kalıp: Bu neden var? Nesne + soru → katman katman açıklama → ilk kareye dönüş (büyüteç tuzağın üstünde durur).
// Bölümler (konu bankası sırası): 0 kanca, 1 seçenekler, 2 Ariely, 3 seçimler, 4 röntgen, 5 satır silinir, 6 yeni seçimler, 7 açıklama, 8 kapanış, 9 REHBER.
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { FONT, W } from '../theme.ts';
import { gir, karis, useTimeline, WorldQc, type WorldProps } from './kit.tsx';

const L = { bg: '#ECEAE6', paper: '#F7F6F3', ink: '#151515', muted: '#7C7972', line: '#D9D6CF', accent: '#E8402A' };
const X = { bg: '#0D1B2C', cyan: '#5FD4E6' };

const ROWS = [
  { label: 'Dijital', price: '59 dolar' },
  { label: 'Basılı', price: '125 dolar' },
  { label: 'Basılı + dijital', price: '125 dolar' },
];
const PW = 840; // sayfa genişliği
const HEAD = 130; // sayfa başlığı
const RH = 190; // satır adımı
const PH = HEAD + RH * 3 + 10;

// 100 kişi: 20 × 5 ızgara, sayfanın altında.
const CROWD = Array.from({ length: 100 }, (_, i) => ({ x: 160 + (i % 20) * 40, y: 1040 + Math.floor(i / 20) * 50 }));
/** Satırın sağındaki "seçenler" alanında i. yer (sayfa koordinatı). */
const slot = (row: number, i: number, rowY: (r: number) => number) => ({ x: 470 + (i % 14) * 25, y: rowY(row) + 34 + Math.floor(i / 14) * 21 });

function Person({ x, y, c, o = 1, s = 1 }: { x: number; y: number; c: string; o?: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <circle cy={-11} r={6.5} fill={c} />
      <rect x={-6} y={-3} width={12} height={15} rx={6} fill={c} />
    </g>
  );
}

export function Tuzak({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);

  // ---- kamera: sayfa yakın (0–1), geri çekilir ve kalabalık görünür (2–7), ilk kareye döner (8)
  const geri = gir(t, bas(2), 1.0) * (1 - gir(t, bas(7), 1.0)); // açıklamada kamera sayfaya geri yaklaşır
  const sc = karis(1, 0.8, geri) * karis(1, 1.03, gir(t, bas(8), 2.5)); // kapanışta çok yavaş yaklaşma
  const ox = 540 - (PW / 2) * sc;
  const oy = karis(400, 300, geri) + Math.sin(t * 0.6) * 3; // kamera hiç tam durmaz
  const P = (px: number, py: number) => ({ x: ox + px * sc, y: oy + py * sc });

  // ---- röntgen: koyu zemin, tarama çizgisi
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, bas(5), 0.6));
  const tarama = gir(t, bas(4) + 0.2, 1.4);

  // ---- orta satır: silinir (5), hayalet olarak döner (7), kapanışta düz satır (8)
  const sil = gir(t, an(5, 2), 0.5); // çizgi
  const kapan = gir(t, an(5, 5), 0.7) * (1 - gir(t, bas(7), 0.8));
  const hayalet = gir(t, bas(7), 0.8) * (1 - gir(t, bas(8), 0.8));
  const rowY = (r: number) => HEAD + r * RH - (r === 2 ? RH * kapan : 0);

  // ---- seçimler: 1. tur (3) 16 dijital + 84 paket; 2. tur (6) 68 dijital + 32 paket
  const tur1 = an(3, 0);
  const geriDon = gir(t, bas(5), 0.8); // 1. tur bitince herkes kalabalığa döner
  const tur2 = an(6, 0);
  const kalabalikGit = gir(t, bas(8), 0.6);
  const people = CROWD.map((home, i) => {
    const a1 = i < 16 ? slot(0, i, rowY) : slot(2, i - 16, rowY);
    const a2 = i < 68 ? slot(0, i, rowY) : slot(2, i - 68, rowY);
    const u1 = gir(t, tur1 + i * 0.013, 0.7) * (1 - geriDon);
    const u2 = gir(t, tur2 + i * 0.013, 0.7);
    const p1 = P(a1.x, a1.y);
    const p2 = P(a2.x, a2.y);
    const x = u2 > 0 ? karis(home.x, p2.x, u2) : karis(home.x, p1.x, u1);
    const y = u2 > 0 ? karis(home.y, p2.y, u2) : karis(home.y, p1.y, u1);
    const toRow = u2 > 0 ? (i < 68 ? 0 : 2) : (i < 16 ? 0 : 2);
    const arrived = Math.max(u1, u2) > 0.98;
    return { x, y, row: arrived ? toRow : -1, s: karis(1, sc, Math.max(u1, u2)) };
  });
  const count = (r: number) => people.filter((p) => p.row === r).length;
  const crowdIn = gir(t, an(2, 3), 0.8) * (1 - kalabalikGit); // "100 öğrenciye"

  const ink = mix(L.ink, X.cyan, xr);
  const bg = mix(L.bg, X.bg, xr);

  // ---- büyüteç: kancada satırların üstünde gezinir; kapanışta orta satırda durur
  const mgIn = gir(t, an(0, 1), 0.6) * (1 - gir(t, bas(1), 0.5)) + gir(t, an(8, 0), 0.6);
  const gez = Math.min(1, Math.max(0, (t - an(0, 1)) / Math.max(0.5, bas(1) - an(0, 1))));
  const mgRow = t < bas(1) ? karis(0, 2, 0.5 - 0.5 * Math.cos(gez * Math.PI * 2)) : 1;
  const mg = P(320 + Math.sin(t * 1.3) * (t < bas(1) ? 40 : 4), rowY(Math.min(2, mgRow)) + RH / 2 - 10);
  const damga = gir(t, an(8, 2), 0.35);

  // ---- vurgu: seçenekler okunurken satırlar sırayla yanar
  const vurgu = [an(1, 5), an(1, 8), an(1, 11)].map((t0, r) => gir(t, t0, 0.3) * (r < 2 ? 1 - gir(t, [an(1, 8), an(1, 11)][r], 0.3) : 1 - gir(t, bas(2), 0.4)));
  const sifir = gir(t, an(3, 6), 0.4) * (1 - gir(t, bas(4), 0.3)); // "hiç kimse"

  return (
    <AbsoluteFill style={{ background: bg }}>
      {/* kağıt dokusu ve vinyet */}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="gren"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0" /></filter>
          <radialGradient id="vin" cx="50%" cy="40%" r="75%"><stop offset="60%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity="0.14" /></radialGradient>
          <pattern id="izgara" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke={X.cyan} strokeOpacity="0.09" /></pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#izgara)" opacity={xr} />
        <rect width="1080" height="1920" filter="url(#gren)" />
        <rect width="1080" height="1920" fill="url(#vin)" />

        {/* ---- abonelik sayfası */}
        <g transform={`translate(${ox},${oy}) scale(${sc})`}>
          <rect x={8} y={14} width={PW} height={PH - RH * kapan} rx={30} fill="#000" opacity={0.08 * (1 - xr)} />
          <rect width={PW} height={PH - RH * kapan} rx={30} fill={mix(L.paper, X.bg, xr)} stroke={mix(L.line, X.cyan, xr)} strokeWidth={3} />
          <text x={44} y={72} fontFamily="Outfit" fontWeight={800} fontSize={44} letterSpacing={6} fill={ink}>ABONELİK</text>
          <text x={PW - 44} y={72} textAnchor="end" fontFamily="JetBrains Mono" fontSize={24} fill={mix(L.muted, X.cyan, xr)}>DERGİ · 1 YIL</text>
          <line x1={44} x2={PW - 44} y1={102} y2={102} stroke={mix(L.line, X.cyan, xr)} strokeWidth={2} />
          {ROWS.map((r, i) => {
            const y = rowY(i);
            const mid = i === 1;
            const o = mid ? Math.max(1 - kapan, 0) : 1;
            const dashed = mid && (hayalet > 0.02 || xr > 0.02);
            const n = count(i);
            return (
              <g key={i} opacity={o}>
                <rect x={24} y={y + 10} width={PW - 48} height={RH - 24} rx={20}
                  fill={vurgu[i] > 0 ? `rgba(232,64,42,${0.08 * vurgu[i]})` : 'transparent'}
                  stroke={mid && xr > 0 ? X.cyan : dashed ? L.muted : 'transparent'} strokeWidth={mid && xr > 0 ? 4 : 3} strokeDasharray={dashed ? '14 10' : undefined} />
                <rect x={24} y={y + 10} width={10 * vurgu[i]} height={RH - 24} rx={5} fill={L.accent} />
                <text x={64} y={y + 82} fontFamily="Outfit" fontWeight={800} fontSize={46} fill={ink} opacity={mid && hayalet > 0 ? 0.55 : 1}>{r.label}</text>
                <text x={64} y={y + 130} fontFamily="Outfit" fontWeight={600} fontSize={34} fill={mix(L.muted, X.cyan, xr)}>{r.price}</text>
                {/* seçen sayısı */}
                {(n > 0 || (mid && sifir > 0)) && (
                  <text x={440} y={y + 108} textAnchor="end" fontFamily="Outfit" fontWeight={800} fontSize={64} fill={i === 2 ? L.accent : ink} opacity={mid ? sifir : 1}>{mid ? 0 : n}</text>
                )}
                {/* 1. turdan kalan 84, ikinci turda üstü çizili */}
                {i === 2 && t > tur2 && (
                  <g opacity={gir(t, an(6, 7), 0.4)}>
                    <text x={440} y={y + 48} textAnchor="end" fontFamily="Outfit" fontWeight={600} fontSize={34} fill={L.muted}>84</text>
                    <line x1={384} x2={444} y1={y + 37} y2={y + 37} stroke={L.accent} strokeWidth={4} />
                  </g>
                )}
                {/* silinen satırın üstündeki çizgi */}
                {mid && <line x1={50} x2={50 + (PW - 100) * sil} y1={y + 86} y2={y + 86} stroke={L.accent} strokeWidth={8} strokeLinecap="round" opacity={1 - gir(t, bas(7), 0.6)} />}
                {/* röntgende tuzak etiketi */}
                {mid && xr > 0 && (
                  <g opacity={gir(t, bas(4) + 0.9, 0.4) * xr}>
                    <rect x={PW - 260} y={y + 54} width={200} height={70} rx={12} fill="none" stroke={X.cyan} strokeWidth={4} />
                    <text x={PW - 160} y={y + 102} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={34} fill={X.cyan}>TUZAK</text>
                  </g>
                )}
              </g>
            );
          })}
          {/* röntgen tarama çizgisi */}
          {xr > 0 && <rect x={0} y={karis(-40, PH, tarama)} width={PW} height={40} fill={X.cyan} opacity={0.35 * xr} />}
          {/* açıklama: hayalet satırdan pakete ok, "fırsat?" */}
          {hayalet > 0 && (
            <g opacity={gir(t, an(7, 6), 0.5) * (1 - gir(t, bas(8), 0.5))}>
              <path d={`M ${PW - 120} ${rowY(1) + 120} C ${PW - 40} ${rowY(1) + 170}, ${PW - 40} ${rowY(2) + 30}, ${PW - 120} ${rowY(2) + 60}`} fill="none" stroke={L.accent} strokeWidth={6} strokeLinecap="round" strokeDasharray="2 14" />
              <g transform={`translate(${PW - 140},${rowY(2) + 138}) scale(${0.8 + 0.2 * gir(t, an(7, 8), 0.4)})`} opacity={gir(t, an(7, 8), 0.4)}>
                <rect x={-80} y={-34} width={160} height={58} rx={29} fill={L.accent} />
                <text y={8} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={30} fill="#fff">FIRSAT?</text>
              </g>
            </g>
          )}
          {/* kapanış damgası */}
          {damga > 0 && (
            <g transform={`translate(${PW - 190},${rowY(1) + 95}) rotate(-8) scale(${1.5 - damga * 0.5})`} opacity={damga}>
              <rect x={-130} y={-46} width={260} height={92} rx={14} fill="none" stroke={L.accent} strokeWidth={8} />
              <text y={18} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={500} fontSize={52} letterSpacing={4} fill={L.accent}>TUZAK</text>
            </g>
          )}
        </g>

        {/* ---- kalabalık */}
        <g opacity={crowdIn}>
          {people.map((p, i) => <Person key={i} x={p.x} y={p.y} s={p.s} c={xr > 0.5 ? X.cyan : i % 7 === 0 ? '#5B5852' : L.ink} o={0.9} />)}
        </g>
        <g opacity={crowdIn * (1 - gir(t, tur1, 0.4)) + crowdIn * gir(t, bas(5) + 0.4, 0.4) * (1 - gir(t, tur2, 0.4))}>
          <text x={540} y={995} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={28} fill={L.muted}>100 ÖĞRENCİ</text>
        </g>

        {/* ---- büyüteç */}
        {mgIn > 0 && (
          <g transform={`translate(${mg.x},${mg.y})`} opacity={Math.min(1, mgIn)}>
            <circle r={78} fill="rgba(255,255,255,0.25)" stroke={L.ink} strokeWidth={12} />
            <path d="M 56 56 L 120 120" stroke={L.ink} strokeWidth={22} strokeLinecap="round" />
          </g>
        )}
      </svg>

      {/* ---- dev yazı yalnız başta ve sonda */}
      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={1 - gir(t, bas(1), 0.4)}>
          <span style={{ opacity: gir(t, an(0, 0), 0.4) }}>Bu listede bir tuzak var.</span>
          <span style={{ display: 'block', color: L.accent, opacity: gir(t, an(0, 6), 0.4) }}>Bulabilir misin?</span>
        </Headline>
        <Headline show={gir(t, an(8, 0), 0.5)}>
          <span>Tuzak: kimsenin</span>
          <span style={{ display: 'block', color: L.accent }}>almadığı seçenek.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}

function Headline({ show, children }: { show: number; children: ReactNode }) {
  if (show <= 0) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: show, fontFamily: FONT.sans, fontWeight: 800, fontSize: 64, lineHeight: 1.08, letterSpacing: -1.5, color: L.ink }}>
      {children}
    </div>
  );
}

/** İki renk arasında karışım (#rrggbb). */
function mix(a: string, b: string, u: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(',')})`;
}
