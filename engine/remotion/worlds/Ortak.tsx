// Dünya: "Ortak isim" (Google Android 4.4 KitKat, 3 Eylül 2013; Google'dan John Lagerling'e göre para el değiştirmedi;
// Nestlé 19 ülkede 50 milyondan fazla özel paket, paketlerden tablet). Logo yok: genel telefon ve genel çikolata.
// 17.11 kuralı: 0. kare dolu ve hareketli (telefon ayar ekranında sürüm adı, yanında çikolata kayar).
// Akış: güncelleme çubuğu → ad → el sıkışma, üstü çizili banknot → paket rafı çoğalır, paketten tablet → röntgen: iki kitle
// birbirine akar → mağazan: yerel markayla ortak paket, iki izinli kanal.
// Bölümler: 0 kanca, 1 sürüm, 2 para yok, 3 paketler, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const CHOC = '#6B3B22';
const WRAP = '#D7263D';
const GREEN = '#3DDC84';

function Bar({ x, y, s, xr, open = 0 }: { x: number; y: number; s: number; xr: number; open?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-130} y={-50} width={260} height={100} rx={10} fill={xr > 0.5 ? 'none' : WRAP} stroke={xr > 0.5 ? X.cyan : '#00000040'} strokeWidth={3} />
      <rect x={-130} y={-50} width={260 * open} height={100} rx={10} fill={CHOC} />
      {open > 0.5 && [0, 1, 2, 3].map((i) => <rect key={i} x={-120 + i * 62} y={-40} width={54} height={80} rx={6} fill="#7E4A2C" />)}
      {open < 0.5 && <rect x={-60} y={-22} width={120} height={44} rx={8} fill="#FFFFFF" opacity={0.9} />}
      {open < 0.5 && <rect x={-20} y={-14} width={40} height={28} rx={6} fill={GREEN} />}
    </g>
  );
}

function Phone({ x, y, s, children }: { x: number; y: number; s: number; children?: React.ReactNode }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-170} y={-320} width={340} height={640} rx={44} fill="#151515" />
      <rect x={-150} y={-290} width={300} height={580} rx={28} fill="#F4F6F8" />
      {children}
    </g>
  );
}

export function Ortak({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 5), 0.6));
  const bg = mix(L.bg, X.bg, xr);

  // ---- kanca: ayar ekranı, çikolata kayar; "bedavaya" ile üstü çizili banknot
  const hook = 1 - gir(t, bas(1), 0.4);
  const slide = gir(t, 0.2, 1.4);
  const free = gir(t, an(0, 6), 0.4);
  // ---- 1: güncelleme çubuğu ve ad
  const upd = gir(t, bas(1), 0.4) * (1 - gir(t, bas(2), 0.4));
  const prog = gir(t, an(1, 1), Math.max(1, an(1, 5) - an(1, 1)));
  const nameIn = gir(t, an(1, 6), 0.4);
  // ---- 2: el sıkışma, para yok
  const deal = gir(t, bas(2), 0.4) * (1 - gir(t, bas(3), 0.4));
  const noMoney = gir(t, an(2, 4), 0.4);
  // ---- 3: paketler, tablet
  const packs = gir(t, bas(3), 0.4) * (1 - gir(t, bas(4), 0.5));
  const many = gir(t, an(3, 4), 1.0);
  const tablet = gir(t, an(3, 11), 0.6);
  // ---- 5: iki kitle
  const flow = gir(t, an(5, 0), 1.2);
  const lesson = gir(t, an(5, 5), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6
  const shop = gir(t, bas(6), 0.8);
  const bundle = gir(t, an(6, 10), 0.5);
  const chans = gir(t, an(6, 13), 0.5);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* kanca: ayar ekranı + kayan çikolata */}
        {hook > 0 && (
          <g opacity={hook}>
            <Phone x={420} y={850} s={1.05}>
              <text x={-120} y={-220} fontFamily="Outfit" fontWeight={800} fontSize={30} fill={L.ink}>Telefon hakkında</text>
              {[0, 1, 2].map((i) => <rect key={i} x={-120} y={-170 + i * 60} width={[200, 160, 180][i]} height={18} rx={9} fill={L.line} />)}
              <rect x={-130} y={30} width={260} height={110} rx={16} fill="#FFFFFF" stroke={GREEN} strokeWidth={5} />
              <text x={-110} y={70} fontFamily="JetBrains Mono" fontSize={20} fill={L.muted}>Android sürümü</text>
              <text x={-110} y={118} fontFamily="Outfit" fontWeight={800} fontSize={40} fill={L.ink}>4.4 KitKat</text>
            </Phone>
            <g transform={`rotate(${-14 + Math.sin(t * 2) * 2} ${karis(1300, 760, slide)} 1080)`}><Bar x={karis(1300, 760, slide)} y={1080} s={1.15} xr={xr} /></g>
            {free > 0 && (
              <g opacity={free} transform="translate(780,600) rotate(-8)">
                <rect x={-120} y={-60} width={240} height={120} rx={12} fill="#7FB069" stroke={L.ink} strokeWidth={4} />
                <circle r={34} fill="none" stroke="#FFFFFF" strokeWidth={6} />
                <line x1={-140} y1={70} x2={140} y2={-70} stroke={L.accent} strokeWidth={14} strokeLinecap="round" />
              </g>
            )}
          </g>
        )}

        {/* 1: güncelleme ve ad */}
        {upd > 0 && (
          <g opacity={upd}>
            <Phone x={540} y={850} s={1.1}>
              <text x={0} y={-160} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={32} fill={L.ink}>Yeni sürüm</text>
              <rect x={-120} y={-100} width={240} height={20} rx={10} fill={L.line} />
              <rect x={-120} y={-100} width={240 * prog} height={20} rx={10} fill={GREEN} />
              <g opacity={nameIn} transform={`scale(${0.8 + 0.2 * nameIn})`}>
                <text x={0} y={40} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={64} fill={WRAP}>KitKat</text>
              </g>
            </Phone>
            <text x={90} y={430} fontFamily="JetBrains Mono" fontSize={32} letterSpacing={4} fill={L.ink}>2013</text>
          </g>
        )}

        {/* 2: el sıkışma, üstü çizili para */}
        {deal > 0 && (
          <g opacity={deal}>
            <path d="M200 900 h200 l60 40" stroke="#E9B99A" strokeWidth={70} strokeLinecap="round" fill="none" />
            <path d="M880 900 h-200 l-60 40" stroke="#C99A7A" strokeWidth={70} strokeLinecap="round" fill="none" />
            <circle cx={540} cy={930} r={60} fill="#E0AA88" />
            <g opacity={noMoney} transform="translate(540,640)">
              <rect x={-160} y={-80} width={320} height={160} rx={14} fill="#7FB069" stroke={L.ink} strokeWidth={5} />
              <circle r={46} fill="none" stroke="#FFFFFF" strokeWidth={8} />
              <line x1={-190} y1={100} x2={190} y2={-100} stroke={L.accent} strokeWidth={16} strokeLinecap="round" />
            </g>
            <text x={540} y={1150} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted} opacity={noMoney}>GOOGLE'A GÖRE</text>
          </g>
        )}

        {/* 3: paketler çoğalır, paketten tablet */}
        {packs > 0 && (
          <g opacity={packs}>
            {Array.from({ length: 15 }, (_, i) => (
              <g key={i} opacity={i === 7 ? 1 : many}><Bar x={230 + (i % 3) * 310} y={560 + Math.floor(i / 3) * 140} s={0.85} xr={xr} open={i === 7 ? tablet : 0} /></g>
            ))}
            {tablet > 0 && (
              <g opacity={tablet} transform={`translate(540,${karis(840, 700, tablet)})`}>
                <rect x={-110} y={-150} width={220} height={300} rx={20} fill="#151515" />
                <rect x={-96} y={-134} width={192} height={268} rx={10} fill="#5FA8C8" />
              </g>
            )}
            <text x={540} y={1300} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={58} fill={L.ink} opacity={many}>50 milyon+ paket · 19 ülke</text>
          </g>
        )}

        {/* 5: iki kitle birbirine akar */}
        {t >= bas(4) && t < bas(6) && (
          <g opacity={1 - shop}>
            <circle cx={360} cy={860} r={220} fill="none" stroke={xr > 0.5 ? X.cyan : WRAP} strokeWidth={6} />
            <circle cx={720} cy={860} r={220} fill="none" stroke={xr > 0.5 ? X.cyan : GREEN} strokeWidth={6} />
            <text x={300} y={1130} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={xr > 0.5 ? X.cyan : WRAP}>ÇİKOLATA ALAN</text>
            <text x={780} y={1130} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={xr > 0.5 ? X.cyan : '#1E8F55'}>TELEFON KULLANAN</text>
            {Array.from({ length: 10 }, (_, i) => {
              const u = Math.max(0, Math.min(1, flow * 1.4 - (i % 5) * 0.08));
              const fromL = i < 5;
              const y0 = 760 + (i % 5) * 50;
              return <circle key={i} cx={fromL ? karis(300, 760, u) : karis(780, 320, u)} cy={y0} r={14} fill={fromL ? WRAP : GREEN} />;
            })}
          </g>
        )}

        {/* 6: mağazan — ortak paket */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            {[{ x: 280, n: 'Senin mağazan', c: L.accent }, { x: 800, n: 'Yerel marka', c: '#2E5E8C' }].map((m) => (
              <g key={m.n} transform={`translate(${m.x},600)`}>
                <rect x={-170} y={-90} width={340} height={180} rx={20} fill="#FFFFFF" stroke={m.c} strokeWidth={6} />
                <text y={14} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={34} fill={m.c}>{m.n}</text>
              </g>
            ))}
            {bundle > 0 && (
              <g opacity={bundle} transform="translate(540,900)">
                <path d="M-200 -110 h400 v240 h-400 z" fill="#D9B07A" stroke={L.ink} strokeWidth={6} />
                <rect x={-20} y={-110} width={40} height={240} fill={L.accent} opacity={0.8} />
                <text y={170} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={28} letterSpacing={3} fill={L.ink}>ORTAK PAKET</text>
              </g>
            )}
            {chans > 0 && [280, 800].map((x) => (
              <g key={x} opacity={chans} transform={`translate(${x},1160)`}>
                <rect x={-120} y={-36} width={240} height={72} rx={36} fill={L.ink} />
                <path d="M-80 0 l12 12 l22 -24" stroke={L.good} strokeWidth={6} fill="none" strokeLinecap="round" />
                <text x={20} y={10} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={26} fill="#FFFFFF">izinli kanal</text>
              </g>
            ))}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>Android'e çikolata adı.</span>
          <span style={{ display: 'block', color: L.accent }}>Hem de bedavaya.</span>
        </Headline>
        <Headline show={lesson}>
          <span>İki marka birbirinin</span>
          <span style={{ display: 'block', color: L.accent }}>kitlesine ulaştı.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
