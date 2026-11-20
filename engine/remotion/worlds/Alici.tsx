// Dünya: "Satın alan kim?" (Old Spice 'Smell Like a Man, Man', 2010; Wieden+Kennedy vaka sayfası, ajans beyanı).
// Logo ve gerçek kişi yok: genel duş jeli şişeleri ve çizgi figürler. 17.11 kuralı: 0. kare dolu ve hareketli
// (market reyonu, sepete uzanan el). Akış: 10 alıcıdan 6'sı (%60, ajansa göre) → TV: "Kocanız böyle kokabilirdi."
// → 186 kişiye özel video ızgarası → röntgen: hedef %15 ↔ 2 kat → mağazan: sipariş notu "kendine mi, hediye mi?", alıcıya yazılan reklam.
// Bölümler: 0 kanca, 1 %60, 2 TV, 3 186 video, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { Figure, gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const BLUE = '#2E5E8C';

function Bottle({ x, y, s, xr, c = BLUE }: { x: number; y: number; s: number; xr: number; c?: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-34} y={-120} width={68} height={170} rx={20} fill={xr > 0.5 ? 'none' : c} stroke={xr > 0.5 ? X.cyan : '#00000040'} strokeWidth={3} />
      <rect x={-16} y={-150} width={32} height={34} rx={6} fill={xr > 0.5 ? 'none' : '#E6E2D9'} stroke={xr > 0.5 ? X.cyan : '#00000040'} strokeWidth={3} />
      <rect x={-24} y={-70} width={48} height={50} rx={8} fill={xr > 0.5 ? 'none' : '#FFFFFF'} opacity={0.85} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />
    </g>
  );
}

/** Basit alıcı figürü: kadınlar etekli üçgen gövde (vurgu rengi), erkekler düz gövde (gri). */
function Shopper({ x, y, w, o, xr }: { x: number; y: number; w: boolean; o: number; xr: number }) {
  const c = xr > 0.5 ? X.cyan : w ? L.accent : '#9AA0A6';
  return (
    <g transform={`translate(${x},${y})`} opacity={o}>
      <circle cy={-70} r={22} fill={c} />
      {w ? <path d="M0 -46 L-36 40 H36 z" fill={c} /> : <rect x={-24} y={-46} width={48} height={86} rx={20} fill={c} />}
      <rect x={-20} y={40} width={12} height={34} fill={c} /><rect x={8} y={40} width={12} height={34} fill={c} />
    </g>
  );
}

export function Alici({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 11), 0.6));
  const bg = mix(L.bg, X.bg, xr);

  // ---- kanca: reyon, el şişeyi sepete koyar (döngü)
  const hook = 1 - gir(t, bas(1), 0.4);
  const grab = (t % 1.8) / 1.8;
  // ---- 1: 10 alıcı, 6'sı kadın
  const crowd = gir(t, bas(1), 0.4) * (1 - gir(t, bas(2), 0.4));
  const pct = gir(t, an(1, 5), 0.5);
  // ---- 2: TV
  const tv = gir(t, bas(2), 0.5) * (1 - gir(t, bas(3), 0.4));
  const bubble = gir(t, an(2, 5), 0.4);
  // ---- 3: 186 video
  const grid = gir(t, bas(3), 0.4) * (1 - gir(t, bas(4), 0.5));
  const fill = gir(t, an(3, 6), Math.max(1.2, an(3, 13) - an(3, 6)));
  // ---- 5: hedef ↔ sonuç
  const bars = gir(t, bas(4) + 0.2, 0.5) * (1 - gir(t, an(5, 11), 0.5));
  const target = gir(t, an(5, 2), 0.6);
  const result = gir(t, an(5, 7), 0.9);
  const lesson = gir(t, an(5, 11), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6
  const shop = gir(t, bas(6), 0.8);
  const note = gir(t, an(6, 4), 0.5);
  const ad = gir(t, an(6, 8), 0.5);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* kanca: duş jeli reyonu, sepete uzanan el */}
        {hook > 0 && (
          <g opacity={hook}>
            <rect x={90} y={460} width={900} height={600} rx={20} fill="#F7F6F3" stroke={L.line} strokeWidth={4} />
            {[0, 1, 2].map((r) => (
              <g key={r}>
                <rect x={90} y={640 + r * 190} width={900} height={14} fill="#B9B3A8" />
                {Array.from({ length: 8 }, (_, i) => <Bottle key={i} x={150 + i * 110} y={630 + r * 190} s={0.75} xr={xr} c={[BLUE, '#1D3F60', '#5FA8C8', BLUE][(i + r) % 4]} />)}
              </g>
            ))}
            {/* sepet */}
            <g transform="translate(760,1200)">
              <path d="M-140 -60 h280 l-30 130 h-220 z" fill="#FFFFFF" stroke={L.ink} strokeWidth={6} />
              <path d="M-100 -60 q100 -90 200 0" fill="none" stroke={L.ink} strokeWidth={8} />
            </g>
            {/* el + şişe */}
            <g transform={`translate(${karis(480, 760, Math.min(1, grab * 1.6))},${karis(830, 1150, Math.min(1, grab * 1.6))})`} opacity={grab < 0.9 ? 1 : (1 - grab) * 10}>
              <Bottle x={0} y={0} s={0.8} xr={xr} />
              <path d="M-40 10 q-60 30 -140 40" stroke={L.accent} strokeWidth={34} strokeLinecap="round" fill="none" />
              <circle cx={-30} cy={0} r={24} fill="#E9B99A" />
            </g>
          </g>
        )}

        {/* 1: 10 alıcıdan 6'sı */}
        {crowd > 0 && (
          <g opacity={crowd}>
            {Array.from({ length: 10 }, (_, i) => (
              <Shopper key={i} x={150 + (i % 5) * 195} y={700 + Math.floor(i / 5) * 260} w={i < 6} o={i < 6 ? 0.35 + 0.65 * pct : 0.5} xr={xr} />
            ))}
            <g opacity={pct} transform="translate(540,1250)">
              <text textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={96} fill={L.accent}>%60</text>
              <text y={50} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={3} fill={L.muted}>SATIN ALAN KADIN · AJANSA GÖRE</text>
            </g>
          </g>
        )}

        {/* 2: TV reklamı */}
        {tv > 0 && (
          <g opacity={tv}>
            <rect x={140} y={500} width={800} height={500} rx={30} fill="#151515" />
            <rect x={170} y={530} width={740} height={440} rx={14} fill="#5FA8C8" />
            <Figure x={540} y={930} s={1.6} c="#1D3F60" face={1} />
            <Bottle x={700} y={900} s={0.9} xr={0} />
            <rect x={500} y={1000} width={80} height={60} fill="#151515" />
            <Shopper x={280} y={1230} w o={1} xr={xr} />
            {bubble > 0 && (
              <g opacity={bubble} transform="translate(560,1180)">
                <rect x={-200} y={-60} width={480} height={120} rx={24} fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
                <text x={40} y={-6} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={34} fill={L.ink}>Kocanız böyle</text>
                <text x={40} y={36} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={34} fill={L.accent}>kokabilirdi.</text>
              </g>
            )}
          </g>
        )}

        {/* 3: 186 kişiye özel video */}
        {grid > 0 && (
          <g opacity={grid}>
            {Array.from({ length: 186 }, (_, i) => {
              const on = i < Math.round(fill * 186);
              return <rect key={i} x={120 + (i % 14) * 60} y={480 + Math.floor(i / 14) * 52} width={50} height={40} rx={6} fill={on ? '#5FA8C8' : L.line} />;
            })}
            <text x={540} y={1250} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={72} fill={L.ink} opacity={fill}>186 özel video</text>
          </g>
        )}

        {/* 5: hedef %15 ↔ sonuç 2 kat (ajansa göre) */}
        {bars > 0 && (
          <g opacity={bars} transform="translate(540,1180)">
            {[{ x: -260, h: 280, l: 'ÖNCE', o: 1, c: X.cyan }, { x: 0, h: 280 * 1.15 * target, l: 'HEDEF %15', o: target, c: X.cyan }, { x: 260, h: 560 * result, l: '2 KAT', o: result, c: L.accent }].map((b) => (
              <g key={b.l} opacity={b.o}>
                <rect x={b.x - 90} y={-b.h} width={180} height={b.h} rx={12} fill="none" stroke={b.c} strokeWidth={6} />
                <text x={b.x} y={50} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={b.c}>{b.l}</text>
              </g>
            ))}
            <text x={0} y={100} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill={X.cyan} opacity={0.8}>AJANSA GÖRE · TEMMUZ 2010</text>
          </g>
        )}

        {/* ders: kullanan ↔ satın alan */}
        {lesson > 0 && (
          <g opacity={lesson}>
            <Figure x={330} y={1130} s={1.6} c="#9AA0A6" />
            <text x={330} y={1200} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted}>KULLANAN</text>
            <Shopper x={750} y={1060} w o={1} xr={0} />
            <text x={750} y={1200} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.accent}>SATIN ALAN</text>
            <path d="M450 900 q150 -100 230 20" fill="none" stroke={L.accent} strokeWidth={8} strokeLinecap="round" />
          </g>
        )}

        {/* 6: mağazan */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            {note > 0 && (
              <g opacity={note} transform="translate(320,720)">
                <rect x={-200} y={-200} width={400} height={400} rx={20} fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
                <text x={-170} y={-140} fontFamily="Outfit" fontWeight={800} fontSize={34} fill={L.ink}>Sipariş notu</text>
                {['Kendime', 'Hediye'].map((w, i) => (
                  <g key={w} transform={`translate(-170,${-60 + i * 90})`}>
                    <rect width={44} height={44} rx={8} fill="#FFFFFF" stroke={L.ink} strokeWidth={4} />
                    {i === 1 && <path d="M8 22 l10 10 l18 -20" stroke={L.good} strokeWidth={6} fill="none" strokeLinecap="round" />}
                    <text x={64} y={34} fontFamily="Outfit" fontWeight={800} fontSize={34} fill={L.ink}>{w}</text>
                  </g>
                ))}
              </g>
            )}
            {ad > 0 && (
              <g opacity={ad} transform="translate(740,900)">
                <rect x={-200} y={-150} width={400} height={300} rx={24} fill={L.ink} />
                <text y={-70} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill="#FFFFFF" opacity={0.7}>REKLAM</text>
                <text y={0} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={36} fill="#FFFFFF">Doğrudan</text>
                <text y={46} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={36} fill={L.accent}>alıcıya.</text>
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>Erkek reklamını</span>
          <span style={{ display: 'block', color: L.accent }}>kadınlara yaptı.</span>
        </Headline>
        <Headline show={lesson}>
          <span>Kullanana değil,</span>
          <span style={{ display: 'block', color: L.accent }}>satın alana konuştu.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
