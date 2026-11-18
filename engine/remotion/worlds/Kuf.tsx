// Dünya: "Küflü Whopper" (Burger King, 2020; ödül başvurusu rakamları). Tek dünya: stüdyo, kamera ve ışık altında bir hamburger.
// 17.11 kuralı: 0. kare dolu ve hareketli (stüdyo, kayıt ışığı, hızlı akan gün sayacı, küf başlamış). Kanca: "… Hem de reklam için."
// Akış: kayıt başlar (2020) → 34 gün, küf büyür → film şeridi baştan sona → 8,4 milyar gösterim, %14 (ödül başvurusuna göre)
// → röntgen: "yapay koruyucu" yazısı çizilir, göz → mağazan: katkısız iddiası + test raporu + üretim videosu.
// Bölümler: 0 kanca, 1 kayıt, 2 34 gün + şerit, 3 rakamlar, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const MOLD = ['#7C9A5A', '#A9B98A', '#5E7A86', '#C8CDB8'];
const SPOTS = Array.from({ length: 26 }, (_, i) => ({ x: ((i * 97) % 300) - 150, y: ((i * 53) % 150) - 90, r: 10 + (i % 5) * 7, c: MOLD[i % 4], at: (i % 13) / 13 }));

/** Hamburger; mold 0–1 küf, xr röntgen. */
function Burger({ x, y, s, mold, xr }: { x: number; y: number; s: number; mold: number; xr: number }) {
  const ink = xr > 0.5 ? X.cyan : L.ink;
  const f = (c: string) => (xr > 0.5 ? 'none' : mix(c, '#6E6A55', mold * 0.55));
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={150} rx={240} ry={26} fill="#000" opacity={0.12 * (1 - xr)} />
      <path d="M-200 -10 q200 -230 400 0 z" fill={f('#E1A54B')} stroke={ink} strokeWidth={6} />
      {[-120, -60, 0, 60, 120].map((sx, i) => <ellipse key={i} cx={sx} cy={-70 - (i % 2) * 20} rx={8} ry={4} fill={xr > 0.5 ? 'none' : '#FFF3D6'} stroke={xr > 0.5 ? X.cyan : 'none'} opacity={1 - mold} />)}
      <path d="M-210 -6 q30 30 60 0 q30 30 60 0 q30 30 60 0 q30 30 60 0 q30 30 60 0 q30 30 60 0 q15 15 30 0 v14 h-420 z" fill={f('#3FA34D')} stroke={ink} strokeWidth={3} />
      <rect x={-205} y={14} width={410} height={22} rx={8} fill={f('#D9442B')} stroke={ink} strokeWidth={3} />
      <rect x={-210} y={36} width={420} height={48} rx={20} fill={f('#6B3B22')} stroke={ink} strokeWidth={4} />
      <path d="M-200 84 h400 q0 60 -60 60 h-280 q-60 0 -60 -60 z" fill={f('#E1A54B')} stroke={ink} strokeWidth={6} />
      {SPOTS.map((p, i) => {
        const g = Math.max(0, Math.min(1, (mold - p.at * 0.7) / 0.3));
        return g > 0 ? <circle key={i} cx={p.x} cy={p.y} r={p.r * g} fill={xr > 0.5 ? 'none' : p.c} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} opacity={0.9} /> : null;
      })}
    </g>
  );
}

function Camera({ x, y, rec, xr }: { x: number; y: number; rec: number; xr: number }) {
  const ink = xr > 0.5 ? X.cyan : L.ink;
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M0 40 L-60 230 M0 40 L60 230 M0 40 L0 230" stroke={ink} strokeWidth={8} />
      <rect x={-90} y={-60} width={180} height={110} rx={14} fill={xr > 0.5 ? 'none' : '#2A2F36'} stroke={ink} strokeWidth={5} />
      <rect x={90} y={-40} width={50} height={70} rx={8} fill={xr > 0.5 ? 'none' : '#4B5560'} stroke={ink} strokeWidth={5} />
      <circle cx={-60} cy={-36} r={10} fill="#E8402A" opacity={rec} />
    </g>
  );
}

export function Kuf({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 9), 0.6));
  const bg = mix('#2B2622', X.bg, xr);

  // ---- küf: kancada hızlı ileri sarım (0 → 0,35), geçmişe dönüşte taze; 2. bölümde 34 güne
  const hookMold = Math.min(0.35, t / 3.2 * 0.35);
  const grow = gir(t, an(2, 1), Math.max(1.5, an(2, 5) - an(2, 1)));
  const mold = t < bas(1) ? hookMold : t < bas(2) ? 0 : grow;
  const day = t < bas(1) ? Math.max(1, Math.round(hookMold / 0.35 * 12)) : t < bas(2) ? 1 : Math.max(1, Math.round(grow * 34));
  const rec = Math.sin(t * 6) > 0 ? 1 : 0.2;

  const strip = gir(t, an(2, 6), 0.5) * (1 - gir(t, bas(3), 0.5));
  const nums = gir(t, an(3, 4), 0.4) * (1 - gir(t, bas(4), 0.5));
  const pct = gir(t, an(3, 8), 0.4);
  const label = gir(t, an(5, 2), 0.4) * (1 - gir(t, an(5, 9), 0.4));
  const strike = gir(t, an(5, 6), 0.4);
  const eye = gir(t, an(5, 8), 0.4);
  const lesson = gir(t, an(5, 9), 0.5) * (1 - gir(t, bas(6), 0.4));
  const shop = gir(t, bas(6), 0.8);
  const report = gir(t, an(6, 6), 0.5);
  const video = gir(t, an(6, 10), 0.5);

  const studio = (1 - shop) * (1 - strip) * (1 - nums * 0.7);

  return (
    <AbsoluteFill style={{ background: shop > 0.99 ? L.bg : bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* stüdyo: ışık konisi, masa, hamburger, kamera, gün sayacı */}
        {studio > 0 && (
          <g opacity={studio}>
            <path d="M540 380 L240 1180 H840 z" fill="#FFF3D6" opacity={0.12 * (1 - xr)} />
            <rect x={180} y={1100} width={720} height={40} rx={10} fill={xr > 0.5 ? 'none' : '#5A4A3C'} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={3} />
            <Burger x={540} y={950} s={1.05} mold={mold} xr={xr} />
            <Camera x={200} y={620} rec={t < bas(4) ? rec : 0} xr={xr} />
            <g transform="translate(870,560)">
              <rect x={-110} y={-60} width={220} height={120} rx={16} fill={xr > 0.5 ? 'none' : '#151515'} stroke={xr > 0.5 ? X.cyan : '#5A5A5A'} strokeWidth={4} />
              <text y={-14} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={24} letterSpacing={3} fill={xr > 0.5 ? X.cyan : '#9AA0A6'}>GÜN</text>
              <text y={40} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={58} fill={xr > 0.5 ? X.cyan : '#FFFFFF'}>{day}</text>
            </g>
            {/* 5: "yapay koruyucu" etiketi çizilir, göz */}
            {label > 0 && (
              <g opacity={label} transform="translate(540,640)">
                <rect x={-260} y={-50} width={520} height={100} rx={16} fill={X.bg} stroke={X.cyan} strokeWidth={5} />
                <text y={16} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={46} fill={X.cyan}>YAPAY KORUYUCU</text>
                <line x1={-280} y1={0} x2={karis(-280, 280, strike)} y2={0} stroke={L.accent} strokeWidth={12} strokeLinecap="round" />
              </g>
            )}
            {eye > 0 && (
              <g opacity={eye * (1 - lesson)} transform="translate(870,820)">
                <path d="M-90 0 q90 -80 180 0 q-90 80 -180 0 z" fill="none" stroke={X.cyan} strokeWidth={6} />
                <circle r={26} fill={X.cyan} />
              </g>
            )}
          </g>
        )}

        {/* 2: film şeridi — baştan sona */}
        {strip > 0 && (
          <g opacity={strip}>
            <rect x={60} y={720} width={960} height={300} fill="#151515" />
            {Array.from({ length: 12 }, (_, i) => <rect key={i} x={80 + i * 80} y={734} width={40} height={18} rx={4} fill="#3A3A3A" />)}
            {Array.from({ length: 12 }, (_, i) => <rect key={i} x={80 + i * 80} y={988} width={40} height={18} rx={4} fill="#3A3A3A" />)}
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i} opacity={gir(t, an(2, 6) + i * 0.15, 0.3)}>
                <rect x={80 + i * 186} y={768} width={170} height={204} rx={6} fill="#2B2622" />
                <Burger x={165 + i * 186} y={880} s={0.3} mold={i / 4} xr={0} />
                {(i === 0 || i === 4) && <text x={165 + i * 186} y={960} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={20} fill="#9AA0A6">{i ? '34' : '1'}. GÜN</text>}
              </g>
            ))}
          </g>
        )}

        {/* 3: rakamlar (ödül başvurusuna göre) */}
        {nums > 0 && (
          <g opacity={nums}>
            <g transform="translate(120,560)">
              <rect width={840} height={180} rx={28} fill="#FFFFFF" />
              <text x={40} y={100} fontFamily="Outfit" fontWeight={800} fontSize={84} fill={L.ink}>8,4 milyar</text>
              <text x={40} y={150} fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill={L.muted}>GÖSTERİM · ÖDÜL BAŞVURUSUNA GÖRE</text>
            </g>
            <g transform="translate(120,780)" opacity={pct}>
              <rect width={840} height={180} rx={28} fill={L.accent} />
              <text x={40} y={100} fontFamily="Outfit" fontWeight={800} fontSize={84} fill="#FFFFFF">%14</text>
              <text x={40} y={150} fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill="#FFFFFF" opacity={0.85}>SATIŞ ARTIŞI · ÖDÜL BAŞVURUSUNA GÖRE</text>
            </g>
          </g>
        )}

        {/* 6: mağazan — iddia + kanıt */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect width={1080} height={1920} fill={L.bg} />
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <g transform="translate(290,700)">
              <path d="M-110 -150 h220 v280 q0 30 -30 30 h-160 q-30 0 -30 -30 z" fill="#F6E7C8" stroke={L.ink} strokeWidth={6} />
              <rect x={-120} y={-200} width={240} height={56} rx={12} fill={L.good} stroke={L.ink} strokeWidth={6} />
              <rect x={-80} y={-40} width={160} height={70} rx={10} fill="#FFFFFF" stroke={L.ink} strokeWidth={4} />
              <text y={6} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={28} fill={L.good}>katkısız</text>
            </g>
            {report > 0 && (
              <g opacity={report} transform="translate(700,620) rotate(3)">
                <rect x={-170} y={-130} width={340} height={260} rx={14} fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
                <text y={-74} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.ink}>TEST RAPORU</text>
                {[0, 1, 2].map((i) => <rect key={i} x={-130} y={-40 + i * 40} width={[260, 220, 240][i]} height={18} rx={9} fill={L.line} />)}
                <path d="M80 90 l20 20 l40 -46" stroke={L.good} strokeWidth={10} fill="none" strokeLinecap="round" />
              </g>
            )}
            {video > 0 && (
              <g opacity={video} transform="translate(700,980)">
                <rect x={-170} y={-100} width={340} height={200} rx={20} fill="#151515" />
                <path d="M-24 -40 l64 40 l-64 40 z" fill="#FFFFFF" />
                <text y={140} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill={L.muted}>ÜRETİM VİDEOSU</text>
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={1 - gir(t, bas(1), 0.4)}>
          <span style={{ color: '#FFFFFF' }}>Burgerini küflendirdi.</span>
          <span style={{ display: 'block', color: L.accent }}>Hem de reklam için.</span>
        </Headline>
        <Headline show={lesson}>
          <span style={{ color: '#FFFFFF' }}>Yazmadı,</span>
          <span style={{ display: 'block', color: L.accent }}>gösterdi.</span>
        </Headline>
      </WorldQc>
      <div style={{ position: 'absolute', left: 90, top: 300, fontFamily: 'JetBrains Mono, monospace', fontSize: 34, letterSpacing: 4, color: '#FFFFFF', opacity: gir(t, bas(1), 0.4) * (1 - gir(t, bas(2), 0.4)) }}>
        2020
      </div>
    </AbsoluteFill>
  );
}
