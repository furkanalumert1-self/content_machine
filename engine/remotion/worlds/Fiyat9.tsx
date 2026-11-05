// Dünya: "9'la biten fiyat" (Anderson & Simester katalog deneyi). Tek sahne: bir giyim kataloğu sayfası ve asılı fiyat etiketi.
// Katalog üçe çoğalır, etiketler 44 / 49 / 54 olur, altlarında satış torbaları yükselir; röntgende göz soldaki rakamı okur.
// Bölümler: 0 kanca, 1 katalog, 2 fiyatlar, 3 satışlar, 4 üç deney, 5 röntgen, 6 sol rakam, 7 indirim sinyali, 8 mağazan, 9 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

function Dress({ c, xr }: { c: string; xr: number }) {
  return (
    <g>
      <path d="M-60 -170 q60 40 120 0 l30 60 l-40 30 l60 230 h-260 l60 -230 l-40 -30 z" fill={xr > 0.5 ? 'none' : c} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={4} />
      <path d="M-60 -170 l-10 -40 M60 -170 l10 -40" stroke={mix(L.ink, X.cyan, xr)} strokeWidth={6} strokeLinecap="round" />
      <path d="M-58 -50 h116" stroke="#fff" strokeOpacity={0.5 * (1 - xr)} strokeWidth={8} />
    </g>
  );
}

/** Katalog sayfası + asılı fiyat etiketi. */
function Catalog({ x, y, s, price, xr, tagGlow = 0, swing = 0, sticker = 0 }: { x: number; y: number; s: number; price: string; xr: number; tagGlow?: number; swing?: number; sticker?: number }) {
  const ink = mix(L.ink, X.cyan, xr);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-250} y={-340} width={500} height={680} rx={24} fill={mix(L.paper, X.bg, xr)} stroke={mix(L.line, X.cyan, xr)} strokeWidth={4} />
      <text x={-210} y={-284} fontFamily="Outfit" fontWeight={800} fontSize={30} letterSpacing={6} fill={ink}>KATALOG</text>
      <text x={210} y={-284} textAnchor="end" fontFamily="JetBrains Mono" fontSize={20} fill={mix(L.muted, X.cyan, xr)}>SONBAHAR</text>
      <g transform="translate(-30,40)"><Dress c="#2E5E8C" xr={xr} /></g>
      {/* etiket */}
      <g transform={`translate(150,-140) rotate(${-8 + swing})`}>
        <path d="M0 -60 L0 0" stroke={ink} strokeWidth={3} />
        <g transform="translate(0,0)">
          <path d="M-70 0 h140 l0 110 l-70 40 l-70 -40 z" fill={tagGlow > 0 ? mix('#FFFFFF', L.accent, tagGlow) : mix('#FFFFFF', X.bg, xr)} stroke={xr > 0.5 ? X.cyan : L.ink} strokeWidth={4} />
          <circle cx={0} cy={22} r={8} fill={mix(L.bg, X.bg, xr)} stroke={xr > 0.5 ? X.cyan : L.ink} strokeWidth={3} />
          <text y={92} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={58} fill={tagGlow > 0.5 ? '#fff' : ink}>{price}</text>
        </g>
        {sticker > 0 && (
          <g transform={`translate(70,150) rotate(12) scale(${0.6 + 0.4 * sticker})`} opacity={sticker}>
            <rect x={-90} y={-26} width={180} height={52} rx={26} fill={L.accent} />
            <text y={10} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={26} fill="#fff">İNDİRİM?</text>
          </g>
        )}
      </g>
    </g>
  );
}

/** Alışveriş torbası yığını (satış); h: 0–1. */
function Bags({ x, y, h, c, xr }: { x: number; y: number; h: number; c: string; xr: number }) {
  const n = Math.round(h * 7);
  return (
    <g transform={`translate(${x},${y})`}>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`translate(0,${-i * 52})`}>
          <rect x={-40} y={-46} width={80} height={46} rx={6} fill={xr > 0.5 ? 'none' : c} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />
          <path d="M-16 -46 q16 -24 32 0" fill="none" stroke={mix(L.ink, X.cyan, xr)} strokeWidth={4} />
        </g>
      ))}
    </g>
  );
}

export function Fiyat9({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  // Röntgen, 6. bölümün ilk cümlesi (göz soldan okuyor) bitene kadar sürer.
  const xr = gir(t, bas(5), 0.5) * (1 - gir(t, an(6, 4), 0.6));
  const bg = mix(L.bg, X.bg, xr);

  // Kanca: etiket 44 ↔ 49 arasında döner; tek katalog, hafif yaklaşma.
  const ph = Math.floor(t / 0.8);
  const hookPrice = ph % 2 ? '49' : '44';
  const swing = Math.sin(t * 2.2) * 4;

  // 1: katalog üçe çoğalır. 2: fiyatlar. 3: satışlar. 4: üç deney damgası.
  const three = gir(t, an(1, 4), 1.0);
  const prices = ['44', '49', '54'];
  const priceAt = [an(2, 0), an(2, 2), an(2, 4)];
  const bagsSide = gir(t, an(3, 0), 1.0);
  const bags49 = gir(t, an(3, 7), 1.0);
  const crown = gir(t, an(3, 7) + 0.6, 0.4);
  const stamps = [0, 1, 2].map((i) => gir(t, an(4, 2) + i * 0.3, 0.3));

  // 5: röntgen — dev etiket, göz soldan okur.
  const big = gir(t, bas(5), 0.5) * (1 - gir(t, an(6, 4), 0.5));
  const eye = gir(t, bas(5) + 0.4, 1.0);
  // 6: 2,99 ile 3; 7: indirim sinyali; 8: mağazan (ilk kareye dönüş).
  const cmp = gir(t, an(6, 4), 0.6) * (1 - gir(t, bas(7), 0.6));
  const one = gir(t, bas(7), 0.7);
  const shop = gir(t, bas(8), 0.6);

  const xs = [karis(540, 230, three), 540, karis(540, 850, three)];
  const sc = karis(1, 0.56, three);
  const cy = karis(760, 640, three);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* 0–4: kataloglar */}
        {t < an(6, 4) + 0.8 && (
          <g opacity={Math.max(0, 1 - big * 2.5)}>
            {[0, 2, 1].map((i) => (
              <g key={i} opacity={i === 1 ? 1 : three}>
                <Catalog x={xs[i]} y={cy} s={sc} xr={xr} swing={swing}
                  price={t < bas(1) ? hookPrice : t < priceAt[i] && t >= bas(2) ? '··' : t < bas(2) ? '49' : prices[i]}
                  tagGlow={i === 1 ? crown : 0} />
                {stamps[i] > 0 && (
                  <g transform={`translate(${xs[i] + 70},${cy - 60}) rotate(-10) scale(${1.4 - stamps[i] * 0.4})`} opacity={stamps[i]}>
                    <circle r={46} fill="none" stroke={L.good} strokeWidth={8} />
                    <path d="M-20 0 l12 14 l26 -30" stroke={L.good} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}
              </g>
            ))}
            {/* satış torbaları */}
            <g opacity={three}>
              <Bags x={xs[0]} y={1200} h={0.64 * bagsSide} c="#8C8577" xr={xr} />
              <Bags x={xs[2]} y={1200} h={0.62 * bagsSide} c="#8C8577" xr={xr} />
              <Bags x={xs[1]} y={1200} h={1.0 * bags49} c={L.accent} xr={xr} />
              {crown > 0 && (
                <path transform={`translate(${xs[1]},${1200 - 7 * 52 - 40}) scale(${crown})`} d="M-40 0 l10 -40 l20 22 l10 -32 l10 32 l20 -22 l10 40 z" fill="#F2C14E" />
              )}
            </g>
          </g>
        )}

        {/* 5: dev etiket, göz soldaki rakamı okur */}
        {big > 0 && (
          <g opacity={big} transform="translate(540,800)">
            <path d="M-260 -160 h520 l0 300 l-260 120 l-260 -120 z" fill="none" stroke={X.cyan} strokeWidth={6} />
            <text x={-90} y={90} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={260} fill={X.cyan}>4</text>
            <text x={90} y={90} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={260} fill={X.cyan} opacity={0.25}>9</text>
            <g transform={`translate(${karis(-90, 90, Math.max(0, eye - 0.6) / 0.4)},-230)`}>
              <ellipse rx={56} ry={30} fill="none" stroke={X.cyan} strokeWidth={5} />
              <circle r={14} fill={X.cyan} />
            </g>
            <text y={330} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={34} letterSpacing={4} fill={X.cyan} opacity={gir(t, bas(5) + 0.8, 0.4)}>ÖNCE SOLDAKİ RAKAM</text>
          </g>
        )}

        {/* 6: 2,99 ile 3 */}
        {cmp > 0 && (
          <g opacity={cmp}>
            {[{ x: 300, p: '2,99', a: an(6, 4) }, { x: 780, p: '3', a: an(6, 6) }].map((g, i) => (
              <g key={i} transform={`translate(${g.x},760) scale(${0.85 + 0.15 * gir(t, g.a, 0.3)})`} opacity={gir(t, g.a, 0.3)}>
                <path d="M-170 -120 h340 l0 230 l-170 80 l-170 -80 z" fill="#fff" stroke={L.ink} strokeWidth={5} />
                <text y={70} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={130} fill={L.ink}>
                  <tspan fill={L.accent}>{g.p[0]}</tspan>{g.p.slice(1)}
                </text>
              </g>
            ))}
            {/* bir kuruşluk gerçek fark ↔ hissedilen fark */}
            <g opacity={gir(t, an(6, 14), 0.5)} fontFamily="JetBrains Mono" fontSize={28} fill={L.muted} textAnchor="middle">
              <line x1={500} x2={580} y1={1010} y2={1010} stroke={L.muted} strokeWidth={4} />
              <text x={540} y={990}>GERÇEK FARK</text>
              <line x1={200} x2={880} y1={1110} y2={1110} stroke={L.accent} strokeWidth={8} strokeLinecap="round" />
              <text x={540} y={1090} fill={L.accent}>HİSSEDİLEN FARK</text>
            </g>
          </g>
        )}

        {/* 7–8: tek katalog geri gelir (ilk kare), 49 etiketine "indirim?" yapışır */}
        {one > 0 && (
          <g opacity={one}>
            <Catalog x={540} y={karis(760, 700, shop)} s={karis(1, 0.82, shop)} xr={0} price="49" swing={swing} sticker={gir(t, an(7, 7), 0.4)} tagGlow={0} />
            {shop > 0 && (
              <g opacity={shop} transform="translate(540,1130)">
                <text y={-30} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={3} fill={L.muted}>İKİ HAFTALIK TEST</text>
                {Array.from({ length: 14 }, (_, i) => (
                  <rect key={i} x={-385 + i * 55} y={0} width={45} height={45} rx={8} fill={gir(t, an(8, 7) + i * 0.08, 0.2) > 0.5 ? L.accent : L.line} />
                ))}
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={1 - gir(t, bas(1), 0.4)}>
          <span>Hangisi daha çok sattı?</span>
          <span style={{ display: 'block', color: L.accent }}>44 mü, 49 mu?</span>
        </Headline>
        <Headline show={gir(t, an(7, 4), 0.5) * (1 - gir(t, bas(8), 0.4))}>
          <span>9'la biten fiyat</span>
          <span style={{ display: 'block', color: L.accent }}>indirim gibi görünür.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
