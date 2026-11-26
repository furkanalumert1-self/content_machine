// Dünya: "7 milyon kavanoz" (Nutella Unica, İtalya 2017; Dezeen: algoritmayla 7 milyon farklı kavanoz süpermarketlerde satıldı;
// ajans beyanına göre bir ayda tükendi). Logo ve marka yazısı yok: genel kahverengi krema kavanozu, desenli etiket bandı.
// 17.11/25.11 kuralı: 0. kare dolu ve hareketli, ürün görünür (üç kavanoz, etiket desenleri sürekli değişiyor).
// Akış: algoritma desen üretir → raf: her kavanoz farklı → raf boşalır (1 ay, ajans beyanı) → röntgen: aynı krema, "benimki tek"
// → mağazan: 5 farklı desenli kutu, rastgele gönderim, müşteri paylaşır.
// Bölümler: 0 kanca, 1 algoritma, 2 raf, 3 tükendi, 4 röntgen, 5 neden + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const KREMA = '#5A3A26';
const RENK = ['#E8402A', '#F2C14E', '#2E9E5B', '#3B6FD8', '#D94F9B', '#7B4FD9', '#F08A24', '#1BA6A6'];

/** Tohumdan desen: şerit, benek ya da dalga; iki renk. */
function Desen({ seed, w, h }: { seed: number; w: number; h: number }) {
  const k = Math.abs(Math.floor(seed)) % 3;
  const a = RENK[Math.abs(Math.floor(seed * 7)) % RENK.length];
  const b = RENK[Math.abs(Math.floor(seed * 13 + 3)) % RENK.length];
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={a} />
      {k === 0 && Array.from({ length: 6 }, (_, i) => <rect key={i} x={-w / 2 + i * (w / 6)} y={-h / 2} width={w / 12} height={h} fill={b} />)}
      {k === 1 && Array.from({ length: 8 }, (_, i) => <circle key={i} cx={-w / 2 + (i % 4 + 0.5) * (w / 4)} cy={-h / 4 + Math.floor(i / 4) * (h / 2)} r={h / 6} fill={b} />)}
      {k === 2 && [0, 1].map((i) => <path key={i} d={`M${-w / 2} ${-h / 6 + i * h / 3} q${w / 8} ${-h / 4} ${w / 4} 0 t${w / 4} 0 t${w / 4} 0 t${w / 4} 0`} stroke={b} strokeWidth={h / 8} fill="none" />)}
    </g>
  );
}

/** Genel krema kavanozu; xr röntgende yalnız çizgi. */
function Jar({ x, y, s, seed, o = 1, xr = 0, clip }: { x: number; y: number; s: number; seed: number; o?: number; xr?: number; clip: string }) {
  if (o <= 0) return null;
  const c = xr > 0.5 ? X.cyan : '#00000030';
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <rect x={-62} y={-170} width={124} height={170} rx={30} fill={xr > 0.5 ? 'none' : KREMA} stroke={c} strokeWidth={4} />
      <rect x={-54} y={-200} width={108} height={36} rx={8} fill={xr > 0.5 ? 'none' : '#FFFFFF'} stroke={c} strokeWidth={4} />
      {xr <= 0.5 && (
        <>
          <clipPath id={clip}><rect x={-62} y={-130} width={124} height={80} /></clipPath>
          <g clipPath={`url(#${clip})`}><g transform="translate(0,-90)"><Desen seed={seed} w={124} h={80} /></g></g>
        </>
      )}
      <path d="M-40 -150 L-40 -30" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.25} />
    </g>
  );
}

export function Kavanoz({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, bas(6), 0.6));
  const bg = mix(L.bg, X.bg, xr);
  const ink = mix(L.ink, X.cyan, xr);
  const tick = Math.floor(t * 4);

  // ---- kanca: üç kavanoz, desenler değişiyor
  const hook = 1 - gir(t, bas(1), 0.4);
  // ---- 1: algoritma tek kavanoza desen basar
  const algo = gir(t, bas(1), 0.4) * (1 - gir(t, bas(2), 0.4));
  const fast = Math.floor(t * 9);
  // ---- 2–3: raf; sonra boşalır
  const shelf = gir(t, bas(2), 0.4) * (1 - gir(t, bas(4), 0.5));
  const scroll = (t - bas(2)) * 40;
  const empty = gir(t, an(3, 2), Math.max(0.8, bas(4) - an(3, 2) - 0.6));
  const soldTag = gir(t, an(3, 5), 0.4);
  // ---- 5: aynı krema, benimki tek
  const why = gir(t, bas(4) + 0.3, 0.4) * (1 - gir(t, bas(6), 0.4));
  const same = gir(t, an(5, 1), 0.4);
  const mine = gir(t, an(5, 7), 0.4);
  const lesson = gir(t, an(5, 12), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6: mağazan
  const shop = gir(t, bas(6), 0.8);
  const pick = Math.min(4, Math.floor(Math.max(0, t - an(6, 6)) * 3) % 5);
  const share = gir(t, an(6, 10), 0.5);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {hook > 0 && (
          <g opacity={hook}>
            <rect x={110} y={1160} width={860} height={24} rx={6} fill="#C9C2B4" />
            {[0, 1, 2].map((i) => (
              <Jar key={i} x={270 + i * 270} y={1160 - (i === 1 ? 10 : 0)} s={i === 1 ? 2.4 : 2} seed={tick * 3 + i * 5 + 1} clip={`k${i}`} />
            ))}
          </g>
        )}

        {algo > 0 && (
          <g opacity={algo}>
            <Jar x={540} y={1200} s={2.4} seed={fast + 2} clip="algo" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <g key={i} transform={`translate(${170 + i * 148},${560})`}>
                <rect x={-60} y={-40} width={120} height={80} rx={12} fill={L.paper} stroke={i === fast % 6 ? L.accent : L.line} strokeWidth={5} />
                <clipPath id={`sw${i}`}><rect x={-52} y={-32} width={104} height={64} rx={8} /></clipPath>
                <g clipPath={`url(#sw${i})`}><Desen seed={i * 4 + 1} w={104} h={64} /></g>
              </g>
            ))}
            <text x={540} y={650} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={3} fill={L.muted}>ONLARCA DESEN · BİNLERCE RENK</text>
          </g>
        )}

        {shelf > 0 && (
          <g opacity={shelf}>
            {[0, 1, 2].map((r) => <rect key={r} x={90} y={720 + r * 260} width={900} height={18} rx={6} fill="#C9C2B4" />)}
            {Array.from({ length: 24 }, (_, i) => {
              const r = Math.floor(i / 8); const col = i % 8;
              const x = ((col * 140 + scroll * (r % 2 ? -1 : 1)) % 1120 + 1120) % 1120 - 20;
              const gone = gir(t, an(3, 2) + ((i * 7) % 24) * 0.05, 0.25) * (empty > 0 ? 1 : 0);
              return <Jar key={i} x={x} y={720 + r * 260} s={0.95} seed={i * 11 + 3} o={1 - gone} clip={`r${i}`} />;
            })}
            <text x={110} y={480} fontFamily="JetBrains Mono" fontSize={32} letterSpacing={3} fill={L.muted}>2017 · İTALYA · 7 MİLYON KAVANOZ</text>
            {soldTag > 0 && (
              <g opacity={soldTag} transform="translate(540,1000) rotate(-6)">
                <rect x={-330} y={-80} width={660} height={160} rx={20} fill={L.accent} />
                <text y={14} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={64} fill="#FFFFFF">1 AYDA TÜKENDİ</text>
                <text y={58} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill="#FFFFFF" opacity={0.85}>AJANS BEYANINA GÖRE</text>
              </g>
            )}
          </g>
        )}

        {why > 0 && (
          <g opacity={why}>
            {[0, 1].map((i) => (
              <g key={i}>
                <Jar x={330 + i * 420} y={1150} s={2.2} seed={i * 9 + 2} xr={xr} clip={`x${i}`} />
                <rect x={330 + i * 420 - 120} y={1150 - 330} width={240} height={300} rx={50} fill={X.cyan} opacity={0.12 * same} />
              </g>
            ))}
            <text x={540} y={1000} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={90} fill={ink} opacity={same}>=</text>
            <text x={540} y={620} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700} fontSize={32} letterSpacing={3} fill={ink} opacity={same}>AYNI KREMA</text>
            {mine > 0 && (
              <g opacity={mine} transform="translate(750,720) rotate(8)">
                <rect x={-170} y={-46} width={340} height={92} rx={46} fill={L.accent} />
                <text y={14} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={40} fill="#FFFFFF">Benimki tek</text>
              </g>
            )}
          </g>
        )}

        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={840} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <text x={140} y={520} fontFamily="Outfit" fontWeight={800} fontSize={38} fill={L.ink}>Kargo kutuların</text>
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i} transform={`translate(${210 + i * 165},700)`}>
                <rect x={-70} y={-70} width={140} height={140} rx={14} fill={L.line} stroke={i === pick && t > an(6, 6) ? L.accent : 'none'} strokeWidth={8} />
                <clipPath id={`b${i}`}><rect x={-60} y={-60} width={120} height={120} rx={10} /></clipPath>
                <g clipPath={`url(#b${i})`}><Desen seed={i * 7 + 2} w={120} h={120} /></g>
              </g>
            ))}
            <text x={540} y={830} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill={L.muted}>5 DESEN · RASTGELE GÖNDERİM</text>
            {share > 0 && (
              <g opacity={share} transform="translate(540,1040)">
                <rect x={-380} y={-130} width={760} height={260} rx={30} fill={L.ink} />
                <clipPath id="sh"><rect x={-340} y={-90} width={180} height={180} rx={16} /></clipPath>
                <g clipPath="url(#sh)" transform="translate(-250,0)"><Desen seed={pick * 7 + 2} w={180} h={180} /></g>
                <text x={-120} y={-14} fontFamily="Outfit" fontWeight={800} fontSize={44} fill="#FFFFFF">Benimki bu çıktı!</text>
                <text x={-120} y={44} fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill="#FFFFFF" opacity={0.7}>MÜŞTERİ PAYLAŞIMI</text>
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>Hiçbiri aynı değil.</span>
          <span style={{ display: 'block', color: L.accent }}>Hangisi senin?</span>
        </Headline>
        <Headline show={lesson}>
          <span style={{ color: xr > 0.5 ? X.cyan : L.ink }}>Aynı ürün,</span>
          <span style={{ display: 'block', color: L.accent }}>ama benimki tek.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
