// Dünya: "Tuğlaya dönüş" (LEGO 2004–2005; AP/NBC News 2006, Irish Times 2010). Tek dünya: ortada bir oyuncak tuğla.
// Logo yok: genel oyuncak tuğlası çizilir. Kanca: tuğladan yapılmış dönme dolapta "SATILDI" → tuğlanın etrafında her şey
// (park, oyun, giysi, binlerce parça) → 1,93 milyar kron zarar, kule uçurum kenarında → 4 park satılır, yan işler kesilir,
// tek tuğla kalır → röntgen: zarardan kâra (gerçek ölçekli çubuklar) → mağazan: satmayanlar arşive, 3 kategori.
// Bölümler: 0 kanca, 1 her şey, 2 zarar, 3 kesinti, 4 röntgen, 5 kâr + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const RED = '#E8402A';
const COLORS = ['#E8402A', '#F2C14E', '#2E5E8C', '#2E9E5B'];

function Brick({ x, y, w = 160, h = 90, c, xr, o = 1 }: { x: number; y: number; w?: number; h?: number; c: string; xr: number; o?: number }) {
  const studs = Math.max(1, Math.round(w / 80));
  return (
    <g transform={`translate(${x},${y})`} opacity={o}>
      {Array.from({ length: studs }, (_, i) => (
        <rect key={i} x={-w / 2 + (w / studs) * (i + 0.5) - w / studs / 4} y={-h / 2 - 16} width={w / studs / 2} height={18} rx={4} fill={xr > 0.5 ? 'none' : c} stroke={xr > 0.5 ? X.cyan : '#00000040'} strokeWidth={3} />
      ))}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill={xr > 0.5 ? 'none' : c} stroke={xr > 0.5 ? X.cyan : '#00000040'} strokeWidth={3} />
    </g>
  );
}

function Wheel({ x, y, s, t, xr }: { x: number; y: number; s: number; t: number; xr: number }) {
  const ink = xr > 0.5 ? X.cyan : L.ink;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-90 170 L0 0 L90 170" stroke={ink} strokeWidth={10} fill="none" />
      <g transform={`rotate(${t * 20})`}>
        <circle r={140} fill="none" stroke={ink} strokeWidth={8} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <g key={i}>
              <line x1={0} y1={0} x2={Math.cos(a) * 140} y2={Math.sin(a) * 140} stroke={ink} strokeWidth={4} />
              <g transform={`translate(${Math.cos(a) * 140},${Math.sin(a) * 140}) rotate(${-t * 20})`}>
                <rect x={-22} y={-14} width={44} height={28} rx={6} fill={xr > 0.5 ? 'none' : COLORS[i % 4]} stroke={ink} strokeWidth={3} />
              </g>
            </g>
          );
        })}
      </g>
    </g>
  );
}

function Stamp({ x, y, o, s = 1 }: { x: number; y: number; o: number; s?: number }) {
  if (o <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) rotate(-12) scale(${s * (1.3 - 0.3 * o)})`} opacity={o}>
      <rect x={-130} y={-40} width={260} height={80} rx={12} fill="#FFFFFF" stroke={RED} strokeWidth={8} />
      <text y={16} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={46} fill={RED}>SATILDI</text>
    </g>
  );
}

const PIECES = Array.from({ length: 40 }, (_, i) => ({
  x: 160 + ((i * 211) % 760), y: 520 + ((i * 337) % 640), r: (i * 47) % 360, c: COLORS[i % 4], w: 40 + (i % 3) * 20,
}));

export function Tugla({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 11), 0.6));
  const bg = mix(L.bg, X.bg, xr);
  const ink = mix(L.ink, X.cyan, xr);

  // ---- kanca: dönme dolap + SATILDI
  // 25.11: ilk karede tuğla ve dağınık her şey görünür; eski dönme dolap kancası kapalı
  const hook = 0;
  const hookStamp = gir(t, an(0, 3), 0.3); // "sattı"
  // ---- 1: her şey (park, oyun, giysi, parçalar)
  const all = t < bas(1) ? [1, 1, 1, 1] : [1, 1, 1, 1];
  const everything = (1 - gir(t, an(3, 8), 0.6));
  // ---- 2: zarar, kule devriliyor
  const loss = gir(t, an(2, 1), 0.5) * (1 - gir(t, bas(3), 0.5));
  const tilt = gir(t, an(2, 7), 0.8) * (1 - gir(t, bas(3), 0.6));
  // ---- 3: 4 park satılır; yan işler kesilir; tek tuğla
  const parks = gir(t, an(3, 4), 0.5) * (1 - gir(t, an(3, 8), 0.5));
  const parkStamps = [0, 1, 2, 3].map((i) => gir(t, an(3, 6) + i * 0.15, 0.3));
  const cut = gir(t, an(3, 8), 0.6);
  const back = gir(t, an(3, 13), 0.6);
  // ---- 5: kâr çubukları, ders
  const bars = gir(t, bas(5), 0.5) * (1 - gir(t, an(5, 11), 0.5));
  const profit = gir(t, an(5, 8), 0.8);
  const lesson = gir(t, an(5, 11), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6
  const shop = gir(t, bas(6), 0.8);
  const archive = gir(t, an(6, 5), 0.8);
  const three = gir(t, an(6, 11), 0.6);

  const brickS = karis(1, 1.8, back) * (1 - shop);
  const sceneO = (1 - shop) * (1 - bars);
  const towerRot = tilt * 14;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {sceneO > 0 && (
          <g opacity={sceneO}>
            {/* kanca: tuğla dönme dolap */}
            {hook > 0 && (
              <g opacity={hook}>
                <rect x={90} y={1040} width={900} height={60} rx={12} fill="#7FB069" />
                <path d={`M90 520 ${Array.from({ length: 12 }, (_, i) => `Q${135 + i * 75} ${560 + Math.sin(t * 2 + i) * 6} ${165 + i * 75} 520`).join(' ')}`} fill="none" stroke={L.ink} strokeWidth={3} />
                {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${105 + i * 75} 528 l30 0 l-15 34 z`} fill={COLORS[i % 4]} />)}
                {[200, 880].map((x, i) => (
                  <g key={x} transform={`translate(${x},1040)`}>
                    <rect x={-50} y={-150} width={100} height={150} fill={COLORS[(i + 2) % 4]} stroke={L.ink} strokeWidth={4} />
                    <path d="M-70 -150 L0 -220 L70 -150 z" fill={COLORS[(i + 1) % 4]} stroke={L.ink} strokeWidth={4} />
                  </g>
                ))}
                <Wheel x={540} y={800} s={1.45} t={t} xr={xr} />
                <Stamp x={540} y={1120} o={hookStamp} />
              </g>
            )}

            {/* 1: her şey */}
            {everything > 0 && (
              <g opacity={everything * (1 - cut) * (1 - parks * 0.85)}>
                <g opacity={all[0]}><Wheel x={240} y={600} s={0.55} t={t} xr={xr} /></g>
                <g opacity={all[1]} transform="translate(840,600)">
                  <rect x={-110} y={-60} width={220} height={120} rx={60} fill={xr > 0.5 ? 'none' : '#4B5560'} stroke={ink} strokeWidth={5} />
                  <circle cx={-50} cy={0} r={18} fill={RED} />
                  <circle cx={50} cy={-10} r={12} fill="#F2C14E" />
                  <circle cx={70} cy={14} r={12} fill="#2E9E5B" />
                </g>
                <g opacity={all[2]} transform="translate(840,1050)">
                  <path d="M-90 -90 l-60 40 l30 50 l30 -16 v126 h180 v-126 l30 16 l30 -50 l-60 -40 q-30 26 -60 0 z" fill={xr > 0.5 ? 'none' : '#F2C14E'} stroke={ink} strokeWidth={5} transform="translate(30,0)" />
                </g>
                {PIECES.map((p, i) => (
                  <g key={i} opacity={all[3] * gir(t, i * 0.03, 0.2)} transform={`rotate(${p.r} ${p.x} ${p.y})`}>
                    <Brick x={p.x} y={p.y} w={p.w} h={30} c={p.c} xr={xr} />
                  </g>
                ))}
              </g>
            )}

            {/* 2: zarar — kule uçurum kenarında */}
            {(

              <g transform={`rotate(${towerRot} 680 1180)`} opacity={1 - cut * 0}>
                {[0, 1, 2, 3].map((i) => (
                  <Brick key={i} x={540} y={1130 - i * 110} c={COLORS[i % 4]} xr={xr} o={t < bas(3) ? 1 : 1 - cut} />
                ))}
              </g>
            )}
            {loss > 0 && (
              <g opacity={loss} transform="translate(120,500)">
                <rect width={560} height={130} rx={24} fill={RED} />
                <text x={30} y={70} fontFamily="Outfit" fontWeight={800} fontSize={60} fill="#FFFFFF">−1,93 milyar</text>
                <text x={30} y={108} fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill="#FFFFFF" opacity={0.8}>KRON ZARAR · 2004</text>
              </g>
            )}

            {/* 3: 4 park satılır */}
            {parks > 0 && [0, 1, 2, 3].map((i) => (
              <g key={i} opacity={parks}>
                <Wheel x={200 + i * 230} y={620} s={0.42} t={t} xr={xr} />
                <Stamp x={200 + i * 230} y={720} o={parkStamps[i]} s={0.6} />
              </g>
            ))}
            {/* tek tuğla */}
            {back > 0 && <Brick x={540} y={860} c={RED} xr={xr} o={back} w={160 * brickS} h={90 * brickS} />}
          </g>
        )}

        {/* 5: zarardan kâra — gerçek ölçekli çubuklar */}
        {bars > 0 && (
          <g opacity={bars} transform="translate(540,880)">
            <line x1={-380} x2={380} y1={0} y2={0} stroke={ink} strokeWidth={4} />
            <rect x={-300} y={0} width={220} height={386} fill={X.cyan} opacity={0.35} stroke={X.cyan} strokeWidth={4} />
            <text x={-190} y={-24} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} fill={X.cyan}>2004</text>
            <text x={-190} y={200} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={44} fill={X.cyan}>−1,93 mr</text>
            <rect x={80} y={-101 * profit} width={220} height={101 * profit} fill={L.good} />
            <text x={190} y={-120} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={44} fill={L.good} opacity={profit}>+505 mn</text>
            <text x={190} y={44} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} fill={X.cyan}>2005</text>
            <text x={0} y={460} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill={X.cyan}>KRON · AP (2006)</text>
          </g>
        )}

        {/* ders: az ve düzenli tuğla */}
        {lesson > 0 && (
          <g opacity={lesson}>
            {[0, 1, 2].map((i) => <Brick key={i} x={540} y={1100 - i * 110} c={COLORS[i]} xr={0} w={240} h={100} />)}
          </g>
        )}

        {/* 6: mağazan — satmayanlar arşive, 3 kategori */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            {Array.from({ length: 16 }, (_, i) => {
              const dead = i % 3 !== 0;
              const gx = 170 + (i % 4) * 200, gy = 520 + Math.floor(i / 4) * 130;
              const toBox = dead ? archive : 0;
              return (
                <rect key={i} x={karis(gx, 880, toBox)} y={karis(gy, 1180, toBox)} width={karis(160, 30, toBox)} height={karis(100, 20, toBox)} rx={12}
                  fill={dead ? '#D9D4CB' : COLORS[i % 4]} opacity={(1 - three * 0.9) * (1 - toBox * 0.5)} />
              );
            })}
            <g transform="translate(880,1180)" opacity={archive * (1 - three)}>
              <rect x={-80} y={-50} width={160} height={90} rx={10} fill="#B08A5A" stroke={L.ink} strokeWidth={4} />
              <text y={84} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill={L.muted}>ARŞİV</text>
            </g>
            {three > 0 && [0, 1, 2].map((i) => (
              <g key={i} opacity={gir(t, an(6, 11) + i * 0.15, 0.3)} transform={`translate(${250 + i * 290},850)`}>
                <rect x={-125} y={-200} width={250} height={400} rx={24} fill={COLORS[i]} />
                <rect x={-80} y={110} width={160} height={24} rx={12} fill="#FFFFFF" opacity={0.8} />
              </g>
            ))}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={1 - gir(t, bas(1), 0.4)}>
          <span>LEGO neden batıyordu?</span>
          <span style={{ display: 'block', color: L.accent }}>Her şeyi yapıyordu.</span>
        </Headline>
        <Headline show={lesson}>
          <span>Daha az şey,</span>
          <span style={{ display: 'block', color: L.accent }}>daha net bir seçki.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
