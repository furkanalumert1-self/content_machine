// Dünya: "Şeffaf kutu" (Eker sütlü tatlılar; Capital 2012 röportajı: 2007 karton ambalaj, 2010 şeffaf kap + kapakta kaşık,
// şirket beyanına göre satış %100 arttı). Logo yok: genel karton kutu ve genel şeffaf tatlı kabı.
// 17.11/25.11 kuralı: 0. kare dolu ve hareketli, ürün görünür (rafta kapalı karton kutu ile içi görünen şeffaf kap yan yana).
// Akış: raf (karton kutular, müşteri geçip gidiyor) → kutular şeffaf kaba döner, kaşık kapağa iner → 1× / 2× (şirket açıklaması)
// → röntgen: "gördü" + "hemen yenir" → mağazan: kutu açılınca gerçek fotoğraf + yakın çekim.
// Bölümler: 0 kanca, 1 karton raf, 2 şeffaf kap, 3 sonuç, 4 röntgen, 5 neden + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { Figure, gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const KARTON = '#B98A55';
const KREM = '#F3E3C3';
const KARAMEL = '#C9893A';

/** Kapalı karton kutu; ön yüzde soru işareti. */
function Box({ x, y, s, o = 1, xr }: { x: number; y: number; s: number; o?: number; xr: number }) {
  if (o <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <rect x={-80} y={-150} width={160} height={150} rx={10} fill={xr > 0.5 ? 'none' : KARTON} stroke={xr > 0.5 ? X.cyan : '#00000040'} strokeWidth={4} />
      <rect x={-80} y={-150} width={160} height={26} fill={xr > 0.5 ? 'none' : '#A47645'} />
      <text y={-44} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={76} fill={xr > 0.5 ? X.cyan : '#FFFFFF'} opacity={0.85}>?</text>
    </g>
  );
}

/** Şeffaf tatlı kabı: içi görünür (krem + karamel), kapağın üstünde kaşık; spoon 0–1 kaşığın inişi. */
function Cup({ x, y, s, o = 1, spoon = 1, xr }: { x: number; y: number; s: number; o?: number; spoon?: number; xr: number }) {
  if (o <= 0) return null;
  const line = xr > 0.5 ? X.cyan : '#8FA9B8';
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <path d="M-78 -150 L78 -150 L64 0 L-64 0 Z" fill={xr > 0.5 ? 'none' : '#FFFFFF'} fillOpacity={0.35} stroke={line} strokeWidth={4} />
      {xr <= 0.5 && <path d="M-72 -96 L72 -96 L64 0 L-64 0 Z" fill={KREM} />}
      {xr <= 0.5 && <path d="M-74 -118 L74 -118 L72 -96 L-72 -96 Z" fill={KARAMEL} />}
      {xr > 0.5 && <path d="M-74 -118 L74 -118 M-72 -96 L72 -96" stroke={X.cyan} strokeWidth={3} strokeDasharray="10 8" />}
      <path d="M-40 -130 L-48 -20" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.6} />
      <rect x={-86} y={-162} width={172} height={14} rx={7} fill={xr > 0.5 ? 'none' : '#E7EEF2'} stroke={line} strokeWidth={3} />
      {spoon > 0 && (
        <g transform={`translate(0,${karis(-120, 0, spoon)}) rotate(-8)`} opacity={spoon}>
          <ellipse cx={-50} cy={-176} rx={22} ry={12} fill={xr > 0.5 ? 'none' : '#F7F7F7'} stroke={xr > 0.5 ? X.cyan : '#9AA5AD'} strokeWidth={3} />
          <rect x={-30} y={-180} width={100} height={8} rx={4} fill={xr > 0.5 ? 'none' : '#F7F7F7'} stroke={xr > 0.5 ? X.cyan : '#9AA5AD'} strokeWidth={3} />
        </g>
      )}
    </g>
  );
}

export function Seffaf({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, bas(6), 0.6));
  const bg = mix(L.bg, X.bg, xr);
  const ink = mix(L.ink, X.cyan, xr);

  // ---- kanca: aynı rafta kutu ve şeffaf kap; bakış oku kaba gider, kaşık sallanır
  const hook = 1 - gir(t, bas(1), 0.4);
  const gaze = (t * 0.6) % 1;
  // ---- 1–2: raf; karton → şeffaf
  const shelf = gir(t, bas(1), 0.4) * (1 - gir(t, bas(3), 0.4));
  const walk = gir(t, bas(1), Math.max(2, an(1, 9) - bas(1)));
  const swap = (i: number) => gir(t, an(2, 2) + i * 0.25, 0.4);
  const spoonDrop = gir(t, an(2, 7), 0.5);
  // ---- 3: 1× → 2×
  const res = gir(t, bas(3), 0.4) * (1 - gir(t, bas(4), 0.5));
  const grow = gir(t, an(3, 7), 0.9);
  // ---- 5: neden
  const why = gir(t, bas(4) + 0.3, 0.4) * (1 - gir(t, bas(6), 0.4));
  const eye = gir(t, an(5, 1), 0.4);
  const tag2 = gir(t, an(5, 5), 0.4);
  const lesson = gir(t, an(5, 10), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6: mağazan
  const shop = gir(t, bas(6), 0.8);
  const photo = gir(t, an(6, 3), 0.5);
  const zoom = gir(t, an(6, 11), 0.5);

  const bob = Math.sin(t * 5) * 8;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* kanca: kutu ve kap yan yana */}
        {hook > 0 && (
          <g opacity={hook}>
            <rect x={110} y={1160} width={860} height={26} rx={6} fill="#C9C2B4" />
            <Box x={330} y={1160} s={2.1} xr={0} />
            <g transform={`translate(0,${bob})`}><Cup x={750} y={1160} s={2.1} xr={0} /></g>
            {/* bakış: soldan sağa akan noktalar kutuyu geçip kaba varır */}
            {[0, 1, 2, 3, 4].map((i) => {
              const u = (gaze + i * 0.2) % 1;
              return <circle key={i} cx={karis(200, 760, u)} cy={karis(560, 640, u) - Math.sin(u * Math.PI) * 60} r={10} fill={L.accent} opacity={Math.sin(u * Math.PI)} />;
            })}
          </g>
        )}

        {/* 1–2: raf; müşteri geçer, kutular şeffaf kaba döner */}
        {shelf > 0 && (
          <g opacity={shelf}>
            {[0, 1].map((r) => <rect key={r} x={100} y={760 + r * 340} width={880} height={22} rx={6} fill="#C9C2B4" />)}
            {Array.from({ length: 8 }, (_, i) => {
              const x = 200 + (i % 4) * 225; const y = 760 + Math.floor(i / 4) * 340;
              const u = swap(i);
              return (
                <g key={i}>
                  <Box x={x} y={y} s={1.15} o={1 - u} xr={0} />
                  <Cup x={x} y={y} s={1.15} o={u} spoon={spoonDrop} xr={0} />
                </g>
              );
            })}
            {t < bas(2) && <Figure x={karis(120, 1000, walk)} y={1290} s={1.1} c={L.ink} walk={t * 1.6} face={-1} />}
            {t < bas(2) && walk > 0.2 && walk < 0.8 && (
              <text x={karis(120, 1000, walk) + 50} y={1080} fontFamily="Outfit" fontWeight={800} fontSize={60} fill={L.accent}>?</text>
            )}
            <text x={110} y={520} fontFamily="JetBrains Mono" fontSize={32} letterSpacing={3} fill={L.muted}>{t < an(2, 0) ? '2007 · KARTON' : '2010 · ŞEFFAF'}</text>
          </g>
        )}

        {/* 3: sonuç (şirket açıklaması) */}
        {res > 0 && (
          <g opacity={res}>
            {[0, 1].map((i) => {
              const h = i === 0 ? 260 : karis(260, 520, grow);
              return (
                <g key={i} transform={`translate(${330 + i * 420},1180)`}>
                  <rect x={-110} y={-h} width={220} height={h} rx={18} fill={i === 0 ? KARTON : KARAMEL} />
                  <text y={-h - 30} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={56} fill={L.ink}>{i === 0 ? '1×' : grow > 0.95 ? '2×' : ''}</text>
                  <text y={50} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted}>{i === 0 ? 'KARTON' : 'ŞEFFAF'}</text>
                </g>
              );
            })}
            <text x={540} y={1290} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill={L.muted}>ŞİRKET AÇIKLAMASINA GÖRE · 2012</text>
          </g>
        )}

        {/* 5: röntgen — gördü + hemen yenir */}
        {why > 0 && (
          <g opacity={why}>
            <Cup x={540} y={1060} s={2.3} spoon={1} xr={xr} />
            <g opacity={eye} transform="translate(250,600)">
              <path d="M-90 0 Q0 -70 90 0 Q0 70 -90 0 Z" fill="none" stroke={xr > 0.5 ? X.cyan : L.ink} strokeWidth={6} />
              <circle r={26} fill={L.accent} />
              <text y={110} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700} fontSize={30} letterSpacing={3} fill={ink}>GÖRDÜ</text>
            </g>
            <g opacity={tag2} transform="translate(830,600)">
              <rect x={-150} y={-46} width={300} height={92} rx={18} fill="none" stroke={xr > 0.5 ? X.cyan : L.ink} strokeWidth={5} />
              <text y={12} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700} fontSize={28} letterSpacing={2} fill={ink}>HEMEN YENİR</text>
            </g>
          </g>
        )}

        {/* 6: mağazan — kutu açılınca gerçek fotoğraf + yakın çekim */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={840} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <text x={140} y={520} fontFamily="Outfit" fontWeight={800} fontSize={38} fill={L.ink}>Ürün sayfası</text>
            <rect x={140} y={560} width={560} height={560} rx={24} fill={photo > 0.5 ? '#E9E2D4' : L.line} />
            <g opacity={photo}>
              <path d="M220 1060 L620 1060 L660 820 L180 820 Z" fill={KARTON} />
              <path d="M180 820 L260 720 L330 820 Z M660 820 L580 720 L510 820 Z" fill="#A47645" />
              <Cup x={420} y={1000} s={1.1} xr={0} />
              <text x={160} y={600} fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill={L.ink}>GERÇEK FOTOĞRAF</text>
            </g>
            <g opacity={zoom} transform="translate(820,800)">
              <circle r={130} fill={KREM} stroke={L.ink} strokeWidth={6} />
              <path d="M-130 -30 Q0 -60 130 -30 L130 -60 Q0 -90 -130 -60 Z" fill={KARAMEL} />
              {[[-50, 30], [20, 60], [60, 10], [-10, -10]].map(([a, c], i) => <circle key={i} cx={a} cy={c} r={8} fill="#E5D0A8" />)}
              <line x1={92} y1={92} x2={150} y2={150} stroke={L.ink} strokeWidth={14} strokeLinecap="round" />
              <text y={190} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill={L.ink}>YAKIN ÇEKİM</text>
            </g>
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>Aynı tatlı, iki kutu.</span>
          <span style={{ display: 'block', color: L.accent }}>Hangisini alırsın?</span>
        </Headline>
        <Headline show={lesson}>
          <span style={{ color: xr > 0.5 ? X.cyan : L.ink }}>Görmek,</span>
          <span style={{ display: 'block', color: L.accent }}>tereddüdü bitirdi.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
