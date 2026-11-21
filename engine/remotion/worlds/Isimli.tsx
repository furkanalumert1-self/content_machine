// Dünya: "İsimli şişe" (Coca-Cola 'Share a Coke', Avustralya 2011; şirket ve Ogilvy vaka çalışması). Logo yok: genel kırmızı şişe.
// 17.11 kuralı: 0. kare dolu ve hareketli (dolap, sıra sıra şişe, etiket dalgası). "sildi" ile etiketler boşalır, "adını" ile isimler.
// Akış: 150 isim etiketi → 23 milyon nüfus ↔ 250 milyon+ şişe (gerçek oranlı çubuk) → 70+ ülke noktası → röntgen: kendi adını bulur,
// arkadaşının adını hediye eder, zincir yayılır → mağazan: isimli el yazısı not, ismin yalnız sipariş için kullanılması.
// Bölümler: 0 kanca, 1 150 isim, 2 satış, 3 ülkeler, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, Person, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const COLA = '#C8102E';
const NAMES = ['ELİF', 'MERT', 'ZEYNEP', 'CAN', 'AYŞE', 'EMRE', 'DENİZ', 'SELİN', 'BURAK', 'EDA', 'KAAN', 'NAZ'];

function Bottle({ x, y, s, label, name, xr }: { x: number; y: number; s: number; label: number; name?: string; xr: number }) {
  const ink = xr > 0.5 ? X.cyan : '#7A0A1C';
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-22 -150 h44 v30 q0 30 20 60 q14 24 14 60 v150 q0 20 -20 20 h-92 q-20 0 -20 -20 v-150 q0 -36 14 -60 q20 -30 20 -60 z" fill={xr > 0.5 ? 'none' : '#3A0A12'} stroke={ink} strokeWidth={4} />
      <rect x={-24} y={-172} width={48} height={24} rx={6} fill={xr > 0.5 ? 'none' : COLA} stroke={ink} strokeWidth={3} />
      <rect x={-56} y={20} width={112} height={74} rx={6} fill={xr > 0.5 ? 'none' : COLA} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />
      {/* genel etiket dalgası (logo değil) */}
      {label > 0 && <path d="M-46 64 q24 -26 46 -6 q24 18 46 -10" fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={label} />}
      {name && <text y={68} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={name.length > 5 ? 22 : 28} fill="#FFFFFF">{name}</text>}
    </g>
  );
}

export function Isimli({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 12), 0.6));
  const bg = mix(L.bg, X.bg, xr);
  const ink = mix(L.ink, X.cyan, xr);

  // ---- kanca: dolap; "sildi" ile etiket dalgası kaybolur; "adını" ile isimler belirir (sırayla)
  const hook = 1 - gir(t, bas(1), 0.4);
  const wipe = gir(t, an(0, 3), 0.4);
  const names = (i: number) => gir(t, an(0, 6) + i * 0.06, 0.2) > 0.5;
  // ---- 1: 150 isim
  const tags = gir(t, bas(1), 0.4) * (1 - gir(t, bas(2), 0.4));
  const tagFill = gir(t, an(1, 8), 1.2);
  // ---- 2: 23 milyon ↔ 250 milyon+
  const bars = gir(t, bas(2), 0.4) * (1 - gir(t, bas(3), 0.4));
  const pop = gir(t, an(2, 2), 0.5);
  const sold = gir(t, an(2, 5), 1.0);
  // ---- 3: 70+ ülke
  const world = gir(t, bas(3), 0.4) * (1 - gir(t, bas(4), 0.5));
  const lit = gir(t, an(3, 2), 1.2);
  // ---- 5: kendi adı → arkadaşın adı → hediye → zincir
  const own = gir(t, an(5, 2), 0.5);
  const friend = gir(t, an(5, 6), 0.5);
  const gift = gir(t, an(5, 10), 0.6);
  const chain = gir(t, an(5, 12), 1.0);
  const lesson = gir(t, an(5, 12), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6
  const shop = gir(t, bas(6), 0.8);
  const note = gir(t, an(6, 4), 0.5);
  const lock = gir(t, an(6, 9), 0.5);

  const fridge = hook;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* kanca: soğutucu dolap */}
        {fridge > 0 && (
          <g opacity={fridge}>
            <rect x={110} y={440} width={860} height={820} rx={30} fill={COLA} />
            <rect x={140} y={470} width={800} height={760} rx={18} fill="#DCEFF5" />
            {[0, 1, 2].map((r) => (
              <g key={r}>
                <rect x={140} y={720 + r * 250} width={800} height={14} fill="#9FB2C0" />
                {Array.from({ length: 6 }, (_, i) => {
                  const k = r * 6 + i;
                  return <Bottle key={i} x={210 + i * 132} y={700 + r * 250 + Math.sin(t * 3 + k) * 2} s={0.62} label={1 - wipe} name={names(k) ? NAMES[k % NAMES.length] : undefined} xr={xr} />;
                })}
              </g>
            ))}
            <rect x={140} y={470} width={800} height={760} rx={18} fill="#FFFFFF" opacity={0.08 + 0.04 * Math.sin(t * 2)} />
          </g>
        )}

        {/* 1: 150 isim etiketi */}
        {tags > 0 && (
          <g opacity={tags}>
            {Array.from({ length: 150 }, (_, i) => (
              <rect key={i} x={120 + (i % 12) * 70} y={480 + Math.floor(i / 12) * 54} width={60} height={40} rx={8}
                fill={i < Math.round(tagFill * 150) ? COLA : L.line} />
            ))}
            <text x={540} y={1250} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={72} fill={L.ink} opacity={tagFill}>150 isim</text>
            <text x={90} y={430} fontFamily="JetBrains Mono" fontSize={30} letterSpacing={4} fill={L.ink}>2011 · AVUSTRALYA</text>
          </g>
        )}

        {/* 2: nüfus ↔ satılan şişe (gerçek oran) */}
        {bars > 0 && (
          <g opacity={bars}>
            <g transform="translate(140,560)" opacity={pop}>
              <text y={-20} fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted}>NÜFUS</text>
              <rect width={800 * 23 / 250} height={110} rx={14} fill="#9AA0A6" />
              <text x={800 * 23 / 250 + 24} y={74} fontFamily="Outfit" fontWeight={800} fontSize={56} fill={L.ink}>23 milyon</text>
            </g>
            <g transform="translate(140,800)">
              <text y={-20} fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted}>İSİMLİ ŞİŞE VE KUTU · ŞİRKETE GÖRE</text>
              <rect width={800 * sold} height={110} rx={14} fill={COLA} />
              <text x={30} y={74} fontFamily="Outfit" fontWeight={800} fontSize={56} fill="#FFFFFF" opacity={sold}>250 milyon+</text>
            </g>
          </g>
        )}

        {/* 3: 70+ ülke */}
        {world > 0 && (
          <g opacity={world}>
            {Array.from({ length: 96 }, (_, i) => {
              const x = 150 + (i % 16) * 52, y = 560 + Math.floor(i / 16) * 70;
              const land = Math.sin(i * 1.7) > -0.5;
              return land ? <circle key={i} cx={x} cy={y} r={16} fill={i % 96 < Math.round(lit * 96) ? COLA : L.line} /> : null;
            })}
            <text x={540} y={1100} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={80} fill={L.ink} opacity={lit}>70+ ülke</text>
          </g>
        )}

        {/* 5: röntgen — kendi adı, arkadaşın adı, hediye, zincir */}
        {t >= bas(4) && t < bas(6) && (
          <g opacity={1 - shop}>
            <g opacity={Math.max(own, 0.2)}><Person x={300} y={1100} c={ink} s={9} /></g>
            {own > 0 && <g opacity={own}><Bottle x={300} y={760} s={1.1} label={0} name="ELİF" xr={xr} /></g>}
            {friend > 0 && <g opacity={friend} transform={`translate(${karis(480, 760, gift)},0)`}><Bottle x={0} y={760} s={1.1} label={0} name="MERT" xr={xr} /></g>}
            {gift > 0 && <g opacity={gift}><Person x={760} y={1100} c={ink} s={9} /></g>}
            {chain > 0 && Array.from({ length: 6 }, (_, i) => (
              <g key={i} opacity={gir(t, an(5, 12) + i * 0.12, 0.3)}>
                <Person x={200 + i * 140} y={1200} c={L.accent} s={3} />
                {i < 5 && <path d={`M${222 + i * 140} 1170 q50 -30 96 0`} fill="none" stroke={L.accent} strokeWidth={5} />}
              </g>
            ))}
          </g>
        )}

        {/* 6: mağazan — isimli not */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <g transform="translate(330,820)">
              <path d="M-180 -120 h360 v260 h-360 z" fill="#D9B07A" stroke={L.ink} strokeWidth={6} />
              <path d="M-180 -120 l60 -60 h240 l60 60" fill="#E7C795" stroke={L.ink} strokeWidth={6} />
            </g>
            {note > 0 && (
              <g opacity={note} transform="translate(690,760) rotate(4)">
                <rect x={-190} y={-130} width={380} height={260} rx={10} fill="#FFFDF5" stroke={L.ink} strokeWidth={4} />
                <text x={-150} y={-50} fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize={56} fill={L.ink}>Elif,</text>
                <text x={-150} y={20} fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize={44} fill={L.ink}>iyi günlerde</text>
                <text x={-150} y={76} fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize={44} fill={L.ink}>kullan!</text>
              </g>
            )}
            {lock > 0 && (
              <g opacity={lock} transform="translate(540,1130)">
                <rect x={-360} y={-46} width={720} height={92} rx={46} fill={L.ink} />
                <rect x={-320} y={-14} width={30} height={26} rx={5} fill="#FFFFFF" />
                <path d="M-314 -14 v-8 a9 9 0 0 1 18 0 v8" fill="none" stroke="#FFFFFF" strokeWidth={4} />
                <text x={30} y={12} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={32} fill="#FFFFFF">İsim yalnız sipariş için</text>
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>Logosunu sildi.</span>
          <span style={{ display: 'block', color: L.accent }}>Yerine adını yazdı.</span>
        </Headline>
        <Headline show={lesson}>
          <span>Reklam kendiliğinden</span>
          <span style={{ display: 'block', color: L.accent }}>yayılıyor.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
