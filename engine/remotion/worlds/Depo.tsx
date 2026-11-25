// Dünya: "Depodaki video" (Dollar Shave Club lansman videosu, Mart 2012; 4.500 $ maliyet, 48 saatte ~12.000 üye,
// 3 ayda 4,75 milyon izlenme; Unilever 2016, bildirildiğine göre 1 milyar $). Gerçek kişi yok: genel çizgi figür.
// 17.11 kuralı: 0. kare dolu ve hareketli (depo rafları, koliler, kayıt ışığı yanan telefon, konuşan figür).
// Akış: 2012 → fiş 4.500 $, üye sayacı → izlenme ve satış kartı → röntgen: stüdyo ışıkları ↔ tek telefon, tek cümle
// → mağazan: telefonla kendin çek, 45 sn, tek fark + gerçek fiyat.
// Bölümler: 0 kanca, 1 depo, 2 maliyet + üye, 3 izlenme + satış, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { Figure, gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const CARD = '#C9A47A';

function Shelves({ xr }: { xr: number }) {
  return (
    <g>
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <rect x={90} y={620 + r * 200} width={900} height={14} fill={xr > 0.5 ? X.cyan : '#6E6A63'} opacity={xr > 0.5 ? 0.5 : 1} />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} x={110 + i * 126} y={620 + r * 200 - 110 - (i % 2) * 20} width={110} height={110 + (i % 2) * 20} rx={4}
              fill={xr > 0.5 ? 'none' : CARD} stroke={xr > 0.5 ? X.cyan : '#8E6E48'} strokeWidth={3} opacity={xr > 0.5 ? 0.4 : 1} />
          ))}
        </g>
      ))}
    </g>
  );
}

function PhoneCam({ x, y, rec, xr }: { x: number; y: number; rec: number; xr: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M0 40 L-50 220 M0 40 L50 220 M0 40 L0 220" stroke={xr > 0.5 ? X.cyan : L.ink} strokeWidth={7} />
      <rect x={-60} y={-90} width={120} height={150} rx={18} fill="#151515" stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={3} />
      <circle cx={0} cy={-60} r={12} fill="#2A2F36" />
      <circle cx={34} cy={-74} r={8} fill={L.accent} opacity={rec} />
    </g>
  );
}

export function Depo({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 11), 0.6));
  const bg = mix('#EFE7DA', X.bg, xr);
  const rec = Math.sin(t * 6) > 0 ? 1 : 0.2;

  // ---- kanca: depo sahnesi; "milyar dolarlık" ile değer çubuğu yükselir
  const hook = 1 - gir(t, bas(1), 0.4);
  const value = gir(t, an(0, 7), 0.9);
  const sceneO = (1 - gir(t, bas(2), 0.4)) + gir(t, bas(4), 0.5) * (1 - gir(t, bas(6), 0.5));
  // ---- 1: 2012, espri
  const joke = gir(t, an(1, 12), 0.4) * (1 - gir(t, bas(2), 0.3));
  // ---- 2: fiş + üyeler
  const cost = gir(t, bas(2), 0.4) * (1 - gir(t, bas(3), 0.4));
  const members = gir(t, an(2, 6), Math.max(1, an(2, 12) - an(2, 6)));
  // ---- 3: izlenme + satış
  const big = gir(t, bas(3), 0.4) * (1 - gir(t, bas(4), 0.5));
  const sale = gir(t, an(3, 8), 0.5);
  // ---- 5: stüdyo ↔ telefon, tek cümle
  const studio = gir(t, an(5, 0), 0.4) * (1 - gir(t, an(5, 11), 0.4));
  const strike = gir(t, an(5, 1), 0.4);
  const line = gir(t, an(5, 11), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6
  const shop = gir(t, bas(6), 0.8);
  const timer = gir(t, an(6, 4), 0.5);
  const cards = [gir(t, an(6, 6), 0.4), gir(t, an(6, 9), 0.4)];

  const talk = Math.sin(t * 9) > 0 ? 1 : -1;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* depo sahnesi (kanca, 1. bölüm ve röntgen) */}
        {sceneO > 0.01 && shop < 1 && (
          <g opacity={Math.min(1, sceneO) * (1 - studio * 0.6) * (1 - shop)}>
            <Shelves xr={xr} />
            <rect x={90} y={1150} width={900} height={20} fill={xr > 0.5 ? X.cyan : '#8E887E'} opacity={xr > 0.5 ? 0.5 : 1} />
            <Figure x={620} y={1140} s={1.6} c={xr > 0.5 ? X.cyan : L.ink} walk={0.25 + talk * 0.05} face={1} />
            <PhoneCam x={300} y={930} rec={xr > 0.5 ? 0 : rec} xr={xr} />
            {joke > 0 && (
              <g opacity={joke} transform="translate(800,820)">
                <rect x={-120} y={-60} width={240} height={110} rx={24} fill="#FFFFFF" stroke={L.ink} strokeWidth={4} />
                <circle cx={-40} cy={-10} r={8} fill={L.ink} /><circle cx={40} cy={-10} r={8} fill={L.ink} />
                <path d="M-40 14 q40 30 80 0" stroke={L.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
              </g>
            )}
          </g>
        )}
        {/* kanca: milyar dolarlık değer çubuğu */}
        {hook > 0 && value > 0 && (
          <g opacity={hook * value} transform="translate(880,1150)">
            <rect x={-60} y={-560 * value} width={120} height={560 * value} rx={10} fill={L.good} />
            <text y={-560 * value - 20} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={40} fill={L.good}>1 milyar $</text>
          </g>
        )}
        {hook > 0 && <text x={90} y={1230} fontFamily="JetBrains Mono" fontSize={26} letterSpacing={3} fill={L.muted} opacity={value}>BİLDİRİLDİĞİNE GÖRE</text>}
        {t >= bas(1) && t < bas(2) && <text x={90} y={430} fontFamily="JetBrains Mono" fontSize={32} letterSpacing={4} fill={L.ink}>2012</text>}

        {/* 2: maliyet fişi + üye sayacı */}
        {cost > 0 && (
          <g opacity={cost}>
            <g transform="translate(300,760) rotate(-4)">
              <path d="M-150 -200 h300 v380 l-25 20 l-25 -20 l-25 20 l-25 -20 l-25 20 l-25 -20 l-25 20 l-25 -20 l-25 20 l-25 -20 l-25 20 l-25 -20 z" fill="#FFFFFF" stroke={L.ink} strokeWidth={4} />
              <text y={-130} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted}>VİDEO MALİYETİ</text>
              <text y={0} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={72} fill={L.ink}>4.500 $</text>
            </g>
            <g transform="translate(740,640)">
              {Array.from({ length: 48 }, (_, i) => (
                <circle key={i} cx={-180 + (i % 8) * 52} cy={(Math.floor(i / 8)) * 56} r={18} fill={i < Math.round(members * 48) ? L.accent : L.line} />
              ))}
              <text y={390} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={56} fill={L.ink} opacity={members}>~12.000 üye</text>
              <text y={440} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill={L.muted} opacity={members}>48 SAATTE · ŞİRKETE GÖRE</text>
            </g>
          </g>
        )}

        {/* 3: izlenme + satış */}
        {big > 0 && (
          <g opacity={big}>
            <g transform="translate(120,560)">
              <rect width={840} height={170} rx={26} fill={L.ink} />
              <path d="M60 50 l60 35 l-60 35 z" fill="#FFFFFF" />
              <text x={160} y={110} fontFamily="Outfit" fontWeight={800} fontSize={76} fill="#FFFFFF">4,75 milyon</text>
              <text x={160} y={150} fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill="#FFFFFF" opacity={0.7}>İZLENME · İLK 3 AY</text>
            </g>
            <g transform="translate(120,800)" opacity={sale}>
              <rect width={840} height={170} rx={26} fill={L.good} />
              <text x={40} y={110} fontFamily="Outfit" fontWeight={800} fontSize={76} fill="#FFFFFF">1 milyar $</text>
              <text x={40} y={150} fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill="#FFFFFF" opacity={0.85}>2016 · BİLDİRİLDİĞİNE GÖRE</text>
            </g>
          </g>
        )}

        {/* 5: stüdyo ışıkları çizilir; tek telefon */}
        {studio > 0 && (
          <g opacity={studio}>
            {[260, 820].map((x) => (
              <g key={x} transform={`translate(${x},700)`}>
                <path d="M0 0 L-60 300 M0 0 L60 300" stroke={X.cyan} strokeWidth={6} />
                <rect x={-80} y={-90} width={160} height={110} rx={10} fill="none" stroke={X.cyan} strokeWidth={6} />
              </g>
            ))}
            <line x1={150} y1={980} x2={karis(150, 930, strike)} y2={karis(980, 560, strike)} stroke={L.accent} strokeWidth={14} strokeLinecap="round" />
          </g>
        )}
        {line > 0 && (
          <g opacity={line} transform="translate(540,640)">
            <rect x={-380} y={-70} width={760} height={140} rx={30} fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
            <rect x={-320} y={-14} width={640} height={28} rx={14} fill={L.accent} />
            <text y={120} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={3} fill={L.muted}>TEK CÜMLELİK VAAT</text>
          </g>
        )}

        {/* 6: mağazan — kendin çek */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <g transform="translate(300,800)">
              <rect x={-130} y={-250} width={260} height={500} rx={36} fill="#151515" />
              <rect x={-114} y={-232} width={228} height={464} rx={24} fill="#F6E7C8" />
              <Figure x={0} y={180} s={1.1} c={L.ink} face={1} />
              <circle cx={70} cy={-200} r={10} fill={L.accent} opacity={rec} />
            </g>
            {timer > 0 && (
              <g opacity={timer} transform="translate(720,620)">
                <circle r={90} fill="#FFFFFF" stroke={L.line} strokeWidth={14} />
                <circle r={90} fill="none" stroke={L.accent} strokeWidth={14} strokeDasharray={`${2 * Math.PI * 90}`} strokeDashoffset={`${2 * Math.PI * 90 * gir(t, an(6, 4), 5)}`} transform="rotate(-90)" strokeLinecap="round" />
                <text y={16} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={46} fill={L.ink}>45 sn</text>
              </g>
            )}
            {['TEK FARK', 'GERÇEK FİYAT'].map((w, i) => (
              <g key={w} opacity={cards[i]} transform={`translate(720,${860 + i * 150})`}>
                <rect x={-200} y={-50} width={400} height={100} rx={20} fill={L.ink} />
                <text y={14} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700} fontSize={32} letterSpacing={2} fill="#FFFFFF">{w}</text>
              </g>
            ))}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>Depoda bir video.</span>
          <span style={{ display: 'block', color: L.accent }}>Şirket milyar dolarlık.</span>
        </Headline>
        <Headline show={line}>
          <span>Bizden biri gibi</span>
          <span style={{ display: 'block', color: L.accent }}>geliyor.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
