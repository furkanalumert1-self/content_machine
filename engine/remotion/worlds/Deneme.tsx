// Dünya: "Evde dene" (Warby Parker Home Try-On; SEC Form S-1 2021: beş çerçeve, beş gün, ücretsiz; 2010'da gözlüklerin %2,5'ten azı
// online satılıyordu; şirket ilk yıl satış hedefine 3 haftada ulaştı — şirket beyanı). Logo ve gerçek kişi yok: genel yüz silueti.
// 17.11/25.11 kuralı: 0. kare dolu ve hareketli, ürün görünür (açık kargo kutusunda beş çerçeve, yüzde çerçeve sırayla değişiyor).
// Akış: ekran başında "?" (online pay < %2,5) → kutu eve gider, açılır, beş gün → 3 hafta (şirket beyanı) → röntgen: "ya olmazsa?" silinir
// → mağazan: deneme seti + ilk değişim ücretsiz.
// Bölümler: 0 kanca, 1 ekran, 2 kutu, 3 sonuç, 4 röntgen, 5 korku + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const KARTON = '#C99B66';
const CERCEVE = ['#151515', '#B0413E', '#3B6FD8', '#C9893A', '#2E9E5B'];

/** Gözlük çerçevesi; k şekil (0 yuvarlak, 1 köşeli, 2 oval). */
function Glasses({ x, y, s, c, k, sw = 9 }: { x: number; y: number; s: number; c: string; k: number; sw?: number }) {
  const lens = (cx: number) =>
    k === 0 ? <circle cx={cx} cy={0} r={34} /> : k === 1 ? <rect x={cx - 38} y={-28} width={76} height={56} rx={8} /> : <ellipse cx={cx} cy={0} rx={40} ry={28} />;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={sw}>
      {lens(-46)}{lens(46)}
      <path d="M-10 -4 Q0 -14 10 -4" />
    </g>
  );
}

/** Genel yüz silueti (yan değil, önden). */
function Face({ x, y, s, c }: { x: number; y: number; s: number; c: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={120} ry={150} fill={c} />
      <path d="M-120 -30 Q-120 -170 0 -165 Q120 -170 120 -30 Q90 -110 0 -115 Q-90 -110 -120 -30 Z" fill="#3A2A20" />
      <path d="M-30 80 Q0 100 30 80" stroke="#7A5A48" strokeWidth={6} fill="none" strokeLinecap="round" />
    </g>
  );
}

export function Deneme({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, bas(6), 0.6));
  const bg = mix(L.bg, X.bg, xr);
  const ink = mix(L.ink, X.cyan, xr);
  const cyc = Math.floor(t * 1.6) % 5;

  // ---- kanca: kutu + yüzde sırayla çerçeve
  const hook = 1 - gir(t, bas(1), 0.4);
  // ---- 1: ekran başında soru
  const screen = gir(t, bas(1), 0.4) * (1 - gir(t, bas(2), 0.4));
  const tiny = gir(t, an(1, 2), 0.6);
  // ---- 2: kutu eve
  const ship = gir(t, bas(2), 0.4) * (1 - gir(t, bas(3), 0.4));
  const travel = gir(t, bas(2), Math.max(0.8, an(2, 6) - bas(2)));
  const open = gir(t, an(2, 6), 0.5);
  const days = gir(t, an(2, 7), Math.max(0.8, an(2, 11) - an(2, 7)));
  // ---- 3
  const res = gir(t, bas(3), 0.4) * (1 - gir(t, bas(4), 0.5));
  const res2 = gir(t, an(3, 8), 0.5);
  // ---- 5
  const why = gir(t, bas(4) + 0.3, 0.4) * (1 - gir(t, bas(6), 0.4));
  const strike = gir(t, an(5, 9), 0.4);
  const lesson = gir(t, an(5, 11), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6
  const shop = gir(t, bas(6), 0.8);
  const btn = gir(t, an(6, 7), 0.4);
  const badge = gir(t, an(6, 12), 0.4);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {hook > 0 && (
          <g opacity={hook}>
            <Face x={300} y={800} s={1.5} c="#E3B48F" />
            <Glasses x={300} y={770} s={1.6} c={CERCEVE[cyc]} k={cyc % 3} />
            <path d="M600 1000 L980 1000 L960 1240 L620 1240 Z" fill={KARTON} />
            <path d="M600 1000 L560 900 L760 900 L780 1000 Z M980 1000 L1010 900 L820 900 L800 1000 Z" fill="#A87C4C" />
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i} opacity={i === cyc ? 0.25 : 1}>
                <Glasses x={700 + (i % 3) * 110 + (i > 2 ? 55 : 0)} y={1080 + (i > 2 ? 90 : 0)} s={0.55} c={CERCEVE[i]} k={i % 3} sw={12} />
              </g>
            ))}
          </g>
        )}

        {screen > 0 && (
          <g opacity={screen}>
            <rect x={190} y={520} width={700} height={460} rx={24} fill={L.ink} />
            <rect x={220} y={550} width={640} height={400} rx={12} fill={L.paper} />
            <Glasses x={540} y={700} s={1.6} c={CERCEVE[0]} k={1} />
            <rect x={400} y={830} width={280} height={70} rx={35} fill={L.accent} />
            <text x={540} y={876} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={34} fill="#FFFFFF">Satın al</text>
            <rect x={140} y={980} width={800} height={24} rx={8} fill="#B9B3A8" />
            <text x={960} y={760} textAnchor="end" fontFamily="Outfit" fontWeight={800} fontSize={150} fill={L.accent} opacity={0.9}>?</text>
            <g opacity={tiny} transform="translate(140,1110)">
              <text y={0} fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted}>2010 · İNTERNETTEN SATILAN GÖZLÜK</text>
              <rect y={30} width={800} height={50} rx={12} fill={L.line} />
              <rect y={30} width={800 * 0.025 * tiny} height={50} rx={12} fill={L.accent} />
              <text x={50} y={68} fontFamily="Outfit" fontWeight={800} fontSize={34} fill={L.ink}>%2,5'ten az</text>
            </g>
          </g>
        )}

        {ship > 0 && (
          <g opacity={ship}>
            {/* ev */}
            <path d="M700 820 L860 680 L1020 820 L1020 1120 L700 1120 Z" fill={L.paper} stroke={L.ink} strokeWidth={6} />
            <rect x={830} y={980} width={70} height={140} fill={L.ink} />
            <rect x={60} y={1120} width={960} height={14} fill="#B9B3A8" />
            <g transform={`translate(${karis(120, 440, travel)},${1120 - open * 0})`}>
              <rect x={-150} y={-180} width={300} height={180} rx={10} fill={KARTON} />
              <path d={`M-150 -180 L${-150 - 60 * open} ${-180 - 90 * open} L${0} ${-180 - 20 * open} Z`} fill="#A87C4C" />
              <path d={`M150 -180 L${150 + 60 * open} ${-180 - 90 * open} L${0} ${-180 - 20 * open} Z`} fill="#A87C4C" />
              {open > 0 && [0, 1, 2, 3, 4].map((i) => (
                <g key={i} opacity={open}><Glasses x={-110 + i * 55} y={-230 - (i % 2) * 40} s={0.45} c={CERCEVE[i]} k={i % 3} sw={12} /></g>
              ))}
            </g>
            {/* beş gün: beş nokta */}
            <g transform="translate(300,560)" opacity={gir(t, an(2, 7), 0.3)}>
              {[0, 1, 2, 3, 4].map((i) => (
                <circle key={i} cx={i * 110} cy={0} r={34} fill={days * 5 > i ? L.good : L.line} />
              ))}
              <text x={220} y={90} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={28} letterSpacing={3} fill={L.muted}>BEŞ GÜN · ÜCRETSİZ</text>
            </g>
          </g>
        )}

        {res > 0 && (
          <g opacity={res}>
            <g transform="translate(140,560)">
              {Array.from({ length: 52 }, (_, i) => (
                <rect key={i} x={(i % 13) * 62} y={Math.floor(i / 13) * 62} width={50} height={50} rx={8}
                  fill={i < 3 ? L.accent : L.line} opacity={i < 3 ? res2 + 0.2 : 1} />
              ))}
              <text x={0} y={330} fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill={L.muted}>BİR YIL = 52 HAFTA</text>
            </g>
            <g opacity={res2} transform="translate(540,1080)">
              <rect x={-400} y={-110} width={800} height={220} rx={28} fill={L.ink} />
              <text y={0} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={72} fill="#FFFFFF">3 haftada</text>
              <text y={60} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill="#FFFFFF" opacity={0.75}>İLK YIL HEDEFİ · ŞİRKET BEYANI</text>
            </g>
          </g>
        )}

        {why > 0 && (
          <g opacity={why}>
            <g transform="translate(340,940)">
              <ellipse rx={150} ry={190} fill="none" stroke={xr > 0.5 ? X.cyan : L.ink} strokeWidth={6} />
              <Glasses x={0} y={-30} s={1.6} c={xr > 0.5 ? X.cyan : L.ink} k={0} />
            </g>
            <g transform="translate(720,640)">
              <rect x={-230} y={-70} width={460} height={140} rx={70} fill="none" stroke={xr > 0.5 ? X.cyan : L.ink} strokeWidth={6} />
              <path d="M-120 70 L-150 120 L-80 70" fill="none" stroke={xr > 0.5 ? X.cyan : L.ink} strokeWidth={6} />
              <text y={18} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={48} fill={ink}>Ya olmazsa?</text>
              <line x1={-250} x2={karis(-250, 250, strike)} y1={0} y2={0} stroke={L.accent} strokeWidth={12} />
            </g>
          </g>
        )}

        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={840} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <text x={140} y={520} fontFamily="Outfit" fontWeight={800} fontSize={38} fill={L.ink}>Ürün sayfası</text>
            <rect x={140} y={560} width={420} height={420} rx={24} fill={L.line} />
            {[0, 1, 2].map((i) => <circle key={i} cx={240 + i * 110} cy={770} r={40} fill={['#B0413E', '#3B6FD8', '#2E9E5B'][i]} />)}
            <text x={600} y={640} fontFamily="Outfit" fontWeight={800} fontSize={36} fill={L.ink}>Renk: ?</text>
            <text x={600} y={700} fontFamily="Outfit" fontWeight={800} fontSize={36} fill={L.ink}>Beden: ?</text>
            <g opacity={btn} transform="translate(540,1080)">
              <rect x={-400} y={-60} width={800} height={120} rx={60} fill={L.ink} />
              <text y={16} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={44} fill="#FFFFFF">Deneme setini iste</text>
            </g>
            <g opacity={badge} transform="translate(780,860) rotate(-6)">
              <rect x={-170} y={-50} width={340} height={100} rx={20} fill={L.good} />
              <text y={-6} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={30} fill="#FFFFFF">İlk değişim</text>
              <text y={32} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={30} fill="#FFFFFF">ücretsiz</text>
            </g>
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>Beş gözlük, beş gün.</span>
          <span style={{ display: 'block', color: L.accent }}>Ücretsiz, evinde.</span>
        </Headline>
        <Headline show={lesson}>
          <span style={{ color: xr > 0.5 ? X.cyan : L.ink }}>Korkuyu satıştan</span>
          <span style={{ display: 'block', color: L.accent }}>önce sildi.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
