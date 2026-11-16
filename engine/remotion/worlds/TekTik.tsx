// Dünya: "Tek tık" (Amazon US 5,960,411: başvuru 1997, patent 1999; Apple lisansı 18.09.2000, çapraz lisans). Tek dünya: ödeme adımları.
// Kalıp: Bu neden var? Dev "SATIN AL" düğmesi ve imleç (kanca) → 1997: adres, kart, onay, bir sayfa daha; her adımda müşteri düşer
// → adımlar tek düğmeye çöker, patent belgesi 1999 → yanda ikinci mağaza, aynı düğme, "LİSANS" (2000) → röntgen: adım başına sızıntı
// → mağazan: zorunlu üyelik kalkar, misafir ödeme, onaylı kart saklama. Logo yok; mağazalar düz yazıyla.
// Bölümler: 0 kanca, 1 adımlar, 2 patent, 3 lisans, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const STEPS = ['Adres', 'Kart', 'Onay', 'Bir sayfa daha'];

function Button({ x, y, s, label, xr, press = 0 }: { x: number; y: number; s: number; label: string; xr: number; press?: number }) {
  return (
    <g transform={`translate(${x},${y + press * 8}) scale(${s})`}>
      <rect x={-230} y={-60} width={460} height={120} rx={60} fill={xr > 0.5 ? 'none' : L.accent} stroke={xr > 0.5 ? X.cyan : '#B32E1E'} strokeWidth={6} />
      <text y={20} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={56} fill={xr > 0.5 ? X.cyan : '#FFFFFF'}>{label}</text>
    </g>
  );
}

function Cursor({ x, y, s = 1, c = L.ink }: { x: number; y: number; s?: number; c?: string }) {
  return <path transform={`translate(${x},${y}) scale(${s})`} d="M0 0 L0 120 L30 92 L52 140 L74 130 L52 84 L96 82 z" fill={c} stroke="#FFFFFF" strokeWidth={6} strokeLinejoin="round" />;
}

export function TekTik({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 10), 0.6));
  const bg = mix(L.bg, X.bg, xr);
  const ink = mix(L.ink, X.cyan, xr);

  // ---- kanca: dev düğme, imleç gelir ve tıklar
  const hook = 1 - gir(t, bas(1), 0.5);
  const curIn = gir(t, an(0, 1), 1.0);
  const click = gir(t, an(0, 3), 0.15) * (1 - gir(t, an(0, 3) + 0.25, 0.15));
  // ---- 1: dört adım; her adımda bazıları düşer
  const steps = STEPS.map((_, i) => gir(t, an(1, 4 + i), 0.35));
  const leak = gir(t, an(1, 10), 1.2);
  const stepsO = gir(t, bas(1), 0.4) * (1 - gir(t, an(2, 10), 0.6));
  // ---- 2: adımlar tek düğmeye çöker; patent 1999
  const collapse = gir(t, an(2, 10), 0.8);
  const patent = gir(t, an(2, 6), 0.5) * (1 - gir(t, an(2, 10), 0.5));
  const oneClick = gir(t, an(2, 12), 0.15) * (1 - gir(t, an(2, 12) + 0.25, 0.15));
  // ---- 3: ikinci mağaza, lisans
  const store2 = gir(t, an(3, 4), 0.6) * (1 - gir(t, bas(4), 0.5));
  const lic = gir(t, an(3, 11), 0.4);
  // ---- 5: sızıntı hunisi, ders
  const funnel = gir(t, bas(4) + 0.3, 0.6) * (1 - gir(t, an(5, 10), 0.5));
  const lesson = gir(t, an(5, 10), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6: mağazan
  const shop = gir(t, bas(6), 0.8);
  const noMember = gir(t, an(6, 2), 0.5);
  const guest = gir(t, an(6, 5), 0.5);
  const consent = gir(t, an(6, 8), 0.5);

  const DROP = Array.from({ length: 24 }, (_, i) => i);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* kanca */}
        {hook > 0 && (
          <g opacity={hook}>
            <Button x={540} y={820} s={1.2} label="SATIN AL" xr={xr} press={click} />
            <Cursor x={karis(900, 600, curIn)} y={karis(1250, 840, curIn)} s={1.3} />
            <text x={540} y={1060} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={32} letterSpacing={6} fill={L.muted} opacity={curIn}>TEK TIK</text>
          </g>
        )}

        {/* 1–2: adımlar ve düşen müşteriler; sonra tek düğmeye çöker */}
        {stepsO > 0 && (
          <g opacity={stepsO}>
            {STEPS.map((s, i) => {
              const y = karis(520 + i * 170, 820, collapse);
              return (
                <g key={s} opacity={steps[i] * (1 - collapse)}>
                  <rect x={240} y={y - 60} width={600} height={120} rx={20} fill={xr > 0.5 ? 'none' : '#FFFFFF'} stroke={ink} strokeWidth={5} />
                  <text x={290} y={y + 16} fontFamily="Outfit" fontWeight={800} fontSize={46} fill={ink}>{s}</text>
                  <text x={800} y={y + 16} textAnchor="end" fontFamily="JetBrains Mono" fontSize={28} fill={L.muted}>{i + 1}/4</text>
                </g>
              );
            })}
            {/* düşen müşteriler: her adımın kenarından dışarı */}
            {DROP.map((i) => {
              const step = i % 4;
              const u = gir(t, an(1, 10) + i * 0.05, 0.8) * leak;
              const y0 = 520 + step * 170;
              return (
                <circle key={i} cx={karis(860 + (i % 3) * 20, 1040 + (i % 4) * 10, u)} cy={karis(y0, y0 + 300, u * u)} r={14}
                  fill={L.accent} opacity={Math.min(1, u * 6) * (1 - u) * (1 - collapse)} />
              );
            })}
          </g>
        )}
        {collapse > 0 && t < bas(4) && (
          <g opacity={collapse * (1 - store2)}>
            <Button x={540} y={820} s={1} label="Tek tıkla al" xr={xr} press={oneClick} />
            <Cursor x={600} y={840} s={1.1} />
          </g>
        )}

        {/* 2: patent belgesi 1999 */}
        {patent > 0 && (
          <g opacity={patent} transform={`translate(800,1150) rotate(-6) scale(${0.9 + 0.1 * patent})`}>
            <rect x={-200} y={-120} width={400} height={240} rx={10} fill="#F4F1EA" stroke={L.ink} strokeWidth={5} />
            <text y={-60} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={3} fill={L.ink}>ABD PATENTİ</text>
            <text y={20} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={70} fill={L.accent}>1999</text>
            <rect x={-150} y={56} width={300} height={14} rx={7} fill="#CFCAC1" />
          </g>
        )}

        {/* 3: iki mağaza, aynı düğme; ikincisine lisans */}
        {store2 > 0 && (
          <g opacity={store2}>
            {[{ x: 290, n: 'AMAZON' }, { x: 790, n: 'APPLE' }].map((m, i) => (
              <g key={m.n} transform={`translate(${m.x},820)`}>
                <rect x={-210} y={-260} width={420} height={460} rx={28} fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
                <text y={-190} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={40} fill={L.ink}>{m.n}</text>
                <rect x={-150} y={-140} width={300} height={140} rx={16} fill="#E7EEF5" />
                <Button x={0} y={110} s={0.55} label="Tek tık" xr={0} />
                {i === 1 && lic > 0 && (
                  <g transform={`rotate(-12) scale(${1.3 - 0.3 * lic})`} opacity={lic}>
                    <rect x={-130} y={-40} width={260} height={80} rx={12} fill="#FFFFFF" stroke={L.good} strokeWidth={8} />
                    <text y={16} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={44} fill={L.good}>LİSANS</text>
                  </g>
                )}
              </g>
            ))}
            <text x={540} y={1180} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={30} letterSpacing={4} fill={L.muted}>2000</text>
          </g>
        )}

        {/* 5: röntgen — adım başına sızıntı */}
        {funnel > 0 && (
          <g opacity={funnel}>
            {[0, 1, 2, 3, 4].map((i) => {
              const w = 760 - i * 120;
              return (
                <g key={i}>
                  <rect x={540 - w / 2} y={520 + i * 140} width={w} height={100} rx={14} fill="none" stroke={X.cyan} strokeWidth={4} />
                  {i < 4 && <path d={`M${540 + w / 2 - 20} ${570 + i * 140} q80 20 110 90`} fill="none" stroke={L.accent} strokeWidth={6} strokeLinecap="round" opacity={gir(t, an(5, 6) + i * 0.15, 0.3)} />}
                </g>
              );
            })}
            <text x={540} y={1260} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={28} letterSpacing={3} fill={L.accent} opacity={gir(t, an(5, 8), 0.4)}>VAZGEÇME FIRSATI</text>
          </g>
        )}
        {/* ders: tek düğme */}
        {lesson > 0 && <g opacity={lesson}><Button x={540} y={860} s={1.1} label="Tek tık" xr={0} /></g>}

        {/* 6: mağazan — ödeme sayfası */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <text x={140} y={520} fontFamily="Outfit" fontWeight={800} fontSize={40} fill={L.ink}>Ödeme</text>
            <g opacity={1 - noMember * 0.85}>
              <rect x={140} y={560} width={800} height={90} rx={16} fill="#FFFFFF" stroke={L.line} strokeWidth={3} />
              <text x={170} y={618} fontFamily="Outfit" fontWeight={800} fontSize={34} fill={L.ink}>Üye ol (zorunlu)</text>
              <line x1={150} x2={karis(150, 930, noMember)} y1={605} y2={605} stroke={L.accent} strokeWidth={8} />
            </g>
            <g opacity={guest} transform="translate(540,740)">
              <rect x={-400} y={-50} width={800} height={100} rx={50} fill={L.ink} />
              <text y={14} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={38} fill="#FFFFFF">Üye olmadan devam et</text>
            </g>
            {[0, 1].map((i) => <rect key={i} x={140} y={830 + i * 80} width={800} height={60} rx={12} fill="#FFFFFF" stroke={L.line} strokeWidth={3} />)}
            <g opacity={consent} transform="translate(140,1040)">
              <rect width={44} height={44} rx={8} fill="#FFFFFF" stroke={L.ink} strokeWidth={4} />
              {consent > 0.6 && <path d="M10 22 l10 10 l16 -20" stroke={L.good} strokeWidth={6} fill="none" strokeLinecap="round" />}
              <text x={66} y={32} fontFamily="Outfit" fontWeight={800} fontSize={30} fill={L.ink}>Kartımı sakla (onayımla)</text>
            </g>
            <Button x={540} y={1170} s={0.7} label="Siparişi ver" xr={0} />
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>Tek bir tıklamanın</span>
          <span style={{ display: 'block', color: L.accent }}>patentini aldı.</span>
        </Headline>
        <Headline show={lesson}>
          <span>Adım azaldıkça</span>
          <span style={{ display: 'block', color: L.accent }}>satış kolaylaşıyor.</span>
        </Headline>
      </WorldQc>
      <div style={{ position: 'absolute', left: 90, top: 300, fontFamily: 'JetBrains Mono, monospace', fontSize: 34, letterSpacing: 4, color: L.ink, opacity: gir(t, bas(1), 0.4) * (1 - gir(t, an(1, 4), 0.4)) }}>
        1997
      </div>
    </AbsoluteFill>
  );
}
