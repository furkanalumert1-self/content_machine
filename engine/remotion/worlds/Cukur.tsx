// Dünya: "Çukurlu yol" (Domino's Paving for Pizza, 2018; CBS Boston, NRN, Restaurant Dive). Tek dünya: yandan bir yol ve kurye.
// Kalıp: Gerçek olay. Asfaltlanan yol (kanca) → çukurlarda zıplayan kurye, kutunun içinde kayan pizza → çukurlar kapanır,
// ilk 4 kasaba → aday gösteren eller, 50 eyalet → röntgen: kutu kesiti + çukur, insanlar katılır → mağazan: koli, dolgu, fotoğraf mesajı.
// Bölümler: 0 kanca, 1 sorun, 2 çözüm, 3 aday, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, Person, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const ROAD_Y = 1080;
const HOLES = [260, 540, 820];
const ASPHALT = '#3A3A3A';

/** Pizza kutusu kesiti: slide −1…1 (peynir/pizza kayması), stuck: peynir kapakta. */
function BoxCut({ x, y, s, slide, stuck, xr }: { x: number; y: number; s: number; slide: number; stuck: number; xr: number }) {
  const ink = xr > 0.5 ? X.cyan : L.ink;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-200} y={-70} width={400} height={140} rx={10} fill={xr > 0.5 ? 'none' : '#D9B07A'} stroke={ink} strokeWidth={6} />
      <rect x={-184} y={-54} width={368} height={108} fill={xr > 0.5 ? 'none' : '#F3E3C4'} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />
      <g transform={`translate(${slide * 60},0)`}>
        <rect x={-150} y={20} width={300} height={26} rx={10} fill={xr > 0.5 ? 'none' : '#E1A54B'} stroke={ink} strokeWidth={3} />
        <rect x={-140} y={8} width={karis(280, 180, stuck)} height={14} rx={7} fill={xr > 0.5 ? 'none' : '#F2C14E'} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />
      </g>
      {/* kapağa/yana yapışan peynir */}
      {stuck > 0 && <path d={`M${180 - 4} -40 q-30 ${30 * stuck} -10 ${70 * stuck}`} stroke={xr > 0.5 ? X.cyan : '#F2C14E'} strokeWidth={16} strokeLinecap="round" fill="none" opacity={stuck} />}
    </g>
  );
}

function Scooter({ x, y, tilt, xr }: { x: number; y: number; tilt: number; xr: number }) {
  const ink = xr > 0.5 ? X.cyan : L.ink;
  return (
    <g transform={`translate(${x},${y}) rotate(${tilt})`}>
      <circle cx={-60} cy={-30} r={30} fill={xr > 0.5 ? 'none' : L.ink} stroke={ink} strokeWidth={4} />
      <circle cx={70} cy={-30} r={30} fill={xr > 0.5 ? 'none' : L.ink} stroke={ink} strokeWidth={4} />
      <path d="M-60 -30 L-20 -70 H50 L70 -30 M50 -70 L60 -130" stroke={ink} strokeWidth={10} fill="none" strokeLinecap="round" />
      <rect x={-120} y={-150} width={110} height={70} rx={8} fill={xr > 0.5 ? 'none' : L.accent} stroke={ink} strokeWidth={4} />
      {/* sürücü */}
      <circle cx={10} cy={-190} r={22} fill={ink} />
      <path d="M10 -168 L0 -100 M5 -150 L55 -130" stroke={ink} strokeWidth={12} strokeLinecap="round" />
    </g>
  );
}

export function Cukur({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 9), 0.6));
  const bg = mix(L.bg, X.bg, xr);

  // ---- kanca: yeni asfalt soldan sağa serilir; "Sorun" ile çukurlar geri gelir (geçmişe dönüş)
  const pave = gir(t, an(0, 3), 1.6) * (1 - gir(t, bas(1), 0.4));
  // ---- 1: kurye çukurlardan geçer, pizza kayar
  const ride = gir(t, an(1, 2), Math.max(1.5, an(1, 11) - an(1, 2)));
  const sx = karis(-150, 1230, ride);
  const nearHole = HOLES.reduce((m, h) => Math.max(m, Math.max(0, 1 - Math.abs(sx - h) / 90)), 0);
  const bump = t >= bas(1) && t < bas(2) ? -nearHole * 40 : 0;
  const slide = t >= bas(1) && t < bas(2) ? Math.sin(ride * Math.PI * 6) * Math.min(1, ride * 3) : 0;
  const stuck = gir(t, an(1, 8), 0.6) * (1 - gir(t, bas(2), 0.4));
  const cut = gir(t, an(1, 4), 0.5) * (1 - gir(t, bas(2), 0.5));
  // ---- 2: çukurlar kapanır; ilk 4 kasaba
  const fill = HOLES.map((_, i) => gir(t, an(2, 5) + i * 0.25, 0.5));
  const towns = gir(t, an(2, 8), 0.5) * (1 - gir(t, bas(3), 0.4));
  // ---- 3: aday gösteren kalabalık, 50 eyalet
  const crowd = gir(t, an(3, 2), 0.6) * (1 - gir(t, bas(4), 0.5));
  const states = gir(t, an(3, 9), 0.5) * (1 - gir(t, bas(4), 0.5));
  // ---- 5: kutu kesiti + çukur; katılanlar; ders
  const xcut = gir(t, an(5, 1), 0.5) * (1 - gir(t, an(5, 9), 0.5));
  const join = gir(t, an(5, 9), 0.6) * (1 - gir(t, bas(6), 0.5));
  const lesson = gir(t, an(5, 3), 0.5) * (1 - gir(t, an(5, 9), 0.4));
  // ---- 6: mağazan
  const shop = gir(t, bas(6), 0.8);
  const pad = gir(t, an(6, 6), 0.6);
  const photo = gir(t, an(6, 8), 0.5);

  const roadO = (1 - shop) * (1 - states) * (1 - xcut * 0.85);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {roadO > 0 && (
          <g opacity={roadO}>
            {/* kasaba silueti */}
            {[120, 330, 560, 800, 980].map((x, i) => (
              <rect key={x} x={x - 80} y={ROAD_Y - 260 - (i % 3) * 60} width={160} height={260 + (i % 3) * 60} fill={xr > 0.5 ? 'none' : '#D9D4CB'} stroke={xr > 0.5 ? X.cyan : '#C2BCB1'} strokeWidth={3} />
            ))}
            {/* yol */}
            <rect x={0} y={ROAD_Y} width={1080} height={200} fill={xr > 0.5 ? 'none' : ASPHALT} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={3} />
            {Array.from({ length: 9 }, (_, i) => <rect key={i} x={i * 130 + 20} y={ROAD_Y + 96} width={70} height={10} fill="#E6E2D9" opacity={0.7} />)}
            {/* çukurlar (kancada yeni asfaltla örtülü) */}
            {HOLES.map((h, i) => {
              const covered = t < bas(1) ? (1080 * pave > h + 60 ? 1 : 0) : fill[i];
              return (
                <g key={h}>
                  <ellipse cx={h} cy={ROAD_Y + 8} rx={70} ry={22} fill={xr > 0.5 ? 'none' : '#151515'} stroke={xr > 0.5 ? X.cyan : '#5A5A5A'} strokeWidth={4} opacity={1 - covered} />
                  {covered > 0 && <ellipse cx={h} cy={ROAD_Y + 6} rx={78} ry={22} fill={t < bas(1) ? ASPHALT : '#555555'} stroke={t < bas(1) ? 'none' : L.accent} strokeWidth={5} opacity={covered} />}
                </g>
              );
            })}
            {/* kanca: yeni asfalt serilir, silindir */}
            {pave > 0 && (
              <g>
                <rect x={0} y={ROAD_Y - 6} width={1080 * pave} height={22} fill="#151515" />
                <g transform={`translate(${1080 * pave},${ROAD_Y - 90}) scale(1.6)`}>
                  <circle r={60} cx={0} cy={10} fill="#8A8A8A" stroke={L.ink} strokeWidth={5} />
                  <rect x={-20} y={-120} width={120} height={80} rx={10} fill={L.accent} stroke={L.ink} strokeWidth={5} />
                </g>
              </g>
            )}
            {/* kurye */}
            {t >= bas(1) && t < bas(2) && <g transform={`translate(${sx},${ROAD_Y + bump}) scale(1.6) translate(${-sx},${-(ROAD_Y + bump)})`}><Scooter x={sx} y={ROAD_Y + bump} tilt={bump * 0.2} xr={xr} /></g>}
            {/* ilk 4 kasaba */}
            {towns > 0 && [180, 420, 660, 900].map((x, i) => (
              <g key={x} transform={`translate(${x},${ROAD_Y - 330})`} opacity={gir(t, an(2, 8) + i * 0.2, 0.3) * towns}>
                <path d="M0 0 c-30 -40 -30 -80 0 -80 c30 0 30 40 0 80 z" fill={L.accent} />
                <circle cy={-50} r={12} fill="#FFFFFF" />
              </g>
            ))}
            {/* aday gösteren eller */}
            {crowd > 0 && Array.from({ length: 30 }, (_, i) => {
              const x = 90 + (i % 10) * 100, y = 620 + Math.floor(i / 10) * 90;
              const up = gir(t, an(3, 2) + i * 0.04, 0.3);
              return (
                <g key={i} opacity={crowd}>
                  <Person x={x} y={y} c={L.ink} s={3} />
                  <line x1={x + 14} y1={y - 10} x2={x + 22} y2={y - 10 - 40 * up} stroke={L.ink} strokeWidth={6} strokeLinecap="round" />
                </g>
              );
            })}
          </g>
        )}

        {/* 1: kutunun içi (kesit) */}
        {cut > 0 && (
          <g opacity={cut}>
            <BoxCut x={540} y={560} s={1.4} slide={slide} stuck={stuck} xr={xr} />
          </g>
        )}

        {/* 3: 137.000+ etiketi */}
        {crowd > 0 && (
          <g opacity={crowd * (1 - states)} transform="translate(120,470)">
            <rect x={0} y={-70} width={560} height={120} rx={24} fill={L.ink} />
            <text x={30} y={0} fontFamily="Outfit" fontWeight={800} fontSize={58} fill="#FFFFFF">137.000+</text>
            <text x={30} y={36} fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill="#FFFFFF" opacity={0.7}>ADAY GÖSTERME · ŞİRKETE GÖRE</text>
          </g>
        )}
        {/* 3: 50 eyalet */}
        {states > 0 && (
          <g opacity={states}>
            {Array.from({ length: 50 }, (_, i) => (
              <rect key={i} x={165 + (i % 10) * 76} y={520 + Math.floor(i / 10) * 76} width={60} height={60} rx={10} fill={gir(t, an(3, 9) + i * 0.02, 0.2) > 0.5 ? L.accent : L.line} />
            ))}
            <text x={540} y={1000} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={90} fill={L.ink}>50 eyalet</text>
          </g>
        )}

        {/* 5: röntgen — kutu kesiti çukurun üstünde */}
        {xcut > 0 && (
          <g opacity={xcut}>
            <BoxCut x={540} y={620} s={1.3} slide={Math.sin(t * 5) * 0.8} stuck={1} xr={1} />
            <path d="M200 960 h220 q120 90 240 0 h220" fill="none" stroke={X.cyan} strokeWidth={6} />
            <path d="M540 720 v150" stroke={X.cyan} strokeWidth={5} strokeDasharray="10 10" />
            <path d="M200 960 h220 q120 90 240 0 h220" fill="none" stroke={L.accent} strokeWidth={8} opacity={gir(t, an(5, 5), 0.4)} strokeDasharray="1 0" />
          </g>
        )}
        {/* 5: insanlar kampanyaya katılır */}
        {join > 0 && Array.from({ length: 18 }, (_, i) => (
          <Person key={i} x={karis(i % 2 ? 1150 : -70, 230 + (i % 9) * 78, gir(t, an(5, 9) + i * 0.06, 0.6))} y={ROAD_Y - 30 - Math.floor(i / 9) * 70} c={L.accent} s={3} o={join} />
        ))}

        {/* 6: mağazan — koli, dolgu, fotoğraf mesajı */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <g transform="translate(540,720)">
              <path d="M-200 -120 h400 v260 h-400 z" fill="#D9B07A" stroke={L.ink} strokeWidth={6} />
              <path d="M-200 -120 l60 -60 h280 l60 60" fill="#E7C795" stroke={L.ink} strokeWidth={6} />
              {[[-200, -120], [200, -120], [-200, 140], [200, 140]].map(([x, y], i) => (
                <path key={i} d={`M${x} ${y} l${x < 0 ? 50 : -50} 0 l${x < 0 ? -50 : 50} ${y < 0 ? 50 : -50} z`} fill={L.good} opacity={pad} />
              ))}
            </g>
            {photo > 0 && (
              <g opacity={photo} transform="translate(540,1080)">
                <rect x={-380} y={-70} width={760} height={140} rx={30} fill={L.ink} />
                <text y={-8} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={34} fill="#FFFFFF">Hasarlı mı geldi? Fotoğrafını gönder,</text>
                <text y={38} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={34} fill="#F2C14E">yenisini yollayalım.</text>
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={1 - gir(t, bas(1), 0.4)}>
          <span>Pizza satmak için</span>
          <span style={{ display: 'block', color: L.accent }}>yol asfaltladı.</span>
        </Headline>
        <Headline show={lesson}>
          <span style={{ color: X.cyan }}>Gerçek bir sorunu</span>
          <span style={{ display: 'block', color: L.accent }}>müşteri için çözdü.</span>
        </Headline>
      </WorldQc>
      <div style={{ position: 'absolute', left: 90, top: 300, fontFamily: 'JetBrains Mono, monospace', fontSize: 34, letterSpacing: 4, color: L.ink, opacity: gir(t, bas(2), 0.4) * (1 - gir(t, an(2, 8), 0.4)) }}>
        2018
      </div>
    </AbsoluteFill>
  );
}
