// Dünya: "Gevrek kutusu" (Airbnb kurucuları, 2008; Brian Chesky'ye göre 1.000+ kutu, ~30.000 dolar; kutu 40 dolar).
// Gerçek kişi ve logo yok: genel seçim temalı kutular (oy sandığı simgesi). 17.11 kuralı: 0. kare dolu ve hareketli
// (masada kutular, kâseye akan gevrek). Akış: boşalan kumbara, reddeden zarflar → oy sandığı, kutu tasarımı, 40 $ etiketi
// → 1.000+ kutu yığını, 30.000 $ → röntgen: kutu açılır, içinden hikâye kartları → mağazan: numaralı özel ambalaj, dürüst stok.
// Bölümler: 0 kanca, 1 para bitiyor, 2 kutu, 3 satış, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const RED = '#C8102E';
const BLUE = '#1F4E9C';
const FLAKE = '#E8B04A';

function Box({ x, y, s, c, xr, tag }: { x: number; y: number; s: number; c: string; xr: number; tag?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-110 -170 h200 l20 20 v320 h-220 z" fill={xr > 0.5 ? 'none' : c} stroke={xr > 0.5 ? X.cyan : '#00000050'} strokeWidth={4} />
      <path d="M90 -170 l20 20 v320 l-20 -14 z" fill="#000" opacity={0.18} />
      {/* oy sandığı simgesi */}
      <g transform="translate(-10,-40)">
        <rect x={-60} y={-30} width={120} height={90} rx={8} fill={xr > 0.5 ? 'none' : '#FFFFFF'} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={3} />
        <rect x={-30} y={-28} width={60} height={8} rx={4} fill={c} />
        <path d="M-14 -62 h28 v40 h-28 z" fill={xr > 0.5 ? 'none' : '#FFFFFF'} stroke={xr > 0.5 ? X.cyan : c} strokeWidth={4} />
        <path d="M-8 -48 l6 8 l12 -14" stroke={c} strokeWidth={4} fill="none" />
      </g>
      <ellipse cx={-10} cy={100} rx={70} ry={34} fill={xr > 0.5 ? 'none' : '#FFFFFF'} opacity={0.9} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />
      {[[-40, 96], [-10, 90], [20, 100], [-20, 110], [10, 112]].map(([fx, fy], i) => <circle key={i} cx={fx} cy={fy} r={9} fill={FLAKE} />)}
      {tag !== undefined && tag > 0 && (
        <g transform="translate(70,-150) rotate(12)" opacity={tag}>
          <path d="M-50 -26 h80 l30 26 l-30 26 h-80 z" fill="#FFFFFF" stroke={L.ink} strokeWidth={4} />
          <text x={-10} y={10} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={30} fill={L.ink}>40 $</text>
        </g>
      )}
    </g>
  );
}

export function Gevrek({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 5), 0.6));
  const bg = mix('#F1E6D2', X.bg, xr);

  // ---- kanca: masa, kutular, kâseye akan gevrek
  const hook = 1 - gir(t, bas(1), 0.4);
  // ---- 1: kumbara boşalır, reddeden zarflar
  const broke = gir(t, bas(1), 0.4) * (1 - gir(t, bas(2), 0.4));
  const drain = gir(t, an(1, 3), 1.0);
  const nope = gir(t, an(1, 6), 0.6);
  // ---- 2: oy sandığı → kutu tasarımı → 40 $
  const design = gir(t, bas(2), 0.4) * (1 - gir(t, bas(3), 0.4));
  const draw = gir(t, an(2, 3), 1.2);
  const price = gir(t, an(2, 12), 0.4);
  // ---- 3: 1.000+ kutu, 30.000 $
  const sales = gir(t, bas(3), 0.4) * (1 - gir(t, bas(4), 0.5));
  const stack = gir(t, an(3, 2), 1.2);
  const money = gir(t, an(3, 7), 0.6);
  const alive = gir(t, an(3, 11), 0.4);
  // ---- 5: kutu açılır, hikâye kartları
  const open = gir(t, bas(4) + 0.3, 0.8) * (1 - gir(t, bas(6), 0.4));
  const cards = [gir(t, an(5, 5), 0.3), gir(t, an(5, 7), 0.3), gir(t, an(5, 9), 0.3)];
  const lesson = gir(t, an(5, 5), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6
  const shop = gir(t, bas(6), 0.8);
  const numbered = gir(t, an(6, 4), 0.4);
  const stock = gir(t, an(6, 12), 0.5);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* kanca: mutfak masası */}
        {hook > 0 && (
          <g opacity={hook}>
            <rect x={60} y={1120} width={960} height={50} rx={10} fill="#B08A5A" />
            <Box x={290} y={900} s={1.05} c={RED} xr={xr} tag={1} />
            <Box x={790} y={900} s={1.05} c={BLUE} xr={xr} tag={1} />
            {/* kâse ve akan gevrek */}
            <path d="M440 1040 q100 90 200 0 z" fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
            {Array.from({ length: 10 }, (_, i) => {
              const ph = ((t * 1.2 + i / 10) % 1);
              return <circle key={i} cx={540 + Math.sin(i * 7) * 30} cy={karis(780, 1030, ph)} r={10} fill={FLAKE} opacity={ph < 0.95 ? 1 : 0} />;
            })}
            {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={480 + i * 15} cy={1030 - (i % 2) * 8} r={10} fill={FLAKE} />)}
          </g>
        )}

        {/* 1: para bitiyor, yatırımcılar hayır */}
        {broke > 0 && (
          <g opacity={broke}>
            <g transform="translate(330,820)">
              <rect x={-170} y={-140} width={340} height={280} rx={24} fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
              <text y={-80} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted}>KASA</text>
              <rect x={-120} y={-30} width={240} height={50} rx={10} fill={L.line} />
              <rect x={-120} y={-30} width={240 * (1 - drain * 0.95)} height={50} rx={10} fill={drain > 0.8 ? L.accent : L.good} />
            </g>
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(780,${640 + i * 200}) rotate(${-6 + i * 5})`} opacity={gir(t, an(1, 6) + i * 0.2, 0.3)}>
                <rect x={-130} y={-70} width={260} height={140} rx={10} fill="#FFFFFF" stroke={L.ink} strokeWidth={4} />
                <path d="M-130 -70 l130 80 l130 -80" fill="none" stroke={L.ink} strokeWidth={4} />
                <path d="M-40 -40 l80 80 M40 -40 l-80 80" stroke={L.accent} strokeWidth={10} strokeLinecap="round" opacity={nope} />
              </g>
            ))}
            <text x={90} y={430} fontFamily="JetBrains Mono" fontSize={32} letterSpacing={4} fill={L.ink}>2008</text>
          </g>
        )}

        {/* 2: oy sandığından kutuya; 40 $ */}
        {design > 0 && (
          <g opacity={design}>
            <g transform="translate(270,820)" opacity={1 - draw * 0.6}>
              <rect x={-120} y={-80} width={240} height={180} rx={14} fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
              <rect x={-60} y={-78} width={120} height={14} rx={6} fill={L.ink} />
              <path d="M-30 -150 h60 v80 h-60 z" fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
            </g>
            <path d="M420 820 h140" stroke={L.ink} strokeWidth={8} strokeLinecap="round" markerEnd="" opacity={draw} />
            <g opacity={draw}><Box x={780} y={840} s={1.1} c={RED} xr={xr} tag={price} /></g>
          </g>
        )}

        {/* 3: kutu yığını, para, ayakta */}
        {sales > 0 && (
          <g opacity={sales}>
            {Array.from({ length: 40 }, (_, i) => (
              <rect key={i} x={140 + (i % 10) * 82} y={1000 - Math.floor(i / 10) * 110} width={70} height={100} rx={6}
                fill={i % 2 ? BLUE : RED} opacity={gir(t, an(3, 2) + i * 0.02, 0.2) * (stack > 0 ? 1 : 0)} />
            ))}
            <text x={540} y={560} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={76} fill={L.ink} opacity={stack}>1.000+ kutu</text>
            <g opacity={money} transform="translate(540,1190)">
              <rect x={-300} y={-60} width={600} height={120} rx={20} fill={L.good} />
              <text y={20} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={58} fill="#FFFFFF">~30.000 dolar</text>
            </g>
            <text x={540} y={640} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted} opacity={stack}>CHESKY'YE GÖRE</text>
            {alive > 0 && <text x={540} y={1310} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={30} letterSpacing={3} fill={L.ink} opacity={alive}>ŞİRKET AYAKTA</text>}
          </g>
        )}

        {/* 5: röntgen — kutudan hikâye çıkar */}
        {open > 0 && (
          <g opacity={open}>
            <Box x={540} y={1000} s={1.0} c={RED} xr={xr} />
            {/* "hikâye": kutudan açık bir kitap yükselir */}
            <g opacity={gir(t, an(5, 3), 0.4) * (1 - lesson * 0.6)} transform={`translate(540,${karis(900, 720, gir(t, an(5, 3), 0.8))})`}>
              <path d="M0 -60 q-90 -30 -180 0 v140 q90 -30 180 0 z" fill={xr > 0.5 ? X.bg : '#FFFFFF'} stroke={xr > 0.5 ? X.cyan : L.ink} strokeWidth={5} />
              <path d="M0 -60 q90 -30 180 0 v140 q-90 -30 -180 0 z" fill={xr > 0.5 ? X.bg : '#FFFFFF'} stroke={xr > 0.5 ? X.cyan : L.ink} strokeWidth={5} />
              {[0, 1, 2].map((i) => <line key={i} x1={-150} x2={-30} y1={-20 + i * 30} y2={-28 + i * 30} stroke={xr > 0.5 ? X.cyan : L.muted} strokeWidth={4} />)}
              {[0, 1, 2].map((i) => <line key={i} x1={30} x2={150} y1={-28 + i * 30} y2={-20 + i * 30} stroke={xr > 0.5 ? X.cyan : L.muted} strokeWidth={4} />)}
            </g>
            {['GÜNDEM', 'SINIRLI', 'KOLEKSİYONLUK'].map((w, i) => (
              <g key={w} opacity={cards[i]} transform={`translate(${260 + i * 280},${karis(900, 640, cards[i])}) rotate(${-8 + i * 8})`}>
                <rect x={-130} y={-50} width={260} height={100} rx={16} fill={xr > 0.5 ? X.bg : '#FFFFFF'} stroke={xr > 0.5 ? X.cyan : L.ink} strokeWidth={5} />
                <text y={12} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700} fontSize={w.length > 8 ? 24 : 30} letterSpacing={2} fill={xr > 0.5 ? X.cyan : L.ink}>{w}</text>
              </g>
            ))}
          </g>
        )}

        {/* 6: mağazan — numaralı özel ambalaj, dürüst stok */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <g transform="translate(330,800)">
              <path d="M-160 -200 h300 l20 20 v380 h-320 z" fill="#2E5E8C" stroke={L.ink} strokeWidth={5} />
              <rect x={-120} y={-120} width={240} height={140} rx={12} fill="#FFFFFF" />
              <text y={-36} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={34} fill={L.ink}>Özel seri</text>
              {numbered > 0 && (
                <g opacity={numbered} transform="translate(0,120)">
                  <rect x={-110} y={-36} width={220} height={72} rx={12} fill={L.accent} />
                  <text y={12} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700} fontSize={30} fill="#FFFFFF">NUMARALI</text>
                </g>
              )}
            </g>
            {stock > 0 && (
              <g opacity={stock} transform="translate(560,760)">
                <text y={-30} fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted}>KALAN STOK</text>
                {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 36} y={0} width={28} height={60} rx={6} fill={i < 3 ? L.accent : L.line} />)}
                <text y={130} fontFamily="Outfit" fontWeight={800} fontSize={32} fill={L.ink}>Gerçek sayı, gerçek stok</text>
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>Mısır gevreği sattı.</span>
          <span style={{ display: 'block', color: L.accent }}>Hem de batmamak için.</span>
        </Headline>
        <Headline show={lesson}>
          <span>Gevrek almadı,</span>
          <span style={{ display: 'block', color: L.accent }}>hikâye aldı.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
