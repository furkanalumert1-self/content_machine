// Dünya: "Uydurma isim" (Häagen-Dazs, Reuben Mattus, Bronx; resmî site: 1960'tan beri). Tek dünya: bir dondurma kabı ve etiketi.
// Kalıp: Bu neden var? Kap + "Danimarkalı mı?" → Bronx'ta adam, rafta yüzlerce kap → isim harf harf yazılır → umlaut düşer,
// etiket altınlaşır → röntgen: kalite ve fiyat yukarı, ince bir çizgi → mağazan: gerçek köken yazısı, sahte menşe damgası çizilir.
// Bölümler: 0 kanca, 1 Bronx + raf, 2 isim, 3 umlaut + zanaat, 4 röntgen, 5 açıklama, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { Figure, gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const GOLD = '#C9A24A';
const CREAM = '#F5EEDD';
const NAME = 'Häagen-Dazs';

/** Dondurma kabı. name: görünen harf sayısı; gold: zanaat süsü 0–1; umlaut: ä noktaları 0–1 (düşer). */
function Cup({ x, y, s, xr, name, gold, umlaut, plain = 0 }: { x: number; y: number; s: number; xr: number; name: number; gold: number; umlaut: number; plain?: number }) {
  const ink = mix(L.ink, X.cyan, xr);
  const body = xr > 0.5 ? 'none' : mix(CREAM, '#3B2A20', gold * 0.85);
  const txt = xr > 0.5 ? X.cyan : gold > 0.5 ? GOLD : L.ink;
  const shown = NAME.slice(0, Math.round(name * NAME.length)).replace('ä', umlaut > 0.98 ? 'ä' : 'a');
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={190} rx={150} ry={26} fill="#000" opacity={0.12 * (1 - xr)} />
      <path d="M-170 -170 L-140 180 Q0 200 140 180 L170 -170 z" fill={body} stroke={ink} strokeWidth={6} />
      <ellipse cx={0} cy={-172} rx={172} ry={34} fill={xr > 0.5 ? 'none' : mix('#FFFFFF', '#2A1D16', gold * 0.85)} stroke={ink} strokeWidth={6} />
      {/* etiket bandı */}
      <rect x={-162} y={-40} width={324} height={110} fill={xr > 0.5 ? 'none' : mix('#FFFFFF', '#2A1D16', gold)} stroke={gold > 0 ? GOLD : ink} strokeWidth={gold > 0 ? 6 : 3} opacity={1 - plain} />
      {gold > 0 && <rect x={-152} y={-28} width={304} height={86} fill="none" stroke={GOLD} strokeWidth={2} opacity={gold} />}
      <text x={0} y={30} textAnchor="middle" fontFamily={gold > 0.5 ? 'Instrument Serif, serif' : 'Outfit'} fontStyle={gold > 0.5 ? 'italic' : 'normal'} fontWeight={gold > 0.5 ? 400 : 800} fontSize={gold > 0.5 ? 50 : 40} textLength={gold > 0.5 ? 280 : 270} lengthAdjust="spacingAndGlyphs" fill={txt} opacity={1 - plain}>{shown}</text>
      {/* düşen umlaut noktaları */}
      {umlaut > 0 && umlaut < 0.98 && (
        <g fill={txt}>
          {[-6, 8].map((dx) => <circle key={dx} cx={-56 + dx} cy={karis(-260, -18, umlaut)} r={6} />)}
        </g>
      )}
    </g>
  );
}

function ArrowUp({ x, y, h, label, o, c }: { x: number; y: number; h: number; label: string; o: number; c: string }) {
  if (o <= 0) return null;
  return (
    <g transform={`translate(${x},${y})`} opacity={o}>
      <line x1={0} y1={0} x2={0} y2={-h} stroke={c} strokeWidth={10} strokeLinecap="round" />
      <path d={`M-26 ${-h + 26} L0 ${-h} L26 ${-h + 26}`} fill="none" stroke={c} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <text y={46} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={28} letterSpacing={3} fill={c}>{label}</text>
    </g>
  );
}

export function Isim({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, bas(6), 0.6));
  const bg = mix(L.bg, X.bg, xr);

  // ---- kanca: bitmiş, altın etiketli kap; "Danimarkalı değil" → "New York"
  const hook = 1 - gir(t, bas(1), 0.5);
  const dk = gir(t, an(0, 2), 0.3);
  const dkStrike = gir(t, an(0, 3), 0.3);
  const ny = gir(t, an(0, 4), 0.4);

  // ---- 1: Bronx'ta adam ve arabası; "markette yüzlerce dondurma" → raf
  const man = gir(t, bas(1), 0.6) * (1 - gir(t, an(1, 13), 0.6));
  const shelf = gir(t, an(1, 13), 0.9) * (1 - gir(t, bas(2), 0.8));
  // ---- 2: isim harf harf; "hiçbir dilde anlamı yok" sözlük işareti
  const typed = gir(t, an(2, 3), Math.max(0.8, an(2, 6) - an(2, 3)));
  const nonsense = gir(t, an(2, 6), 0.4) * (1 - gir(t, bas(3), 0.4));
  // ---- 3: umlaut düşer, etiket altınlaşır
  const uml = gir(t, an(3, 2), 0.7);
  const gold = gir(t, an(3, 7), 1.0);
  // ---- 5: kalite ve fiyat yukarı; ince çizgi
  const up1 = gir(t, an(5, 6), 0.5);
  const up2 = gir(t, an(5, 8), 0.5);
  const line = gir(t, an(5, 14), 0.9);
  // ---- 6: mağazan
  const shop = gir(t, bas(6), 0.8);
  const stamp = gir(t, an(6, 12), 0.4);
  const strike = gir(t, an(6, 15), 0.4);

  const cupState = t < bas(1)
    ? { name: 1, gold: 1, uml: 1, plain: 0 }
    : t < bas(2) ? { name: 0, gold: 0, uml: 0, plain: 1 }
    : { name: typed, gold, uml: t < bas(3) ? 0 : uml, plain: 0 };
  // kabın yeri: rafta küçülür ve rafın ortasına oturur
  const cs = karis(1, 0.42, shelf) * karis(1, 0.85, xr) * (1 - shop * 0.4);
  const cx = 540;
  const cy = karis(800, 790, shelf) - shop * 40;

  const SHELF = Array.from({ length: 12 }, (_, i) => ({ x: 225 + (i % 4) * 210, y: 560 + Math.floor(i / 4) * 250 }));

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* 1: Bronx sokağı — adam ve dondurma arabası */}
        {man > 0 && (
          <g opacity={man}>
            <rect x={0} y={1180} width={1080} height={20} fill="#8E887E" />
            {[0, 1, 2, 3].map((i) => <rect key={i} x={60 + i * 250} y={480} width={200} height={700} fill="#C9B9A6" stroke="#A8957E" strokeWidth={3} opacity={0.55} />)}
            <g transform="translate(760,1180)">
              <rect x={-150} y={-230} width={300} height={170} rx={16} fill="#FFFFFF" stroke={L.ink} strokeWidth={5} />
              <circle cx={-90} cy={-40} r={36} fill={L.ink} />
              <circle cx={90} cy={-40} r={36} fill={L.ink} />
              <path d="M-150 -230 l-40 -120 h380 l-40 120" fill={L.accent} stroke={L.ink} strokeWidth={5} />
            </g>
            <Figure x={520} y={1170} s={1.5} walk={(t * 0.8) % 1} face={1} />
            <text x={90} y={1250} fontFamily="JetBrains Mono" fontSize={30} letterSpacing={4} fill={L.ink} opacity={gir(t, an(1, 2), 0.4)}>NEW YORK · BRONX</text>
          </g>
        )}

        {/* 1: raf — yüzlerce benzer kap */}
        {shelf > 0 && (
          <g opacity={shelf}>
            <rect x={110} y={430} width={860} height={800} rx={20} fill="#DDE6EC" stroke="#9FB2C0" strokeWidth={5} />
            {SHELF.map((p, i) => i === 5 ? null : (
              <g key={i} transform={`translate(${p.x},${p.y}) scale(0.42)`}>
                <path d="M-170 -170 L-140 180 Q0 200 140 180 L170 -170 z" fill={['#F2E9E4', '#E8F0E3', '#F6E7C8', '#E9E4F2'][i % 4]} stroke={L.ink} strokeWidth={8} />
                <ellipse cx={0} cy={-172} rx={172} ry={34} fill="#FFFFFF" stroke={L.ink} strokeWidth={8} />
                <rect x={-120} y={-20} width={240} height={50} rx={10} fill={L.line} />
              </g>
            ))}
            {[680, 930].map((y) => <rect key={y} x={110} y={y} width={860} height={10} fill="#9FB2C0" />)}
          </g>
        )}

        {/* kap (kanca, isim, umlaut, röntgen) */}
        {shop < 1 && (
          <g opacity={(1 - shop) * (1 - man)}>
            <Cup x={shelf > 0 ? karis(540, SHELF[5].x, shelf) : cx} y={shelf > 0 ? karis(cy, SHELF[5].y, shelf) : cy} s={cs} xr={xr}
              name={cupState.name} gold={cupState.gold} umlaut={cupState.uml} plain={cupState.plain} />
          </g>
        )}

        {/* kanca: Danimarka? → New York */}
        {hook > 0 && (
          <g opacity={hook} fontFamily="JetBrains Mono" fontSize={34} letterSpacing={4}>
            <g opacity={dk} transform="translate(540,1130)">
              <text textAnchor="middle" fill={L.muted}>DANİMARKA?</text>
              <line x1={-140} x2={karis(-140, 140, dkStrike)} y1={-12} y2={-12} stroke={L.accent} strokeWidth={6} />
            </g>
            <text x={540} y={1200} textAnchor="middle" fill={L.accent} opacity={ny}>NEW YORK</text>
          </g>
        )}

        {/* 2: anlamsız isim — sözlükte yok */}
        {nonsense > 0 && (
          <g opacity={nonsense} transform="translate(540,1130)">
            <rect x={-230} y={-50} width={460} height={90} rx={14} fill="#FFFFFF" stroke={L.ink} strokeWidth={4} />
            <text y={10} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={30} letterSpacing={2} fill={L.ink}>SÖZLÜKTE: —</text>
          </g>
        )}

        {/* 3: umlaut halkası */}
        {t >= an(3, 2) && t < bas(4) && (
          <circle cx={540 - 56 * cs} cy={800 - 20 * cs} r={60} fill="none" stroke={L.accent} strokeWidth={6} opacity={gir(t, an(3, 3), 0.4) * (1 - gir(t, an(3, 7), 0.4))} />
        )}

        {/* 5: kalite ve fiyat zihinde yukarı; ince çizgi */}
        <ArrowUp x={220} y={1130} h={karis(60, 360, up1)} label="KALİTE" o={up1 * (1 - shop)} c={X.cyan} />
        <ArrowUp x={860} y={1130} h={karis(60, 360, up2)} label="FİYAT" o={up2 * (1 - shop)} c={X.cyan} />
        {line > 0 && (
          <line x1={100} x2={karis(100, 980, line)} y1={1060} y2={1060} stroke={L.accent} strokeWidth={4} opacity={1 - shop} />
        )}

        {/* 6: mağazan — gerçek köken yazısı */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={460} width={900} height={760} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <g transform="translate(290,760) scale(0.75)">
              <path d="M-120 -150 h240 v290 q0 30 -30 30 h-180 q-30 0 -30 -30 z" fill="#F6E7C8" stroke={L.ink} strokeWidth={6} />
              <rect x={-130} y={-200} width={260} height={56} rx={12} fill={L.accent} stroke={L.ink} strokeWidth={6} />
              <rect x={-90} y={-40} width={180} height={80} rx={10} fill="#FFFFFF" stroke={L.ink} strokeWidth={4} />
            </g>
            <text x={480} y={600} fontFamily="Outfit" fontWeight={800} fontSize={40} fill={L.ink}>Bu ürünün hikâyesi</text>
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={480} y={640 + i * 44} width={[420, 380, 400, 300, 360][i] * gir(t, an(6, 6) + i * 0.15, 0.4)} height={20} rx={10} fill={L.line} />
            ))}
            {stamp > 0 && (
              <g transform={`translate(700,1050) rotate(-8) scale(${1.3 - 0.3 * stamp})`} opacity={stamp}>
                <rect x={-190} y={-50} width={380} height={100} rx={14} fill="none" stroke={L.muted} strokeWidth={6} />
                <text y={16} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700} fontSize={36} letterSpacing={4} fill={L.muted}>SAHTE MENŞE</text>
                <line x1={-210} y1={50} x2={karis(-210, 210, strike)} y2={-50} stroke={L.accent} strokeWidth={12} strokeLinecap="round" />
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>Danimarkalı değil,</span>
          <span style={{ display: 'block', color: L.accent }}>New Yorklu.</span>
        </Headline>
        <Headline show={gir(t, an(6, 12), 0.5)}>
          <span>Sahte yabancı menşe</span>
          <span style={{ display: 'block', color: L.accent }}>ima etme.</span>
        </Headline>
      </WorldQc>
      {/* yıl damgası */}
      <div style={{ position: 'absolute', left: 90, top: 300, fontFamily: 'JetBrains Mono, monospace', fontSize: 34, letterSpacing: 4, color: L.ink, opacity: gir(t, an(2, 0), 0.4) * (1 - gir(t, bas(3), 0.4)) }}>
        1960 CİVARI
      </div>
    </AbsoluteFill>
  );
}
