// Dünya: "Ketçap çiz" (Heinz 'Draw Ketchup', Rethink; 18 ülke; 2022 yapay zekâ denemesi). Logo ve etiket deseni yok:
// genel cam ketçap şişesi. 17.11 kuralı: 0. kare dolu ve hareketli (masada kâğıtlar, kalemler şişeyi çiziyor).
// Akış: tek komut kartı (marka adı / şişe / ipucu yok) → 18 ülke → kâğıtların çoğunda aynı şişe → 2022 ekran
// → röntgen: kategori = marka, kalem tutan el → mağazan: takipçiden fotoğraf, izinle paylaş.
// Bölümler: 0 kanca, 1 komut, 2 ülkeler + çizimler, 3 yapay zekâ, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const KETCHUP = '#C62A1E';
const BOTTLE_PATH = 'M-18 -120 h36 v24 q0 14 10 26 q22 26 22 60 v120 q0 16 -16 16 h-88 q-16 0 -16 -16 v-120 q0 -34 22 -60 q10 -12 10 -26 z';

/** Kâğıda çizilen şişe; draw 0–1 çizgi ilerlemesi. other: farklı bir ketçap (kase/paket). */
function Sketch({ x, y, s, draw, other, xr }: { x: number; y: number; s: number; draw: number; other?: boolean; xr: number }) {
  const ink = xr > 0.5 ? X.cyan : KETCHUP;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-90} y={-150} width={180} height={230} rx={8} fill={xr > 0.5 ? 'none' : '#FFFFFF'} stroke={xr > 0.5 ? X.cyan : L.line} strokeWidth={3} />
      {other ? (
        <path d="M-50 20 q50 50 100 0 z M-50 20 h100" stroke={ink} strokeWidth={6} fill="none" strokeDasharray="300" strokeDashoffset={300 * (1 - draw)} strokeLinecap="round" />
      ) : (
        <g transform="scale(0.55) translate(0,-20)">
          <path d={BOTTLE_PATH} fill={draw > 0.95 && xr < 0.5 ? KETCHUP : 'none'} fillOpacity={0.85} stroke={ink} strokeWidth={9} strokeDasharray="700" strokeDashoffset={700 * (1 - draw)} strokeLinejoin="round" />
          {draw > 0.95 && <rect x={-34} y={10} width={68} height={50} rx={6} fill={xr > 0.5 ? 'none' : '#FFFFFF'} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={3} />}
        </g>
      )}
    </g>
  );
}

function Pencil({ x, y, a }: { x: number; y: number; a: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${a})`}>
      <rect x={-8} y={-110} width={16} height={100} fill="#F2C14E" stroke={L.ink} strokeWidth={3} />
      <path d="M-8 -10 L0 12 L8 -10 z" fill="#E9D6AE" stroke={L.ink} strokeWidth={3} />
      <path d="M-3 4 L0 12 L3 4 z" fill={L.ink} />
    </g>
  );
}

const SHEETS = Array.from({ length: 12 }, (_, i) => ({ x: 210 + (i % 4) * 220, y: 620 + Math.floor(i / 4) * 250, other: i === 5 || i === 10 }));

export function Cizim({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 8), 0.6));
  const bg = mix('#E9DDCB', X.bg, xr);

  // ---- kanca: masada 4 kâğıt, kalemler çiziyor (döngü değil, kanca boyunca ilerler)
  const hook = 1 - gir(t, bas(1), 0.4);
  const hookDraw = (i: number) => Math.min(1, Math.max(0, (t - i * 0.25) / 2.6));
  // ---- 1: komut kartı
  const card = gir(t, bas(1), 0.4) * (1 - gir(t, bas(2), 0.4));
  const nope = [gir(t, an(1, 0), 0.3), gir(t, an(1, 3), 0.3), gir(t, an(1, 5), 0.3)];
  // ---- 2: 18 ülke, sonra çizimler
  const pins = gir(t, bas(2), 0.4) * (1 - gir(t, an(2, 5), 0.4));
  const pinsOn = gir(t, an(2, 0), 1.0);
  const sheets = gir(t, an(2, 5), 0.4) * (1 - gir(t, bas(3), 0.4));
  // ---- 3: yapay zekâ
  const ai = gir(t, bas(3), 0.4) * (1 - gir(t, bas(4), 0.5));
  const gen = gir(t, an(3, 6), 1.4);
  // ---- 5: kategori = marka; el
  const venn = gir(t, bas(4) + 0.3, 0.5) * (1 - gir(t, an(5, 8), 0.4));
  const merge = gir(t, an(5, 2), 0.9);
  const hand = gir(t, an(5, 8), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6
  const shop = gir(t, bas(6), 0.8);
  const ask = gir(t, an(6, 1), 0.5);
  const photos = gir(t, an(6, 6), 1.0);
  const consent = gir(t, an(6, 11), 0.4);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* kanca: masa, kâğıtlar, çizen kalemler */}
        {hook > 0 && (
          <g opacity={hook}>
            <rect x={60} y={460} width={960} height={820} rx={30} fill="#B08A5A" />
            {[0, 1, 2, 3].map((i) => {
              const x = 300 + (i % 2) * 480, y = 700 + Math.floor(i / 2) * 380;
              const d = hookDraw(i);
              return (
                <g key={i}>
                  <g transform={`rotate(${[-4, 3, 2, -3][i]} ${x} ${y})`}><Sketch x={x} y={y} s={1.5} draw={d} xr={xr} /></g>
                  {d < 1 && <Pencil x={x + Math.sin(d * 20) * 30} y={y - 60 + d * 90} a={25} />}
                </g>
              );
            })}
          </g>
        )}

        {/* 1: komut kartı */}
        {card > 0 && (
          <g opacity={card}>
            <rect x={190} y={500} width={700} height={300} rx={26} fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
            <text x={540} y={680} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={88} fill={L.ink}>"Ketçap çiz."</text>
            {['MARKA ADI', 'ŞİŞE', 'İPUCU'].map((w, i) => (
              <g key={w} opacity={nope[i]} transform={`translate(${250 + i * 290},960)`}>
                <rect x={-120} y={-50} width={240} height={100} rx={18} fill="#FFFFFF" stroke={L.line} strokeWidth={4} />
                <text y={14} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={28} letterSpacing={2} fill={L.muted}>{w}</text>
                <line x1={-130} y1={0} x2={130} y2={0} stroke={L.accent} strokeWidth={8} />
              </g>
            ))}
          </g>
        )}

        {/* 2: 18 ülke */}
        {pins > 0 && (
          <g opacity={pins}>
            {Array.from({ length: 18 }, (_, i) => {
              const x = 180 + ((i * 197) % 720), y = 560 + ((i * 131) % 520);
              return (
                <g key={i} transform={`translate(${x},${y}) scale(${gir(t, an(2, 0) + i * 0.05, 0.25)})`}>
                  <path d="M0 0 c-24 -32 -24 -64 0 -64 c24 0 24 32 0 64 z" fill={KETCHUP} />
                  <circle cy={-40} r={9} fill="#FFFFFF" />
                </g>
              );
            })}
            <text x={540} y={1240} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={80} fill={L.ink} opacity={pinsOn}>18 ülke</text>
          </g>
        )}
        {/* 2: çoğu aynı şişeyi çizdi */}
        {sheets > 0 && (
          <g opacity={sheets}>
            {SHEETS.map((p, i) => <Sketch key={i} x={p.x} y={p.y} s={0.95} draw={gir(t, an(2, 6) + i * 0.08, 0.7)} other={p.other} xr={xr} />)}
          </g>
        )}

        {/* 3: 2022, yapay zekâ */}
        {ai > 0 && (
          <g opacity={ai}>
            <rect x={140} y={480} width={800} height={700} rx={30} fill="#151515" />
            <rect x={180} y={520} width={720} height={90} rx={16} fill="#2A2F36" />
            <text x={210} y={578} fontFamily="JetBrains Mono" fontSize={32} fill="#FFFFFF">ketçap_</text>
            <rect x={300} y={660} width={480} height={480} rx={16} fill="#2A2F36" />
            <g opacity={gen} transform="translate(540,900) scale(1.4)">
              <path d={BOTTLE_PATH} fill={KETCHUP} />
              <rect x={-34} y={10} width={68} height={50} rx={6} fill="#FFFFFF" />
            </g>
            <text x={160} y={450} fontFamily="JetBrains Mono" fontSize={34} letterSpacing={4} fill={L.ink}>2022 · YAPAY ZEKÂ</text>
          </g>
        )}

        {/* 5: röntgen — kategori ile marka üst üste biner */}
        {venn > 0 && (
          <g opacity={venn} fill="none" stroke={X.cyan} strokeWidth={6}>
            <circle cx={karis(380, 540, merge)} cy={840} r={220} />
            <circle cx={karis(700, 540, merge)} cy={840} r={220} />
            <text x={karis(380, 540, merge)} y={karis(840, 760, merge)} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={34} letterSpacing={3} fill={X.cyan} stroke="none">KATEGORİ</text>
            <text x={karis(700, 540, merge)} y={karis(840, 930, merge)} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={34} letterSpacing={3} fill={X.cyan} stroke="none">MARKA</text>
          </g>
        )}
        {/* ders: kalem tutan el, kâğıtta şişe */}
        {hand > 0 && (
          <g opacity={hand}>
            <Sketch x={540} y={880} s={2.2} draw={1} xr={0} />
            <path d="M780 1180 q-60 -120 -120 -170" stroke="#E9B99A" strokeWidth={70} strokeLinecap="round" fill="none" />
            <Pencil x={660} y={1010} a={35} />
          </g>
        )}

        {/* 6: mağazan — takipçiden fotoğraf, izinle paylaş */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <g opacity={ask} transform="translate(540,560)">
              <rect x={-380} y={-60} width={760} height={120} rx={24} fill={L.ink} />
              <text y={16} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={38} fill="#FFFFFF">"Bu kelimeyi duyunca ne geliyor?"</text>
            </g>
            {Array.from({ length: 6 }, (_, i) => (
              <rect key={i} x={170 + (i % 3) * 250} y={680 + Math.floor(i / 3) * 210} width={220} height={180} rx={16}
                fill={['#F6E7C8', '#E7EEF5', '#F2D7C9', '#E8F0E3', '#E9E4F2', '#F6E7C8'][i]} stroke={L.line} strokeWidth={3} opacity={gir(t, an(6, 6) + i * 0.1, 0.3) * (photos > 0 ? 1 : 0)} />
            ))}
            <g opacity={consent} transform="translate(170,1150)">
              <rect width={44} height={44} rx={8} fill="#FFFFFF" stroke={L.ink} strokeWidth={4} />
              <path d="M8 22 l10 10 l18 -20" stroke={L.good} strokeWidth={6} fill="none" strokeLinecap="round" />
              <text x={66} y={34} fontFamily="Outfit" fontWeight={800} fontSize={32} fill={L.ink}>Paylaşım izni alındı</text>
            </g>
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>"Ketçap çiz" dedi.</span>
          <span style={{ display: 'block', color: KETCHUP }}>Herkes Heinz çizdi.</span>
        </Headline>
        <Headline show={hand}>
          <span>Reklamı müşterinin</span>
          <span style={{ display: 'block', color: KETCHUP }}>eli yaptı.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
