// Dünya: "Zamanla öde" (IKEA Dubai 'Buy With Your Time', Şubat 2020; shots.net, PYMNTS). Tek dünya: kum saati ve uzun bir yol.
// Kalıp: Gerçek olay. Tezgâhtaki paralar kum saatine dönüşür (kanca) → şehirden çöldeki mağazaya uzun yol, saat döner
// → saat kadranı madeni paraya dönüşür → 1 saat = 105 dirhem, etikete zaman fiyatı → röntgen: kasada telefondaki rota, emek görünür
// → mağazan: kargo gecikirse her güne küçük indirim kodu, kural açıkça yazılı. Logo yok.
// Bölümler: 0 kanca, 1 yol, 2 zaman=para, 3 kur, 4 röntgen, 5 kasa + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const GOLD = '#E1B24A';
const SAND = '#E9D6AE';

function Hourglass({ x, y, s, flow, xr }: { x: number; y: number; s: number; flow: number; xr: number }) {
  const ink = xr > 0.5 ? X.cyan : L.ink;
  const sand = xr > 0.5 ? X.cyan : GOLD;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-120} y={-200} width={240} height={26} rx={8} fill={ink} />
      <rect x={-120} y={174} width={240} height={26} rx={8} fill={ink} />
      <path d="M-90 -174 C-90 -60 -10 -30 -10 0 C-10 30 -90 60 -90 174 H90 C90 60 10 30 10 0 C10 -30 90 -60 90 -174 z" fill={xr > 0.5 ? 'none' : '#FFFFFF'} stroke={ink} strokeWidth={6} />
      <path d={`M${-70 * (1 - flow)} ${-150 + 120 * flow} H${70 * (1 - flow)} L0 -10 z`} fill={sand} opacity={1 - flow * 0.95} />
      <path d={`M-80 170 Q0 ${170 - 130 * flow} 80 170 z`} fill={sand} />
      <line x1={0} y1={-10} x2={0} y2={160} stroke={sand} strokeWidth={4} opacity={flow > 0.02 && flow < 0.98 ? 1 : 0} />
    </g>
  );
}

function Coin({ x, y, r, o, label, xr }: { x: number; y: number; r: number; o: number; label?: string; xr: number }) {
  if (o <= 0) return null;
  return (
    <g transform={`translate(${x},${y})`} opacity={o}>
      <circle r={r} fill={xr > 0.5 ? 'none' : GOLD} stroke={xr > 0.5 ? X.cyan : '#B8892C'} strokeWidth={r * 0.1} />
      <circle r={r * 0.72} fill="none" stroke={xr > 0.5 ? X.cyan : '#B8892C'} strokeWidth={r * 0.05} />
      {label && <text y={r * 0.2} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={r * 0.55} fill={xr > 0.5 ? X.cyan : '#7A5A1A'}>{label}</text>}
    </g>
  );
}

function Clock({ x, y, r, t, spin, o = 1 }: { x: number; y: number; r: number; t: number; spin: number; o?: number }) {
  return (
    <g transform={`translate(${x},${y})`} opacity={o}>
      <circle r={r} fill="#FFFFFF" stroke={L.ink} strokeWidth={r * 0.08} />
      <line x1={0} y1={0} x2={0} y2={-r * 0.7} stroke={L.ink} strokeWidth={r * 0.07} strokeLinecap="round" transform={`rotate(${t * 40 * spin})`} />
      <line x1={0} y1={0} x2={r * 0.5} y2={0} stroke={L.accent} strokeWidth={r * 0.07} strokeLinecap="round" transform={`rotate(${t * 480 * spin})`} />
    </g>
  );
}

export function Zaman({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 11), 0.6));
  const bg = mix(L.bg, X.bg, xr);
  const ink = mix(L.ink, X.cyan, xr);

  // ---- kanca: paralar kum saatine dönüşür
  const hook = 1 - gir(t, bas(1), 0.5);
  const toGlass = gir(t, an(0, 4), 0.6);
  // ---- 1: uzun yol, araba ilerler, saat döner
  const road = gir(t, bas(1), 0.6) * (1 - gir(t, bas(2), 0.6));
  const drive = gir(t, an(1, 7), Math.max(1.5, an(1, 13) - an(1, 7)));
  // ---- 2: saat → para
  const morph = gir(t, an(2, 5), 0.9);
  const z2 = gir(t, bas(2), 0.5) * (1 - gir(t, bas(3), 0.5));
  // ---- 3: 1 saat = 105 dirhem; etikete zaman fiyatı
  const eq = gir(t, an(3, 0), 0.5) * (1 - gir(t, bas(4), 0.5));
  const dirham = gir(t, an(3, 6), 0.4);
  const tag = gir(t, an(3, 9), 0.5);
  // ---- 5: kasada telefon rotası, emek görünür
  const till = gir(t, bas(4) + 0.3, 0.6) * (1 - gir(t, an(5, 11), 0.5));
  const route = gir(t, an(5, 2), 1.2);
  const pay = gir(t, an(5, 6), 0.8);
  const lesson = gir(t, an(5, 11), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6: mağazan
  const shop = gir(t, bas(6), 0.8);
  const late = gir(t, an(6, 5), 1.0);
  const code = gir(t, an(6, 9), 0.5);
  const rule = gir(t, an(6, 16), 0.5);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* kanca: tezgâh, paralar kum saatine */}
        {hook > 0 && (
          <g opacity={hook}>
            <rect x={140} y={1160} width={800} height={40} rx={10} fill="#B08A5A" />
            {[0, 1, 2, 3, 4].map((i) => (
              <Coin key={i} x={karis(300 + i * 120, 540, toGlass)} y={karis(1130 - (i % 2) * 20, 860, toGlass)} r={50} o={1 - toGlass} xr={xr} />
            ))}
            <g opacity={toGlass}><Hourglass x={540} y={900} s={karis(0.5, 1.1, toGlass)} flow={(t * 0.3) % 1} xr={xr} /></g>
          </g>
        )}

        {/* 1: şehirden çöldeki mağazaya uzun yol */}
        {road > 0 && (
          <g opacity={road}>
            <rect x={90} y={460} width={900} height={820} rx={30} fill={SAND} />
            {[0, 1, 2, 3].map((i) => <rect key={i} x={130 + i * 46} y={560 - i * 30} width={36} height={200 + i * 30} fill="#B9B3A8" />)}
            <text x={130} y={810} fontFamily="JetBrains Mono" fontSize={24} letterSpacing={3} fill={L.ink}>ŞEHİR</text>
            <path d="M180 900 C 420 760 600 1100 860 900" fill="none" stroke="#6E6A63" strokeWidth={30} strokeLinecap="round" />
            <path d="M180 900 C 420 760 600 1100 860 900" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeDasharray="20 20" />
            <g transform="translate(860,820)">
              <rect x={-80} y={-60} width={160} height={110} rx={10} fill="#2E5E8C" stroke={L.ink} strokeWidth={5} />
              <rect x={-60} y={-40} width={120} height={30} rx={6} fill="#F2C14E" />
            </g>
            {(() => {
              // araba yol boyunca
              const p = drive;
              const bx = (u: number) => { const a = 1 - u; return a * a * a * 180 + 3 * a * a * u * 420 + 3 * a * u * u * 600 + u * u * u * 860; };
              const by = (u: number) => { const a = 1 - u; return a * a * a * 900 + 3 * a * a * u * 760 + 3 * a * u * u * 1100 + u * u * u * 900; };
              return (
                <g transform={`translate(${bx(p)},${by(p) - 30})`}>
                  <rect x={-40} y={-24} width={80} height={36} rx={10} fill={L.accent} stroke={L.ink} strokeWidth={4} />
                  <circle cx={-22} cy={14} r={10} fill={L.ink} /><circle cx={22} cy={14} r={10} fill={L.ink} />
                </g>
              );
            })()}
            <Clock x={540} y={1150} r={80} t={t} spin={1 + drive * 4} o={gir(t, an(1, 11), 0.4)} />
            <text x={130} y={520} fontFamily="JetBrains Mono" fontSize={30} letterSpacing={4} fill={L.ink}>2020 · DUBAİ</text>
          </g>
        )}

        {/* 2: saat kadranı paraya dönüşür */}
        {z2 > 0 && (
          <g opacity={z2}>
            <Clock x={540} y={840} r={200} t={t} spin={1} o={1 - morph} />
            <g transform={`translate(540,840) scale(${Math.abs(Math.cos(morph * Math.PI))},1) translate(-540,-840)`}>
              <Coin x={540} y={840} r={200} o={morph} xr={xr} />
            </g>
          </g>
        )}

        {/* 3: 1 saat = 105 dirhem; zaman fiyatı etiketi */}
        {eq > 0 && (
          <g opacity={eq}>
            <Hourglass x={270} y={720} s={0.7} flow={(t * 0.3) % 1} xr={xr} />
            <text x={270} y={930} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={64} fill={ink}>1 saat</text>
            <text x={540} y={760} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={100} fill={ink}>=</text>
            <g opacity={dirham}>
              <Coin x={810} y={720} r={120} o={1} label="105" xr={xr} />
              <text x={810} y={930} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={64} fill={ink}>dirhem</text>
            </g>
            <text x={540} y={990} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill={L.muted}>DUBAİ ORTALAMA SAATLİK ÜCRET · SHOTS.NET</text>
            {tag > 0 && (
              <g opacity={tag} transform="translate(540,1140) rotate(-4)">
                <path d="M-230 -60 h400 l60 60 l-60 60 h-400 z" fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
                <circle cx={150} cy={0} r={12} fill={L.bg} stroke={L.ink} strokeWidth={4} />
                <g transform="translate(-170,0) scale(0.22)"><Hourglass x={0} y={0} s={1} flow={0.5} xr={0} /></g>
                <text x={-110} y={14} fontFamily="Outfit" fontWeight={800} fontSize={40} fill={L.ink}>zaman fiyatı</text>
              </g>
            )}
          </g>
        )}

        {/* 5: röntgen — kasada telefondaki rota ödeme olur */}
        {till > 0 && (
          <g opacity={till}>
            <g transform="translate(330,840)">
              <rect x={-130} y={-250} width={260} height={500} rx={36} fill="none" stroke={X.cyan} strokeWidth={6} />
              <path d={`M-80 170 C -60 40 60 60 70 -170`} fill="none" stroke={X.cyan} strokeWidth={8} strokeDasharray="600" strokeDashoffset={600 * (1 - route)} strokeLinecap="round" />
              <circle cx={-80} cy={170} r={14} fill={X.cyan} />
              <circle cx={70} cy={-170} r={14} fill={L.accent} opacity={route} />
            </g>
            <g transform="translate(780,900)">
              <rect x={-170} y={-120} width={340} height={240} rx={20} fill="none" stroke={X.cyan} strokeWidth={6} />
              <rect x={-130} y={-90} width={260} height={70} rx={10} fill="none" stroke={X.cyan} strokeWidth={4} />
              <text y={-42} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={30} fill={X.cyan} opacity={pay}>ÖDENDİ</text>
            </g>
            <path d="M470 840 C 560 800 600 860 610 880" fill="none" stroke={L.accent} strokeWidth={8} strokeLinecap="round" opacity={pay} markerEnd="" />
          </g>
        )}
        {/* ders: değerli kum saati */}
        {lesson > 0 && (
          <g opacity={lesson}>
            <circle cx={540} cy={860} r={260} fill={GOLD} opacity={0.18} />
            <Hourglass x={540} y={860} s={1} flow={(t * 0.3) % 1} xr={0} />
          </g>
        )}

        {/* 6: mağazan — gecikme telafisi */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <text x={140} y={520} fontFamily="JetBrains Mono" fontSize={26} letterSpacing={3} fill={L.muted}>SÖZ VERİLEN SÜRE · GECİKEN GÜNLER</text>
            {Array.from({ length: 7 }, (_, i) => {
              const promised = i < 3;
              const on = !promised && gir(t, an(6, 5) + (i - 3) * 0.2, 0.3) * late > 0.5;
              return (
                <g key={i} transform={`translate(${170 + i * 110},600)`}>
                  <rect width={90} height={90} rx={14} fill={promised ? L.good : on ? L.accent : L.line} />
                  {on && <text x={45} y={60} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={40} fill="#FFFFFF">+</text>}
                </g>
              );
            })}
            <g transform="translate(400,930)">
              <path d="M-160 -100 h320 v220 h-320 z" fill="#D9B07A" stroke={L.ink} strokeWidth={6} />
              <path d="M-160 -100 l50 -50 h220 l50 50" fill="#E7C795" stroke={L.ink} strokeWidth={6} />
              {code > 0 && (
                <g opacity={code} transform={`translate(0,${karis(-40, -150, code)}) rotate(-6)`}>
                  <rect x={-120} y={-40} width={240} height={80} rx={12} fill="#FFFFFF" stroke={L.accent} strokeWidth={5} strokeDasharray="12 8" />
                  <text y={12} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={32} fill={L.accent}>indirim kodu</text>
                </g>
              )}
            </g>
            {rule > 0 && (
              <g opacity={rule} transform="translate(780,950)">
                <rect x={-160} y={-120} width={320} height={240} rx={20} fill="#FFFFFF" stroke={L.ink} strokeWidth={4} />
                <text y={-70} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={32} fill={L.ink}>Kural</text>
                {[0, 1, 2].map((i) => <rect key={i} x={-120} y={-30 + i * 44} width={[240, 200, 220][i]} height={20} rx={10} fill={L.line} />)}
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>Para değil,</span>
          <span style={{ display: 'block', color: L.accent }}>zaman istedi.</span>
        </Headline>
        <Headline show={lesson}>
          <span>Harcadığı emek</span>
          <span style={{ display: 'block', color: L.accent }}>görünür oldu.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
