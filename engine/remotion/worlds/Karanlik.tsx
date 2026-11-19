// Dünya: "Karanlıkta da" (Oreo, Super Bowl 3 Şubat 2013; 360i). Tek dünya: gece stadyumu ve bir telefon.
// 17.11 kuralı: 0. kare dolu ve hareketli (ışıklı stadyum, kalabalık, skor tabelası); "karanlığı" kelimesinde ışıklar söner.
// Akış: 2013 → ışıklar gider → telefonda tweet: spot ışığında bir bisküvi → kronometre <1 dk, 15.000+ retweet
// → röntgen: herkesin telefonu aynı anda yanar, bisküvi o anın içine girer, hız > bütçe → mağazan: haftalık gündem saati, şablon, 30 dk.
// Logo yok: genel siyah sandviç bisküvi. Bölümler: 0 kanca, 1 kesinti, 2 tweet, 3 hız+RT, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, Person, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const NIGHT = '#0B1220';
const CROWD = Array.from({ length: 90 }, (_, i) => ({ x: 120 + (i % 18) * 48 + (Math.floor(i / 18) % 2) * 24, y: 900 + Math.floor(i / 18) * 46, c: ['#E8402A', '#2E5E8C', '#F2C14E', '#FFFFFF'][i % 4] }));

function Cookie({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={26} rx={110} ry={34} fill="#1A1412" />
      <rect x={-104} y={-6} width={208} height={26} fill="#F4F1EA" />
      <ellipse cx={0} cy={-8} rx={110} ry={34} fill="#2A201C" />
      {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={Math.cos(i * 0.63) * 70} cy={-8 + Math.sin(i * 0.63) * 18} r={6} fill="#3B2E28" />)}
    </g>
  );
}

function Stadium({ lights, t, xr }: { lights: number; t: number; xr: number }) {
  const lit = lights * (1 - xr);
  return (
    <g>
      <path d="M60 1220 L140 780 H940 L1020 1220 z" fill={mix('#1B2633', '#2E5E8C', lit * 0.4)} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={3} />
      <ellipse cx={540} cy={1180} rx={420} ry={70} fill={mix('#10301C', '#2E9E5B', lit)} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={3} />
      {[200, 880].map((x) => (
        <g key={x}>
          <rect x={x - 6} y={500} width={12} height={300} fill="#3A3A3A" />
          <rect x={x - 70} y={470} width={140} height={50} rx={6} fill={mix('#2A2F36', '#FFF6D6', lit)} />
          <path d={`M${x - 70} 520 L${x - 260} 1200 H${x + 260} L${x + 70} 520 z`} fill="#FFF6D6" opacity={0.1 * lit} />
        </g>
      ))}
      <g transform="translate(540,600)">
        <rect x={-150} y={-60} width={300} height={120} rx={10} fill="#151515" stroke="#3A3A3A" strokeWidth={4} />
        <text y={18} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={52} fill={mix('#2A2F36', '#F2C14E', Math.max(lit, 0.15))}>{lit > 0.5 ? 'CANLI' : '— —'}</text>
      </g>
      {CROWD.map((p, i) => (
        <Person key={i} x={p.x} y={p.y + Math.sin(t * 5 + i) * 3 * lit} c={xr > 0.5 ? X.cyan : mix('#2A2F36', p.c, Math.max(lit, 0.12))} s={2.4} />
      ))}
    </g>
  );
}

export function Karanlik({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 11), 0.6));

  // ---- ışıklar: kancada açık, "karanlığı" ile söner; 1. bölümde yeniden açık (geçmiş), "gidiyor" ile söner
  const hookOff = gir(t, an(0, 1), 0.25);
  const flick = (u: number) => (u > 0 && u < 1 ? (Math.sin(t * 60) > 0 ? 1 - u : 0.2) : 1 - u);
  const lights = t < bas(1) ? flick(hookOff) : t < bas(2) ? flick(gir(t, an(1, 6), 0.4)) : 0;
  // ---- telefon ve tweet
  const phone = Math.max(gir(t, an(0, 4), 0.4) * (1 - gir(t, bas(1), 0.3)), gir(t, an(2, 2), 0.5) * (1 - gir(t, bas(4), 0.5)));
  const post = Math.max(gir(t, an(0, 4), 0.4) * (t < bas(1) ? 1 : 0), gir(t, an(2, 4), 0.5));
  // ---- 3: kronometre ve retweet
  const watch = gir(t, an(3, 2), 0.4) * (1 - gir(t, an(3, 8), 0.4));
  const rt = gir(t, an(3, 9), 0.4) * (1 - gir(t, bas(4), 0.5));
  const rtGrow = gir(t, an(3, 9), 1.6);
  // ---- 5: herkesin telefonu aynı anda; bisküvi içeri; hız > bütçe
  const phones = gir(t, an(5, 0), 0.5) * (1 - gir(t, an(5, 11), 0.5));
  const enter = gir(t, an(5, 6), 0.8);
  const bars = gir(t, an(5, 11), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6: mağazan
  const shop = gir(t, bas(6), 0.8);
  const slot = gir(t, an(6, 2), 0.5);
  const tpl = gir(t, an(6, 5), 0.5);
  const timer = gir(t, an(6, 12), 0.5);

  const bg = mix(NIGHT, X.bg, xr);
  const sceneO = (1 - shop) * (1 - bars);
  const phX = 760, phY = 760;

  return (
    <AbsoluteFill style={{ background: shop > 0.99 ? L.bg : bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {sceneO > 0 && (
          <g opacity={sceneO}>
            <g opacity={1 - phones * 0.85}><Stadium lights={lights} t={t} xr={xr} /></g>

            {/* telefon + gönderi */}
            {phone > 0 && (
              <g opacity={phone} transform={`translate(${phX},${phY}) scale(${0.9 + 0.1 * phone})`}>
                <rect x={-150} y={-280} width={300} height={560} rx={40} fill="#151515" stroke="#3A3A3A" strokeWidth={6} />
                <rect x={-130} y={-250} width={260} height={500} rx={26} fill="#FFFFFF" />
                <g opacity={post}>
                  <circle cx={-96} cy={-210} r={18} fill="#2E5E8C" />
                  <rect x={-66} y={-222} width={120} height={14} rx={7} fill="#CFCAC1" />
                  <rect x={-110} y={-180} width={220} height={230} rx={12} fill="#1E2A3A" />
                  <path d="M0 -180 L-90 50 H90 z" fill="#FFF6D6" opacity={0.45} />
                  <Cookie x={0} y={-10} s={0.85} />
                  <text x={0} y={100} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={24} fill={L.ink}>Karanlıkta da</text>
                  <text x={0} y={130} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={24} fill={L.ink}>batırabilirsin.</text>
                  {/* retweet sayacı */}
                  {rt > 0 && (
                    <g opacity={rt}>
                      <path d="M-100 190 h40 l-10 -10 M-60 190 l-10 10" stroke="#2E9E5B" strokeWidth={5} fill="none" />
                      <text x={-40} y={200} fontFamily="Outfit" fontWeight={800} fontSize={34} fill="#2E9E5B">{rtGrow > 0.98 ? '15.000+' : Math.round(rtGrow * 15000).toLocaleString('tr-TR')}</text>
                    </g>
                  )}
                </g>
              </g>
            )}

            {/* kronometre: bir dakikadan kısa */}
            {watch > 0 && (
              <g opacity={watch} transform="translate(300,560)">
                <circle r={110} fill="#FFFFFF" stroke={L.ink} strokeWidth={8} />
                <rect x={-20} y={-140} width={40} height={24} rx={6} fill={L.ink} />
                <path d={`M0 0 L${Math.sin(gir(t, an(3, 2), 1.4) * Math.PI * 1.8) * 80} ${-Math.cos(gir(t, an(3, 2), 1.4) * Math.PI * 1.8) * 80}`} stroke={L.accent} strokeWidth={8} strokeLinecap="round" />
                <text y={170} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={28} letterSpacing={2} fill="#FFFFFF">&lt; 1 DAKİKA</text>
              </g>
            )}

            {/* 5: herkes aynı anda — kalabalığın telefonları yanar, bisküvi o anın içine girer */}
            {phones > 0 && (
              <g opacity={phones}>
                {CROWD.filter((_, i) => i % 2 === 0).map((p, i) => (
                  <rect key={i} x={p.x - 12} y={p.y - 60} width={24} height={40} rx={5} fill={X.cyan} opacity={gir(t, an(5, 0) + (i % 9) * 0.04, 0.2)} />
                ))}
                <g transform={`translate(${karis(1200, 540, enter)},700) scale(${karis(0.8, 1.6, enter)})`}><circle r={150} fill="#FFF6D6" opacity={0.35} /><Cookie x={0} y={0} s={1} /></g>
              </g>
            )}
          </g>
        )}

        {/* ders: hız ↔ bütçe */}
        {bars > 0 && (
          <g opacity={bars}>
            <g transform="translate(140,640)">
              <text y={-20} fontFamily="JetBrains Mono" fontSize={28} letterSpacing={3} fill="#FFFFFF">HIZ</text>
              <rect width={800} height={90} rx={16} fill={L.accent} />
            </g>
            <g transform="translate(140,880)">
              <text y={-20} fontFamily="JetBrains Mono" fontSize={28} letterSpacing={3} fill="#FFFFFF">BÜTÇE</text>
              <rect width={220} height={90} rx={16} fill="#4B5560" />
            </g>
          </g>
        )}

        {/* 6: mağazan — haftalık gündem saati */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect width={1080} height={1920} fill={L.bg} />
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d, i) => (
              <g key={d} transform={`translate(${150 + i * 118},500)`}>
                <rect width={100} height={120} rx={14} fill={i === 3 && slot > 0.5 ? L.accent : '#FFFFFF'} stroke={L.line} strokeWidth={3} />
                <text x={50} y={70} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={30} fill={i === 3 && slot > 0.5 ? '#FFFFFF' : L.ink}>{d}</text>
              </g>
            ))}
            <text x={540} y={680} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={3} fill={L.muted} opacity={slot}>GÜNDEM SAATİ</text>
            {tpl > 0 && (
              <g opacity={tpl} transform="translate(360,960)">
                <rect x={-200} y={-200} width={400} height={400} rx={24} fill="#FFFFFF" stroke={L.ink} strokeWidth={5} strokeDasharray="16 10" />
                <rect x={-120} y={-140} width={240} height={180} rx={14} fill="#F6E7C8" />
                <rect x={-140} y={80} width={280} height={24} rx={12} fill={L.line} />
                <rect x={-140} y={124} width={200} height={24} rx={12} fill={L.line} />
              </g>
            )}
            {timer > 0 && (
              <g opacity={timer} transform="translate(780,960)">
                <circle r={130} fill="#FFFFFF" stroke={L.line} strokeWidth={16} />
                <circle r={130} fill="none" stroke={L.accent} strokeWidth={16} strokeDasharray={`${2 * Math.PI * 130}`} strokeDashoffset={`${2 * Math.PI * 130 * gir(t, an(6, 13), 5)}`} transform="rotate(-90)" strokeLinecap="round" />
                <text y={22} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={64} fill={L.ink}>30 dk</text>
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={1 - gir(t, bas(1), 0.4)}>
          <span style={{ color: '#FFFFFF' }}>Karanlığı reklama çevirdi.</span>
          <span style={{ display: 'block', color: L.accent }}>Hem de Super Bowl'da.</span>
        </Headline>
        <Headline show={bars}>
          <span style={{ color: '#FFFFFF' }}>Hız, bütçeden</span>
          <span style={{ display: 'block', color: L.accent }}>değerli oldu.</span>
        </Headline>
      </WorldQc>
      <div style={{ position: 'absolute', left: 90, top: 300, fontFamily: 'JetBrains Mono, monospace', fontSize: 34, letterSpacing: 4, color: '#FFFFFF', opacity: gir(t, bas(1), 0.4) * (1 - gir(t, bas(2), 0.4)) }}>
        2013 · SUPER BOWL
      </div>
    </AbsoluteFill>
  );
}
