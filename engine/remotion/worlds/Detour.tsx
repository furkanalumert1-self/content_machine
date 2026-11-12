// Dünya: "Whopper Detour" (Burger King, Aralık 2018; Restaurant Dive 2019). Tek dünya: yukarıdan bakılan bir şehir haritası.
// Kalıp: Gerçek olay. Müşteri noktası Burger King'den çıkıp rakibe yürür (kanca) → 1 sentlik Whopper → rakibin 600 fit
// çemberi, nokta içeri girince kilit açılır → haritanın her yerinden noktalar çembere akar (1,5 milyon indirme, şirkete göre)
// → röntgen: zahmet engeli erir, konuşma balonları → mağazan: sembolik fiyat, ilk 100 hesap, süre.
// Bölümler: 0 kanca, 1 1 sent, 2 600 fit, 3 indirme, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
// Logo yok: dükkânlar düz yazıyla adlandırılır.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const BK = { x: 290, y: 1110 };
const MC = { x: 790, y: 640 };
const R600 = 210;
// sokak ızgarası (x ve y çizgileri)
const VX = [140, 410, 670, 940];
const HY = [500, 780, 1000, 1220];

/** Kanca ve 2. bölümdeki müşteri yolu: Burger King → yukarı → sağa → rakip. p: 0–1 */
function route(p: number) {
  const pts = [BK, { x: 410, y: 1110 }, { x: 410, y: 780 }, { x: 670, y: 780 }, { x: 670, y: 640 }, { x: MC.x - 90, y: MC.y }];
  const seg = pts.slice(1).map((b, i) => Math.hypot(b.x - pts[i].x, b.y - pts[i].y));
  const total = seg.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, p)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) { const u = d / seg[i]; return { x: karis(pts[i].x, pts[i + 1].x, u), y: karis(pts[i].y, pts[i + 1].y, u) }; }
    d -= seg[i];
  }
  return pts[pts.length - 1];
}

function Shop({ x, y, name, c, xr, glow = 0 }: { x: number; y: number; name: string; c: string; xr: number; glow?: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-110} y={-70} width={220} height={140} rx={16} fill={xr > 0.5 ? 'none' : c} stroke={xr > 0.5 ? X.cyan : L.ink} strokeWidth={5} />
      <rect x={-90} y={-50} width={180} height={40} rx={8} fill={xr > 0.5 ? 'none' : '#FFFFFF'} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} opacity={0.9} />
      <text y={-22} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={24} fill={xr > 0.5 ? X.cyan : L.ink}>{name}</text>
      {glow > 0 && <rect x={-120} y={-80} width={240} height={160} rx={20} fill="none" stroke={L.accent} strokeWidth={6} opacity={glow} />}
    </g>
  );
}

function Dot({ x, y, c, s = 1, o = 1 }: { x: number; y: number; c: string; s?: number; o?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <circle r={22} fill={c} opacity={0.25} />
      <circle r={12} fill={c} stroke="#FFFFFF" strokeWidth={4} />
    </g>
  );
}

const CROWD = Array.from({ length: 46 }, (_, i) => {
  const a = (i * 137.5 * Math.PI) / 180;
  const r = 260 + (i % 5) * 40;
  return { x: 540 + Math.cos(a) * r * 1.2, y: 870 + Math.sin(a) * r * 0.75, d: (i % 9) * 0.07 };
});

export function Detour({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 8), 0.6));
  const bg = mix(L.bg, X.bg, xr);
  const ink = mix(L.ink, X.cyan, xr);

  // ---- müşteri yürüyüşü: kancada BK → rakip; 2. bölümde tekrar ("yakınındayken" çembere girer)
  const walk1 = gir(t, an(0, 2), Math.max(1, an(0, 7) - an(0, 2)));
  const walk2 = gir(t, an(2, 2), Math.max(1, an(2, 9) - an(2, 2)));
  const inHook = t < bas(1);
  const walkP = inHook ? walk1 : t >= bas(2) ? walk2 : 0;
  const me = route(walkP);
  const meO = inHook ? 1 : t >= bas(2) && t < bas(3) ? 1 : t >= bas(3) && t < bas(4) ? 1 - gir(t, bas(3), 0.4) : 0;

  // ---- 1 sent fiyat kartı
  const cent = gir(t, an(1, 5), 0.5) * (1 - gir(t, bas(2), 0.5));
  // ---- 600 fit çemberi; kilit açılır
  const ring = gir(t, an(2, 5), 0.6) * (1 - gir(t, an(5, 8), 0.5));
  const unlock = gir(t, an(2, 8), 0.4);
  // ---- indirme akını: noktalar çembere akar
  const flow = gir(t, an(3, 2), 2.4);
  const crowdO = gir(t, an(3, 2), 0.4) * (1 - gir(t, bas(6), 0.5));
  const dl = gir(t, an(3, 3), 0.4) * (1 - gir(t, bas(4), 0.4));
  const top1 = gir(t, an(3, 7), 0.4) * (1 - gir(t, bas(4), 0.4));
  // ---- 5: zahmet engeli erir; balonlar
  const hurdle = gir(t, an(5, 0), 0.4) * (1 - gir(t, an(5, 8), 0.4));
  const melt = gir(t, an(5, 5), 0.8);
  const talk = gir(t, an(5, 13), 0.5) * (1 - gir(t, bas(6), 0.4));
  const lesson = gir(t, an(5, 8), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6: mağazan
  const shop = gir(t, bas(6), 0.8);
  const slots = gir(t, an(6, 8), 1.8);
  const timer = gir(t, an(6, 14), 0.4);

  const mapO = 1 - shop;

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {mapO > 0 && (
          <g opacity={mapO * (1 - hurdle * 0.6)}>
            {/* bloklar ve sokaklar */}
            <rect x={90} y={440} width={900} height={850} rx={30} fill={xr > 0.5 ? 'none' : '#E3DED4'} stroke={ink} strokeWidth={4} />
            {VX.map((x) => <rect key={x} x={x - 14} y={440} width={28} height={850} fill={xr > 0.5 ? 'none' : '#FFFFFF'} stroke={xr > 0.5 ? X.cyan : 'none'} strokeOpacity={0.4} />)}
            {HY.map((y) => <rect key={y} x={90} y={y - 14} width={900} height={28} fill={xr > 0.5 ? 'none' : '#FFFFFF'} stroke={xr > 0.5 ? X.cyan : 'none'} strokeOpacity={0.4} />)}
            {/* 600 fit çemberi */}
            {ring > 0 && (
              <g opacity={ring}>
                <circle cx={MC.x} cy={MC.y} r={R600 * karis(0.6, 1, ring)} fill={L.accent} fillOpacity={0.1 + unlock * 0.08} stroke={xr > 0.5 ? X.cyan : L.accent} strokeWidth={5} strokeDasharray="16 12" />
                <text x={MC.x} y={MC.y + R600 + 44} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={28} letterSpacing={3} fill={xr > 0.5 ? X.cyan : L.accent}>600 FİT</text>
              </g>
            )}
            <Shop x={BK.x} y={BK.y} name="BURGER KING" c="#F6D9B0" xr={xr} />
            <Shop x={MC.x} y={MC.y} name="McDONALD'S" c="#F3E3A0" xr={xr} glow={unlock * (1 - gir(t, bas(3), 0.5))} />
            {/* yol izi */}
            {meO > 0 && walkP > 0 && (
              <path d={Array.from({ length: 41 }, (_, i) => { const p = route((i / 40) * walkP); return `${i ? 'L' : 'M'}${p.x} ${p.y}`; }).join(' ')} fill="none" stroke={L.accent} strokeWidth={6} strokeDasharray="4 14" strokeLinecap="round" opacity={meO} />
            )}
            {meO > 0 && <Dot x={me.x} y={me.y} c={L.accent} s={1.3} o={meO} />}
            {/* kilit (çemberin içinde açılır) */}
            {ring > 0 && t < bas(3) && t >= bas(2) && (
              <g transform={`translate(${MC.x - 170},${MC.y - 150})`} opacity={ring}>
                <rect x={-30} y={-6} width={60} height={46} rx={8} fill={unlock > 0.5 ? L.good : L.ink} />
                <path d={`M-18 -6 v-16 a18 18 0 0 1 36 0 ${unlock > 0.5 ? 'v-6' : 'v16'}`} fill="none" stroke={unlock > 0.5 ? L.good : L.ink} strokeWidth={8} transform={unlock > 0.5 ? 'translate(16,-8) rotate(20)' : undefined} />
              </g>
            )}
            {/* indirme akını */}
            {crowdO > 0 && CROWD.map((c, i) => {
              const u = gir(t, an(3, 2) + c.d, 1.8) * flow;
              const ang = (i * 47) % 360 * Math.PI / 180;
              const tx = MC.x + Math.cos(ang) * R600 * 0.75 * ((i % 4) / 4 + 0.2);
              const ty = MC.y + Math.sin(ang) * R600 * 0.75 * ((i % 4) / 4 + 0.2);
              return <Dot key={i} x={karis(c.x, tx, u)} y={karis(c.y, ty, u)} c={xr > 0.5 ? X.cyan : ['#2E5E8C', '#E8402A', '#2E9E5B', '#8C5E9E'][i % 4]} s={0.7} o={crowdO} />;
            })}
            {/* konuşma balonları: herkes anlatıyor */}
            {talk > 0 && CROWD.filter((_, i) => i % 5 === 0).map((c, i) => (
              <g key={i} transform={`translate(${Math.min(900, Math.max(180, c.x))},${Math.min(1200, Math.max(520, c.y)) - 40}) scale(${gir(t, an(5, 13) + i * 0.08, 0.3)})`}>
                <path d="M-46 -34 h92 a12 12 0 0 1 12 12 v30 a12 12 0 0 1 -12 12 h-60 l-14 14 v-14 h-18 a12 12 0 0 1 -12 -12 v-30 a12 12 0 0 1 12 -12 z" fill="#FFFFFF" stroke={L.ink} strokeWidth={3} />
                {[0, 1, 2].map((k) => <circle key={k} cx={-20 + k * 20} cy={-8} r={5} fill={L.ink} />)}
              </g>
            ))}
          </g>
        )}

        {/* 1: 1 sentlik Whopper */}
        {cent > 0 && (
          <g opacity={cent} transform={`translate(540,880) scale(${0.85 + 0.15 * cent})`}>
            <rect x={-300} y={-170} width={600} height={340} rx={36} fill="#FFFFFF" stroke={L.ink} strokeWidth={6} />
            <g transform="translate(-140,0)">
              <path d="M-90 -10 q90 -110 180 0 z" fill="#E1A54B" stroke={L.ink} strokeWidth={5} />
              <rect x={-96} y={-10} width={192} height={18} rx={8} fill="#2E9E5B" />
              <rect x={-92} y={8} width={184} height={30} rx={12} fill="#6B3B22" />
              <path d="M-90 38 h180 q0 40 -40 40 h-100 q-40 0 -40 -40 z" fill="#E1A54B" stroke={L.ink} strokeWidth={5} />
            </g>
            <text x={150} y={30} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={110} fill={L.accent}>1 sent</text>
          </g>
        )}

        {/* 3: indirme etiketi + App Store birincisi */}
        {dl > 0 && (
          <g opacity={dl} transform="translate(120,500)">
            <rect x={0} y={0} width={500} height={130} rx={24} fill={L.ink} />
            <text x={30} y={68} fontFamily="Outfit" fontWeight={800} fontSize={60} fill="#FFFFFF">1,5 milyon</text>
            <text x={30} y={108} fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill="#FFFFFF" opacity={0.7}>İNDİRME · ŞİRKETE GÖRE</text>
          </g>
        )}
        {top1 > 0 && (
          <g opacity={top1} transform={`translate(800,1180) scale(${0.8 + 0.2 * top1})`}>
            <rect x={-170} y={-50} width={340} height={100} rx={50} fill={L.accent} />
            <text y={14} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={38} fill="#FFFFFF">App Store'da 1.</text>
          </g>
        )}

        {/* 5: indirme zahmeti engeli erir */}
        {hurdle > 0 && (
          <g opacity={hurdle} transform="translate(540,880)" stroke={X.cyan} fill="none" strokeWidth={6}>
            <rect x={-300} y={karis(-160, 120, melt)} width={600} height={karis(280, 20, melt)} rx={18} fill={X.bg} />
            <text y={karis(-10, 116, melt)} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={karis(40, 22, melt)} letterSpacing={4} fill={X.cyan} stroke="none">İNDİRME ZAHMETİ</text>
            <text y={-220} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={90} fill={X.cyan} stroke="none" opacity={gir(t, an(5, 1), 0.4)}>1 sent</text>
          </g>
        )}

        {/* 6: mağazan — sembolik fiyat, ilk 100 hesap, süre */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <rect x={150} y={500} width={300} height={300} rx={24} fill="#F6E7C8" stroke={L.ink} strokeWidth={4} />
            <g transform="translate(300,670)">
              <path d="M-80 -60 h160 l20 160 h-200 z" fill={L.accent} stroke={L.ink} strokeWidth={5} />
              <path d="M-40 -60 v-30 a40 40 0 0 1 80 0 v30" fill="none" stroke={L.ink} strokeWidth={8} />
            </g>
            <text x={500} y={570} fontFamily="Outfit" fontWeight={800} fontSize={40} fill={L.ink}>Sembolik fiyat</text>
            <text x={500} y={630} fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted}>HESAP AÇAN İLK 100 KİŞİ</text>
            {Array.from({ length: 100 }, (_, i) => (
              <rect key={i} x={150 + (i % 20) * 39} y={850 + Math.floor(i / 20) * 39} width={30} height={30} rx={6} fill={slots * 100 > i ? L.accent : L.line} />
            ))}
            {timer > 0 && (
              <g opacity={timer} transform="translate(800,720)">
                <circle r={60} fill="#FFFFFF" stroke={L.ink} strokeWidth={6} />
                <path d={`M0 0 L0 -40 M0 0 L${Math.sin(t * 2) * 30} ${-Math.cos(t * 2) * 30}`} stroke={L.accent} strokeWidth={6} strokeLinecap="round" />
                <text y={100} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill={L.muted}>SÜRE AÇIK</text>
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={1 - gir(t, bas(1), 0.4)}>
          <span>Müşterisini</span>
          <span style={{ display: 'block', color: L.accent }}>rakibe gönderdi.</span>
        </Headline>
        <Headline show={lesson}>
          <span>Rakibin kapısında</span>
          <span style={{ display: 'block', color: L.accent }}>oynanan oyun.</span>
        </Headline>
      </WorldQc>
      <div style={{ position: 'absolute', left: 90, top: 300, fontFamily: 'JetBrains Mono, monospace', fontSize: 34, letterSpacing: 4, color: L.ink, opacity: gir(t, bas(1), 0.4) * (1 - gir(t, bas(2), 0.4)) }}>
        2018
      </div>
    </AbsoluteFill>
  );
}
