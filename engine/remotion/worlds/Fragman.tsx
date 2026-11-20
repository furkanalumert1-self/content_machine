// Dünya: "Fragman sızdı" (GTA VI ilk fragmanı, Aralık 2023; TechCrunch, Guinness, YouTube; oyun 19.11.2026'da çıktı, CBS).
// Logo ve oyun görüntüsü yok: genel neon gün batımı şehri çizilir. 17.11 kuralı: 0. kare dolu ve hareketli
// (neon şehir, telefonlarda yayılan "SIZDI" kartları). Akış: takvim (salı sabahı ↔ bir gün önce) → sızıntı ağı → resmi oynatıcı
// "Gerçeğini izleyin" → sayaç 90 milyon+ ↔ 59,4 milyon → 19 Kasım → röntgen: merak oklarının resmi kaynağa akışı
// → mağazan: erken yayılan görsel, resmi duyuru, onaylı bekleme listesi.
// Bölümler: 0 kanca, 1 sızıntı, 2 resmi yayın, 3 rekor, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const PINK = '#FF4F9A';
const TEAL = '#33E1D0';
const SKY1 = '#2A1446';
const SKY2 = '#FF7A59';

function City({ t, xr, glow }: { t: number; xr: number; glow: number }) {
  const ink = xr > 0.5 ? X.cyan : '#120A22';
  return (
    <g>
      <defs>
        <linearGradient id="gunbatimi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={xr > 0.5 ? X.bg : SKY1} />
          <stop offset="1" stopColor={xr > 0.5 ? X.bg : SKY2} />
        </linearGradient>
      </defs>
      <rect x={0} y={380} width={1080} height={900} fill="url(#gunbatimi)" />
      <circle cx={540} cy={1000} r={230} fill={xr > 0.5 ? 'none' : '#FFC86B'} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={3} opacity={0.9} />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={300} y={940 + i * 34} width={480} height={10 + i * 3} fill={xr > 0.5 ? 'none' : SKY2} opacity={0.8} />)}
      {[[90, 260], [190, 380], [300, 300], [700, 420], [820, 320], [930, 240]].map(([x, h], i) => (
        <g key={i}>
          <rect x={x} y={1180 - h} width={110} height={h} fill={xr > 0.5 ? 'none' : ink} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={3} strokeOpacity={0.5} />
          {Array.from({ length: Math.floor(h / 50) }, (_, k) => (
            <rect key={k} x={x + 20 + (k % 2) * 40} y={1180 - h + 20 + k * 44} width={24} height={14} fill={k % 3 === 0 ? PINK : TEAL} opacity={(0.4 + 0.6 * ((Math.sin(t * 2 + i + k) + 1) / 2)) * glow} />
          ))}
        </g>
      ))}
      {/* palmiyeler */}
      {[160, 900].map((x, i) => (
        <g key={x} transform={`translate(${x},1180) rotate(${Math.sin(t * 1.2 + i) * 2})`}>
          <path d="M0 0 q-10 -160 10 -300" stroke={ink} strokeWidth={14} fill="none" opacity={xr > 0.5 ? 0.4 : 1} />
          {[-60, -20, 20, 60, 100].map((a, k) => <path key={k} d={`M10 -300 q${Math.cos(a / 57) * 90} ${-40 + Math.sin(a / 57) * 30} ${Math.cos(a / 57) * 150} ${30 + Math.sin(a / 57) * 60}`} stroke={ink} strokeWidth={12} fill="none" opacity={xr > 0.5 ? 0.4 : 1} />)}
        </g>
      ))}
      <rect x={0} y={1180} width={1080} height={100} fill={xr > 0.5 ? 'none' : '#120A22'} />
    </g>
  );
}

function LeakCard({ x, y, s, o, xr }: { x: number; y: number; s: number; o: number; xr: number }) {
  if (o <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <rect x={-90} y={-130} width={180} height={260} rx={22} fill="#151515" stroke={xr > 0.5 ? X.cyan : '#3A3A3A'} strokeWidth={4} />
      <rect x={-76} y={-100} width={152} height={100} rx={8} fill={xr > 0.5 ? 'none' : SKY2} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />
      <path d="M-14 -70 L18 -50 L-14 -30 z" fill="#FFFFFF" opacity={0.7} />
      <rect x={-70} y={20} width={140} height={40} rx={8} fill={L.accent} />
      <text y={48} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={26} fill="#FFFFFF">SIZDI</text>
      <rect x={-70} y={74} width={110} height={10} rx={5} fill="#5A5A5A" />
    </g>
  );
}

const CARDS = Array.from({ length: 9 }, (_, i) => ({ x: 170 + (i % 3) * 370 - (Math.floor(i / 3) % 2) * 90, y: 620 + Math.floor(i / 3) * 230, d: i * 0.12 }));

export function Fragman({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 12), 0.6));
  const bg = mix('#0E0820', X.bg, xr);

  // ---- kanca: neon şehir + yayılan SIZDI kartları (ilk karede 3 tane, hızla çoğalır)
  const hook = 1 - gir(t, bas(1), 0.4);
  const spread = (i: number, t0: number) => gir(t, t0 + CARDS[i].d, 0.35);
  // ---- 1: takvim — salı sabahı ↔ bir gün önce, kartlar yeniden yayılır
  const cal = gir(t, an(1, 0), 0.4) * (1 - gir(t, an(1, 6), 0.4));
  const leak1 = gir(t, an(1, 9), 0.2);
  // ---- 2: resmi oynatıcı
  const player = gir(t, an(2, 2), 0.5) * (1 - gir(t, bas(3), 0.5));
  const msg = gir(t, an(2, 7), 0.4);
  // ---- 3: sayaç ve kıyas, 19 Kasım
  const rec = gir(t, an(3, 0), 0.4) * (1 - gir(t, bas(4), 0.5));
  const count = gir(t, an(3, 2), Math.max(1.5, an(3, 7) - an(3, 2)));
  const beast = gir(t, an(3, 8), 0.5);
  const launch = gir(t, an(3, 13), 0.5);
  // ---- 5: merak okları resmi kaynağa akar
  const flow = gir(t, an(5, 6), 1.2);
  const lesson = gir(t, an(5, 12), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6
  const shop = gir(t, bas(6), 0.8);
  const official = gir(t, an(6, 6), 0.5);
  const waitlist = gir(t, an(6, 10), 0.5);

  const cityO = (1 - shop) * (1 - player * 0.7) * (1 - rec * 0.85) * (1 - xr * 0.3);

  return (
    <AbsoluteFill style={{ background: shop > 0.99 ? L.bg : bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />
        {cityO > 0 && <g opacity={cityO}><City t={t} xr={xr} glow={1 - xr} /></g>}

        {/* kanca ve 1. bölüm: sızıntı kartları */}
        {(hook > 0 || (t >= bas(1) && t < bas(2))) && CARDS.map((c, i) => {
          const o = t < bas(1) ? (i < 3 ? 1 : spread(i, 0.3)) * hook : spread(i, an(1, 9)) * leak1 * (1 - gir(t, bas(2), 0.4));
          return <LeakCard key={i} x={c.x} y={c.y + Math.sin(t * 2 + i) * 6} s={0.9} o={o} xr={xr} />;
        })}
        {/* sızıntı ağı çizgileri */}
        {hook > 0 && CARDS.slice(1).map((c, i) => (
          <line key={i} x1={CARDS[i].x} y1={CARDS[i].y} x2={c.x} y2={c.y} stroke={PINK} strokeWidth={3} strokeDasharray="8 10" opacity={spread(i + 1, 0.3) * hook * 0.7} />
        ))}

        {/* 1: takvim */}
        {cal > 0 && (
          <g opacity={cal}>
            {[{ d: '4', l: 'PAZARTESİ', on: leak1 }, { d: '5', l: 'SALI SABAHI', on: 1 }].map((k, i) => (
              <g key={k.d} transform={`translate(${330 + i * 420},720)`}>
                <rect x={-150} y={-160} width={300} height={320} rx={24} fill="#FFFFFF" stroke={i === 0 ? L.accent : L.ink} strokeWidth={i === 0 ? 8 : 5} />
                <rect x={-150} y={-160} width={300} height={70} rx={24} fill={i === 0 ? L.accent : L.ink} />
                <text y={-110} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} fill="#FFFFFF">ARALIK</text>
                <text y={60} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={130} fill={L.ink}>{k.d}</text>
                <text y={130} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill={L.muted}>{k.l}</text>
              </g>
            ))}
          </g>
        )}

        {/* 2: resmi oynatıcı */}
        {player > 0 && (
          <g opacity={player} transform={`translate(540,800) scale(${0.9 + 0.1 * player})`}>
            <rect x={-420} y={-260} width={840} height={520} rx={30} fill="#151515" />
            <rect x={-400} y={-240} width={800} height={430} rx={18} fill={SKY2} />
            <circle cx={0} cy={-30} r={90} fill="#FFFFFF" opacity={0.95} />
            <path d="M-26 -80 L50 -30 L-26 20 z" fill={L.accent} />
            <rect x={-400} y={210} width={800} height={10} rx={5} fill="#3A3A3A" />
            <rect x={-400} y={210} width={800 * gir(t, an(2, 2), 6)} height={10} rx={5} fill={L.accent} />
            {msg > 0 && (
              <g opacity={msg} transform="translate(0,340)">
                <rect x={-400} y={-50} width={800} height={110} rx={20} fill="#FFFFFF" />
                <text y={0} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={34} fill={L.ink}>Fragmanımız sızdı,</text>
                <text y={42} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={34} fill={L.accent}>gerçeğini izleyin.</text>
              </g>
            )}
          </g>
        )}

        {/* 3: rekor */}
        {rec > 0 && (
          <g opacity={rec}>
            <g transform="translate(120,560)">
              <text y={-20} fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill="#FFFFFF" opacity={0.8}>24 SAATTE · GUINNESS'E GÖRE</text>
              <rect width={840 * count} height={130} rx={20} fill={PINK} />
              <text x={30} y={92} fontFamily="Outfit" fontWeight={800} fontSize={76} fill="#FFFFFF" opacity={count}>90 milyon+</text>
            </g>
            <g transform="translate(120,800)" opacity={beast}>
              <text y={-20} fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill="#FFFFFF" opacity={0.8}>ÖNCEKİ REKOR · MRBEAST</text>
              <rect width={840 * 59.4 / 90.4} height={130} rx={20} fill="#4B5560" />
              <text x={30} y={92} fontFamily="Outfit" fontWeight={800} fontSize={76} fill="#FFFFFF">59,4 milyon</text>
            </g>
            <g transform="translate(540,1130)" opacity={launch}>
              <rect x={-260} y={-50} width={520} height={100} rx={50} fill={TEAL} />
              <text y={16} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={44} fill="#0E0820">19 Kasım: çıktı</text>
            </g>
          </g>
        )}

        {/* 5: röntgen — merak okları resmi kaynağa akar */}
        {xr > 0 && t >= bas(4) && (
          <g opacity={xr}>
            <rect x={400} y={680} width={280} height={180} rx={20} fill="none" stroke={X.cyan} strokeWidth={6} />
            <path d="M520 730 L580 770 L520 810 z" fill={X.cyan} />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const sx = 540 + Math.cos(a) * 420, sy = 770 + Math.sin(a) * 380;
              const u = flow;
              const toOfficial = i % 4 !== 0 || u > 0.5;
              const ex = toOfficial ? 540 + Math.cos(a) * 160 : sx + Math.cos(a) * 40;
              const ey = toOfficial ? 770 + Math.sin(a) * 110 : sy + Math.sin(a) * 40;
              return <line key={i} x1={sx} y1={sy} x2={karis(sx, ex, Math.min(1, u * 1.2))} y2={karis(sy, ey, Math.min(1, u * 1.2))} stroke={i % 4 === 0 && u < 0.5 ? PINK : X.cyan} strokeWidth={6} strokeLinecap="round" opacity={0.4 + 0.6 * gir(t, bas(4) + 0.3, 0.6)} />;
            })}
          </g>
        )}

        {/* 6: mağazan */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect width={1080} height={1920} fill={L.bg} />
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <g transform="translate(290,700) rotate(-6)">
              <rect x={-150} y={-180} width={300} height={360} rx={20} fill="#151515" />
              <rect x={-130} y={-150} width={260} height={180} rx={12} fill="#F6E7C8" />
              <rect x={-110} y={60} width={220} height={50} rx={10} fill={L.accent} />
              <text y={95} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={28} fill="#FFFFFF">ERKEN YAYILDI</text>
            </g>
            {official > 0 && (
              <g opacity={official} transform="translate(720,640)">
                <rect x={-200} y={-120} width={400} height={240} rx={20} fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
                <text y={-60} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={36} fill={L.ink}>Resmi duyuru</text>
                <rect x={-150} y={-20} width={300} height={20} rx={10} fill={L.line} />
                <rect x={-150} y={20} width={220} height={20} rx={10} fill={L.line} />
              </g>
            )}
            {waitlist > 0 && (
              <g opacity={waitlist} transform="translate(540,1060)">
                <rect x={-380} y={-60} width={760} height={120} rx={60} fill={L.ink} />
                <rect x={-340} y={-22} width={44} height={44} rx={8} fill="#FFFFFF" />
                <path d="M-332 0 l10 10 l18 -22" stroke={L.good} strokeWidth={6} fill="none" strokeLinecap="round" />
                <text x={30} y={14} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={40} fill="#FFFFFF">Bekleme listesine katıl</text>
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span style={{ color: '#FFFFFF' }}>GTA 6 fragmanı sızdı.</span>
          <span style={{ display: 'block', color: PINK }}>Rockstar beklemedi.</span>
        </Headline>
        <Headline show={lesson}>
          <span style={{ color: '#FFFFFF' }}>Resmi kaynağı</span>
          <span style={{ display: 'block', color: PINK }}>en hızlı yer yaptı.</span>
        </Headline>
      </WorldQc>
      <div style={{ position: 'absolute', left: 90, top: 300, fontFamily: 'JetBrains Mono, monospace', fontSize: 34, letterSpacing: 4, color: '#FFFFFF', opacity: gir(t, bas(1), 0.4) * (1 - gir(t, bas(2), 0.4)) }}>
        ARALIK 2023
      </div>
    </AbsoluteFill>
  );
}
