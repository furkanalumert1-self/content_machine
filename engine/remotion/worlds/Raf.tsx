// Dünya: "Az ürünlü raf" (BİM 2024 Entegre Faaliyet Raporu: ~900 ürün, %80 temel ihtiyaç, her gün düşük fiyat, haftalık aktüel, 13.583 mağaza).
// Tek dünya: bir market rafı. Kanca: sade raf → dev market: tıka basa raf, aynı şeyin yirmi markası, kararsız müşteri →
// raf boşalır, ~900 ürün → kart ve indirim etiketi çizilir, düz fiyat; reyon sonunda aktüel masası → röntgen: el hızlı uzanır,
// haftalar, mağazalar çoğalır → mağazan: 12 ürünlük seçki ve haftanın ürünü.
// Bölümler: 0 kanca, 1 dev market, 2 900 ürün + %80, 3 fiyat + aktüel, 4 röntgen, 5 açıklama, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { Figure, gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const COLORS = ['#E8402A', '#2E5E8C', '#F2C14E', '#2E9E5B', '#8C5E9E', '#E7884A', '#5FA8C8', '#C94A6E'];
const SX = 110, SW = 860, ROWS = [620, 780, 940, 1100]; // raf satırlarının alt çizgisi

/** Raftaki ürünler: dense (0 sade, 1 tıka basa). Sade rafta her satırda 5 geniş ürün. */
function Items({ dense, xr, t, keep }: { dense: number; xr: number; t: number; keep: number }) {
  const out: React.ReactNode[] = [];
  ROWS.forEach((ry, r) => {
    const n = Math.round(karis(5, 20, dense));
    const w = SW / n;
    for (let i = 0; i < n; i++) {
      const c = COLORS[(i * 3 + r * 5) % COLORS.length];
      const h = 104 + ((i * 37 + r * 11) % 4) * 10;
      const fade = n > 5 && i % 4 !== 0 ? keep : 1; // boşalırken çoğu kaybolur
      out.push(
        <rect key={`${r}-${i}`} x={SX + i * w + 4} y={ry - h} width={w - 8} height={h} rx={6}
          fill={xr > 0.5 ? 'none' : c} stroke={xr > 0.5 ? X.cyan : '#00000033'} strokeWidth={2} opacity={fade} />,
      );
    }
  });
  void t;
  return <>{out}</>;
}

export function Raf({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 10), 0.6));
  const bg = mix(L.bg, X.bg, xr);
  const ink = mix(L.ink, X.cyan, xr);

  // ---- raf yoğunluğu: kancada sade; "on binlerce" ile tıka basa; "900 ürün" ile boşalır
  const dense = gir(t, an(1, 4), 0.9) * (1 - gir(t, an(2, 6), 0.9));
  const keep = 1 - gir(t, an(2, 6), 0.9);
  // ---- "aynı şeyin yirmi markası": bir satır vurgulanır; kararsız müşteri
  const twenty = gir(t, an(1, 7), 0.4) * (1 - gir(t, bas(2), 0.4));
  const lost = gir(t, an(1, 11), 0.4) * (1 - gir(t, bas(2), 0.4));
  // ---- %80
  const home = gir(t, an(2, 9), 0.5) * (1 - gir(t, bas(3), 0.4));
  const eighty = gir(t, an(2, 14), 0.8);
  // ---- 3: kart ve indirim çizilir; düz fiyat; aktüel masası
  const cards = gir(t, bas(3), 0.4) * (1 - gir(t, an(3, 7), 0.5));
  const strike = gir(t, an(3, 6), 0.4);
  const flat = gir(t, an(3, 7), 0.5) * (1 - gir(t, bas(4), 0.4));
  const aktuel = gir(t, an(3, 11), 0.6) * (1 - gir(t, an(5, 10), 0.5));
  // ---- 5: el hızlı uzanır; haftalar; mağazalar
  const grab = gir(t, an(5, 1), 0.5) * (1 - gir(t, an(5, 4), 0.4));
  const weeks = gir(t, an(5, 4), 0.4) * (1 - gir(t, an(5, 10), 0.4));
  const stores = gir(t, an(5, 10), 0.4) * (1 - gir(t, bas(6), 0.5));
  const lesson = gir(t, an(5, 0), 0.4) * (1 - gir(t, an(5, 4), 0.4));
  // ---- 6
  const shop = gir(t, bas(6), 0.8);
  const twelve = gir(t, an(6, 5), 0.8);
  const weekly = gir(t, an(6, 12), 0.5);

  const shelfO = (1 - shop) * (1 - stores) * (1 - weeks * 0.85);
  const shopperX = 540 + Math.sin(t * 3.2) * 70 * lost;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {shelfO > 0 && (
          <g opacity={shelfO}>
            {/* raf iskeleti */}
            <rect x={SX - 20} y={450} width={SW + 40} height={676} rx={14} fill={xr > 0.5 ? 'none' : '#F7F6F3'} stroke={ink} strokeWidth={5} />
            {ROWS.map((y) => <rect key={y} x={SX - 20} y={y} width={SW + 40} height={14} fill={xr > 0.5 ? X.cyan : '#B9B3A8'} />)}
            <Items dense={dense} xr={xr} t={t} keep={keep} />
            {/* aynı şeyin yirmi markası: 2. satır vurgusu */}
            {twenty > 0 && <rect x={SX - 26} y={ROWS[1] - 146} width={SW + 52} height={160} rx={12} fill="none" stroke={L.accent} strokeWidth={8} opacity={twenty} />}
            {twenty > 0 && <text x={540} y={ROWS[1] - 158} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={30} letterSpacing={3} fill={L.accent} opacity={twenty}>AYNI ŞEY · 20 MARKA</text>}
            {/* düz fiyat etiketleri */}
            {flat > 0 && ROWS.map((y, r) => [0, 1, 2, 3, 4].map((i) => (
              <rect key={`${r}${i}`} x={SX + i * (SW / 5) + 40} y={y + 16} width={SW / 5 - 80} height={30} rx={6} fill="#FFFFFF" stroke={L.ink} strokeWidth={3} opacity={flat} />
            )))}
          </g>
        )}

        {/* kararsız müşteri */}
        {lost > 0 && (
          <g opacity={lost * shelfO}>
            <Figure x={shopperX} y={1290} s={1.4} c={L.ink} face={-1} />
            {[0, 1, 2].map((k) => (
              <text key={k} x={shopperX + (k - 1) * 90} y={1030 - (k % 2) * 40} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={70} fill={L.accent}
                opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 2 + k))}>?</text>
            ))}
          </g>
        )}

        {/* %80: ev ve ihtiyaç çubuğu */}
        {home > 0 && (
          <g opacity={home} transform="translate(540,1230)">
            <path d="M-300 20 v-80 l60 -50 l60 50 v80 z" fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
            <rect x={-200} y={-30} width={500} height={50} rx={12} fill={L.line} />
            <rect x={-200} y={-30} width={500 * 0.8 * eighty} height={50} rx={12} fill={L.good} />
            <text x={300} y={-46} textAnchor="end" fontFamily="Outfit" fontWeight={800} fontSize={44} fill={L.good}>%80</text>
          </g>
        )}

        {/* 3: sadakat kartı + indirim etiketi çizilir */}
        {cards > 0 && (
          <g opacity={cards} transform="translate(540,1215)" >
            <g transform="translate(-170,0) rotate(-6)">
              <rect x={-140} y={-80} width={280} height={160} rx={18} fill={L.ink} />
              <rect x={-110} y={-50} width={120} height={18} rx={9} fill="#FFFFFF" opacity={0.6} />
              <circle cx={90} cy={40} r={22} fill={L.accent} />
            </g>
            <g transform="translate(190,0) rotate(8)">
              <path d="M-120 -60 h200 l50 60 l-50 60 h-200 z" fill={L.accent} />
              <circle cx={-90} cy={0} r={12} fill="#FFFFFF" />
            </g>
            <line x1={-360} y1={90} x2={karis(-360, 360, strike)} y2={karis(90, -90, strike)} stroke={L.ink} strokeWidth={14} strokeLinecap="round" />
          </g>
        )}

        {/* aktüel masası (reyon sonu) */}
        {aktuel > 0 && (
          <g opacity={aktuel * (1 - stores)} transform="translate(540,1262)">
            <rect x={-300} y={-60} width={600} height={60} rx={10} fill={xr > 0.5 ? 'none' : '#F2C14E'} stroke={ink} strokeWidth={5} />
            {[-200, -60, 80, 200].map((x, i) => <rect key={x} x={x - 45} y={-150} width={90} height={90} rx={10} fill={xr > 0.5 ? 'none' : COLORS[i + 2]} stroke={ink} strokeWidth={3} />)}
            <text y={44} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={3} fill={ink}>HER HAFTA · SINIRLI</text>
          </g>
        )}

        {/* 5: el hızlı uzanır (az seçenek → hızlı karar) */}
        {grab > 0 && (
          <g opacity={grab}>
            <path d={`M1100 ${ROWS[2] - 60} L${karis(1100, 640, grab)} ${ROWS[2] - 60}`} stroke={X.cyan} strokeWidth={38} strokeLinecap="round" />
            <circle cx={karis(1100, 630, grab)} cy={ROWS[2] - 60} r={34} fill={X.cyan} />
          </g>
        )}
        {/* haftalar: her hafta bir ziyaret */}
        {weeks > 0 && (
          <g opacity={weeks} transform="translate(540,780)">
            {Array.from({ length: 8 }, (_, i) => (
              <g key={i} transform={`translate(${-385 + i * 110},0)`} opacity={gir(t, an(5, 4) + i * 0.18, 0.25)}>
                <rect x={-45} y={-60} width={90} height={120} rx={12} fill="none" stroke={X.cyan} strokeWidth={4} />
                <circle cy={10} r={18} fill={X.cyan} />
              </g>
            ))}
          </g>
        )}
        {/* 13.583 mağaza */}
        {stores > 0 && (
          <g opacity={stores}>
            {Array.from({ length: 96 }, (_, i) => (
              <rect key={i} x={150 + (i % 12) * 66} y={520 + Math.floor(i / 12) * 66} width={40} height={40} rx={6} fill={L.accent}
                opacity={gir(t, an(5, 10) + i * 0.012, 0.2)} />
            ))}
            <text x={540} y={1150} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={96} fill={L.ink}>13.583</text>
            <text x={540} y={1210} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={28} letterSpacing={3} fill={L.muted}>MAĞAZA · 2024 SONU</text>
          </g>
        )}

        {/* 6: mağazan — 12 ürünlük seçki, haftanın ürünü */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect width={1080} height={1920} fill={L.bg} />
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <text x={140} y={520} fontFamily="Outfit" fontWeight={800} fontSize={40} fill={L.ink}>En çok tercih edilen</text>
            {Array.from({ length: 12 }, (_, i) => {
              const hw = weekly > 0 && i === 5;
              return (
                <g key={i} transform={`translate(${200 + (i % 4) * 225},${640 + Math.floor(i / 4) * 200})`} opacity={gir(t, an(6, 5) + i * 0.06, 0.3) * (twelve > 0 ? 1 : 0)}>
                  <rect x={-85} y={-80} width={170} height={160} rx={16} fill="#FFFFFF" stroke={hw ? L.accent : L.line} strokeWidth={hw ? 8 : 3} />
                  <rect x={-45} y={-55} width={90} height={80} rx={10} fill={COLORS[i % COLORS.length]} />
                  <rect x={-55} y={40} width={110} height={14} rx={7} fill={L.line} />
                </g>
              );
            })}
            {weekly > 0 && (
              <g opacity={weekly} transform="translate(650,800) rotate(-6)">
                <rect x={-150} y={-30} width={300} height={60} rx={30} fill={L.accent} />
                <text y={11} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={30} fill="#FFFFFF">Haftanın ürünü</text>
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={1 - gir(t, bas(1), 0.4)}>
          <span>Dev market,</span>
          <span style={{ display: 'block', color: L.accent }}>bilerek az ürün.</span>
        </Headline>
        <Headline show={lesson}>
          <span style={{ color: X.cyan }}>Az seçenek</span>
          <span style={{ display: 'block', color: L.accent }}>kararı hızlandırıyor.</span>
        </Headline>
      </WorldQc>
      {/* ~900 ürün etiketi */}
      <div style={{ position: 'absolute', left: 90, top: 1150, fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 60, color: L.ink, opacity: gir(t, an(2, 7), 0.4) * (1 - gir(t, an(2, 9), 0.4)) }}>
        ~900 ürün
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 400, fontSize: 26, letterSpacing: 3, color: L.muted }}>BİM'İN KENDİ RAPORUNA GÖRE</div>
      </div>
    </AbsoluteFill>
  );
}
