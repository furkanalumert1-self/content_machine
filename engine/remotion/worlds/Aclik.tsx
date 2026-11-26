// Dünya: "Açken sen değilsin" (Snickers, 2010 Super Bowl; IPA Effectiveness Awards 2012 vaka çalışması: ilk yıl satış %15,9,
// 58 pazarın 56'sında pay). Gerçek kişi ve logo yok: genel figürler ve kahverengi ambalajlı genel çikolata.
// 17.11/25.11 kuralı: 0. kare dolu ve hareketli, ürün görünür (fırtına bulutlu huysuz figür, elinde çikolata, boşalan açlık göstergesi).
// Akış: saha → figür "başka biri" olur (yaşlı figür) → ısırık, kendine gelir, "Açken sen değilsin." → %15,9 ve 56/58
// → röntgen: fıstık/karamel çizilir, "an" sahiplenilir → mağazan: özellik listesi yerine tek bir anla başlayan açıklama.
// Bölümler: 0 kanca, 1 maç, 2 ısırık, 3 sonuç, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { Figure, gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const WRAP = '#4A2C1D';

function Bar({ x, y, s, bitten, xr }: { x: number; y: number; s: number; bitten: number; xr: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(-12)`}>
      <rect x={-130} y={-34} width={260} height={68} rx={10} fill={xr > 0.5 ? 'none' : WRAP} stroke={xr > 0.5 ? X.cyan : '#00000050'} strokeWidth={3} />
      <rect x={-80} y={-20} width={160} height={40} rx={8} fill={xr > 0.5 ? 'none' : '#F2C14E'} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />
      {bitten > 0 && <circle cx={130} cy={0} r={40 * bitten} fill={xr > 0.5 ? X.bg : L.bg} />}
    </g>
  );
}

function Cloud({ x, y, o, t }: { x: number; y: number; o: number; t: number }) {
  if (o <= 0) return null;
  return (
    <g transform={`translate(${x},${y})`} opacity={o}>
      <ellipse cx={0} cy={0} rx={110} ry={46} fill="#4B5560" />
      <ellipse cx={-50} cy={-26} rx={60} ry={40} fill="#4B5560" />
      <ellipse cx={40} cy={-34} rx={66} ry={46} fill="#4B5560" />
      <path d={`M-10 40 l-20 50 h26 l-16 50`} stroke="#F2C14E" strokeWidth={8} fill="none" strokeLinejoin="round" opacity={Math.sin(t * 8) > 0.3 ? 1 : 0.2} />
    </g>
  );
}

/** Yaşlı figür: topuz saç ve baston. */
function Elder({ x, y, s, c }: { x: number; y: number; s: number; c: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <Figure x={0} y={0} s={s} c={c} face={-1} />
      <circle cx={0} cy={-190 * s} r={18 * s} fill="#D9D6CF" />
      <path d={`M${40 * s} ${-60 * s} L${50 * s} ${10 * s}`} stroke="#8E6E48" strokeWidth={8} strokeLinecap="round" />
    </g>
  );
}

export function Aclik({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 4), 0.6));
  const bg = mix(L.bg, X.bg, xr);
  const ink = mix(L.ink, X.cyan, xr);

  // ---- kanca: huysuz figür, bulut, açlık göstergesi boşalır
  const hook = 1 - gir(t, bas(1), 0.4);
  const meter = 1 - gir(t, an(0, 3), 1.2) * 0.85;
  // ---- 1: saha; genç → yaşlı
  const field = gir(t, bas(1), 0.4) * (1 - gir(t, bas(3), 0.4));
  const swap = gir(t, an(1, 13), 0.5) * (1 - gir(t, an(2, 1), 0.4));
  // ---- 2: ısırık, kendine gelir, mesaj
  const bite = gir(t, an(2, 1), 0.4);
  const msg = gir(t, an(2, 7), 0.4);
  // ---- 3: sonuçlar
  const res = gir(t, bas(3), 0.4) * (1 - gir(t, bas(4), 0.5));
  const pct = gir(t, bas(3) + 0.1, 0.5);
  const map = gir(t, an(3, 9), 1.0);
  // ---- 5: içerik çizilir, an sahiplenilir
  const ingr = gir(t, bas(4) + 0.3, 0.4) * (1 - gir(t, an(5, 4), 0.4));
  const strike = gir(t, an(5, 2), 0.4);
  const moment = gir(t, an(5, 4), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6
  const shop = gir(t, bas(6), 0.8);
  const list = gir(t, an(6, 2), 0.4);
  const momentCard = gir(t, an(6, 5), 0.5);

  const grumpy = Math.sin(t * 14) * 3;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* kanca: huysuz figür + çikolata + açlık göstergesi */}
        {hook > 0 && (
          <g opacity={hook}>
            <rect x={90} y={1150} width={900} height={20} fill="#B9B3A8" />
            <g transform={`translate(${grumpy},0)`}><Figure x={420} y={1140} s={2.2} c={L.ink} face={-1} /></g>
            <Cloud x={420} y={640} o={1} t={t} />
            <Bar x={700} y={940} s={1.3} bitten={0} xr={xr} />
            <g transform="translate(760,620)">
              <text y={-30} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted}>TOKLUK</text>
              <rect x={-150} y={0} width={300} height={44} rx={12} fill={L.line} />
              <rect x={-150} y={0} width={300 * meter} height={44} rx={12} fill={meter < 0.4 ? L.accent : L.good} />
            </g>
          </g>
        )}

        {/* 1–2: saha, figür değişir, ısırık */}
        {field > 0 && (
          <g opacity={field}>
            <rect x={90} y={460} width={900} height={760} rx={30} fill="#3E8E4E" />
            {[0, 1, 2, 3].map((i) => <rect key={i} x={90 + i * 225} y={460} width={112} height={760} fill="#368045" />)}
            <rect x={150} y={520} width={780} height={640} fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.6} />
            <g opacity={1 - swap}>
              <Figure x={540} y={1100} s={2.3} c={L.ink} face={bite > 0.5 ? 1 : -1} />
            </g>
            {swap > 0 && <g opacity={swap}><Elder x={540} y={1100} s={2.3} c="#5A5A5A" /></g>}
            {t >= bas(2) && <Bar x={740} y={880} s={1.1} bitten={bite} xr={xr} />}
            {msg > 0 && (
              <g opacity={msg} transform="translate(540,600)">
                <rect x={-330} y={-60} width={660} height={120} rx={24} fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
                <text y={16} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={48} fill={L.ink}>Açken sen değilsin.</text>
              </g>
            )}
            {t < bas(2) && <text x={150} y={560} fontFamily="JetBrains Mono" fontSize={30} letterSpacing={3} fill="#FFFFFF">2010 · SUPER BOWL</text>}
          </g>
        )}

        {/* 3: sonuç (ödül vaka çalışmasına göre) */}
        {res > 0 && (
          <g opacity={res}>
            <g transform="translate(120,520)" opacity={pct}>
              <rect width={840} height={160} rx={26} fill={WRAP} />
              <text x={40} y={100} fontFamily="Outfit" fontWeight={800} fontSize={80} fill="#FFFFFF">%15,9</text>
              <text x={330} y={92} fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill="#FFFFFF" opacity={0.8}>SATIŞ · İLK YIL</text>
            </g>
            {Array.from({ length: 58 }, (_, i) => (
              <rect key={i} x={150 + (i % 10) * 80} y={760 + Math.floor(i / 10) * 64} width={64} height={50} rx={8}
                fill={i < 56 && gir(t, an(3, 9) + i * 0.015, 0.2) > 0.5 ? '#F2C14E' : L.line} opacity={map > 0 ? 1 : 0.3} />
            ))}
            <text x={540} y={1180} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={44} fill={L.ink} opacity={map}>58 pazarın 56'sında pay</text>
            <text x={540} y={1230} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill={L.muted} opacity={map}>ÖDÜL VAKA ÇALIŞMASINA GÖRE</text>
          </g>
        )}

        {/* 5: röntgen — içerik etiketleri çizilir */}
        {ingr > 0 && (
          <g opacity={ingr}>
            <Bar x={540} y={760} s={1.6} bitten={0} xr={xr} />
            {['FISTIK', 'KARAMEL'].map((w, i) => (
              <g key={w} transform={`translate(${330 + i * 420},1020)`}>
                <rect x={-150} y={-46} width={300} height={92} rx={18} fill="none" stroke={X.cyan} strokeWidth={5} />
                <text y={14} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700} fontSize={34} letterSpacing={3} fill={X.cyan}>{w}</text>
                <line x1={-170} x2={karis(-170, 170, strike)} y1={0} y2={0} stroke={L.accent} strokeWidth={10} />
              </g>
            ))}
          </g>
        )}
        {moment > 0 && (
          <g opacity={moment}>
            <Cloud x={400} y={760} o={1} t={t} />
            <Figure x={400} y={1150} s={2} c={ink} face={-1} />
            <g transform="translate(760,900)">
              <circle r={120} fill="#FFFFFF" stroke={L.ink} strokeWidth={8} />
              <path d="M0 0 L0 -80 M0 0 L60 30" stroke={L.accent} strokeWidth={10} strokeLinecap="round" />
            </g>
          </g>
        )}

        {/* 6: mağazan — tek bir anla başlayan ürün açıklaması */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <text x={140} y={520} fontFamily="Outfit" fontWeight={800} fontSize={38} fill={L.ink}>Ürün açıklaması</text>
            <g opacity={list} transform="translate(140,560)">
              {[0, 1, 2, 3].map((i) => (
                <g key={i} transform={`translate(0,${i * 50})`}>
                  <circle cx={10} cy={14} r={7} fill={L.muted} />
                  <rect x={30} y={4} width={[420, 360, 400, 300][i]} height={20} rx={10} fill={L.line} />
                </g>
              ))}
              <line x1={-10} y1={100} x2={karis(-10, 480, momentCard)} y2={100} stroke={L.accent} strokeWidth={10} />
            </g>
            {momentCard > 0 && (
              <g opacity={momentCard} transform="translate(540,1000)">
                <rect x={-400} y={-140} width={800} height={280} rx={24} fill={L.ink} />
                <text x={-360} y={-60} fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill="#FFFFFF" opacity={0.7}>İLK CÜMLE</text>
                <text x={-360} y={10} fontFamily="Outfit" fontWeight={800} fontSize={44} fill="#FFFFFF">Müşterinin yaşadığı</text>
                <text x={-360} y={70} fontFamily="Outfit" fontWeight={800} fontSize={44} fill={L.accent}>tek bir an.</text>
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>Çikolata değil,</span>
          <span style={{ display: 'block', color: L.accent }}>açlık sattı.</span>
        </Headline>
        <Headline show={moment}>
          <span style={{ color: xr > 0.5 ? X.cyan : L.ink }}>Herkesin bildiği</span>
          <span style={{ display: 'block', color: L.accent }}>bir anı sahiplendi.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
