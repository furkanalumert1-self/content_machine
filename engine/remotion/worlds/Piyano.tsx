// Dünya: "Piyano merdiven" (Volkswagen / DDB Stockholm, Odenplan 2009). Tek dünya: metro çıkışı, solda merdiven, sağda yürüyen merdiven.
// Kalıp: Gerçek olay. Piyano merdiven (kanca) → geçmişe dönüş: gri merdiven boş, yürüyen merdiven dolu → bir gece basamaklar
// tuşa dönüşür, basan nota çıkarır → insanlar merdivene geçer (%66, kampanyanın ölçümü) → röntgen: adım → nota → keyif döngüsü
// → ders → mağazan: tuşlardan bir ilerleme çubuğu, ardından 2 haftalık test.
// Bölümler: 0 kanca, 1 2009 Stockholm, 2 bir gece, 3 %66, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const N = 12; // basamak
const CONCRETE = '#BDB8AF';
const WALL = '#D9D4CB';

/** i. basamağın (0 alt, N-1 üst) perspektif ölçüleri. */
function stepGeo(i: number, side: 'm' | 'y') {
  const u = i / (N - 1);
  const y = karis(1235, 600, Math.pow(u, 0.92));
  const w = karis(360, 210, u);
  const cx = side === 'm' ? karis(320, 445, u) : karis(770, 640, u);
  const h = karis(56, 34, u);
  return { y, w, cx, h, u };
}

/** Yürüyen merdiven/merdiven üstünde p (0 alt, 1 üst) konumu. */
function along(p: number, side: 'm' | 'y') {
  const g = stepGeo(Math.max(0, Math.min(1, p)) * (N - 1), side);
  return { x: g.cx, y: g.y - g.h * 0.2, s: karis(3.0, 1.9, p) };
}

function Note({ x, y, s, o, c }: { x: number; y: number; s: number; o: number; c: string }) {
  if (o <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(-12)`} opacity={o}>
      <ellipse cx={0} cy={0} rx={14} ry={10} fill={c} />
      <path d="M12 -2 V-52 q16 6 20 22" fill="none" stroke={c} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

function Man({ x, y, s, c, o = 1, smile = 0 }: { x: number; y: number; s: number; c: string; o?: number; smile?: number }) {
  if (o <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <circle cy={-14} r={7.5} fill={c} />
      <rect x={-7} y={-5} width={14} height={18} rx={7} fill={c} />
      {smile > 0 && <path d="M-3.2 -13 q3.2 3 6.4 0" fill="none" stroke="#fff" strokeWidth={1.4} opacity={smile} />}
    </g>
  );
}

export function Piyano({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);

  // ---- röntgen: 4. bölümden "insanlar"a kadar (5. bölümün 12. kelimesi)
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 12), 0.6));
  const ink = mix(L.ink, X.cyan, xr);
  const bg = mix(L.bg, X.bg, xr);

  // ---- piyano hâli: kancada açık; "2009" ile gri; "her basamağı" ile basamak basamak tuş
  const hookKeys = 1 - gir(t, an(1, 0), 0.5);
  const keyAt = (i: number) => Math.max(hookKeys, gir(t, an(2, 3) + i * 0.11, 0.35));
  // ---- gece: "Bir gece" ile kararır, tuşlar bitince açılır
  const night = gir(t, an(2, 0), 0.5) * (1 - gir(t, an(2, 7), 0.8));

  // ---- merdivende çıkan biri: kancada ve "Bastıkça" ile; her basamakta nota
  const climbLoop = (t0: number, dur: number) => (t < t0 ? -1 : ((t - t0) % dur) / dur);
  const climber = t < bas(1) ? climbLoop(0, 3.4) : t >= an(2, 8) && t < bas(4) ? climbLoop(an(2, 8), 3.4) : -1;

  // ---- kalabalık: yürüyen merdivende sürekli; merdivende 3. bölümden itibaren çoğalır
  const toStairs = gir(t, an(3, 6), 1.2) * (1 - gir(t, bas(6), 0.5));
  const lesson = gir(t, an(5, 12), 0.6) * (1 - gir(t, bas(6), 0.5));
  const stairsCrowd = Math.max(toStairs, lesson);
  const escCount = t < an(3, 6) ? 9 : Math.round(karis(9, 4, stairsCrowd));
  const stairsCount = Math.round(karis(t >= bas(1) && t < bas(2) ? 0 : 1, 7, stairsCrowd));

  // ---- %66 (kampanyanın ölçümü): iki çubuk
  const chart = gir(t, an(3, 8), 0.5) * (1 - gir(t, bas(4), 0.5));
  const grow = gir(t, an(3, 9), 0.9);

  // ---- röntgen döngüsü: ayak izi → nota → gülümseme
  const loop = gir(t, bas(4) + 0.3, 0.6) * (1 - gir(t, an(5, 12), 0.5));
  const loopStep = [gir(t, an(5, 2), 0.4), gir(t, an(5, 5), 0.4), gir(t, an(5, 10), 0.4)];

  // ---- 6: mağazan — tuşlardan ilerleme çubuğu
  const shop = gir(t, bas(6), 0.8);
  const fill = gir(t, an(6, 5), 1.6); // "ilerleme çubuğu"
  const msg = gir(t, an(6, 8), 0.4);
  const days = gir(t, an(6, 12), 0.5);

  const sceneO = (1 - shop) * (1 - loop * 0.85);
  const people = (side: 'm' | 'y', count: number, speed: number, color: string) =>
    Array.from({ length: 9 }, (_, k) => {
      const p = ((k / 9 + t * speed) % 1 + 1) % 1;
      const a = along(p, side);
      const o = k < count ? Math.min(1, p * 8, (1 - p) * 8) : 0;
      return <Man key={`${side}${k}`} x={a.x + (side === 'y' ? (k % 2 ? 26 : -26) : (k % 2 ? 40 : -40))} y={a.y} s={a.s} c={xr > 0.5 ? X.cyan : color} o={o} smile={side === 'm' ? stairsCrowd : 0} />;
    });

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {sceneO > 0 && (
          <g opacity={sceneO}>
            {/* duvar ve çıkış ağzı */}
            <rect x={0} y={480} width={1080} height={820} fill={mix(WALL, X.bg, xr)} />
            <path d="M220 600 Q540 430 860 600 L860 620 L220 620 z" fill={mix('#2B2B2B', X.bg, xr)} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={3} />
            <rect x={0} y={1240} width={1080} height={60} fill={mix('#8E887E', X.bg, xr)} />

            {/* merdiven (sol): gri beton → piyano tuşları */}
            {Array.from({ length: N }, (_, i) => {
              const g = stepGeo(i, 'm');
              const k = keyAt(i);
              const black = i % 2 === 1;
              const pressed = climber >= 0 && Math.floor(climber * N) === i ? 6 : 0;
              const keyFill = black ? '#151515' : '#FFFFFF';
              const fillC = xr > 0.5 ? 'none' : mix(CONCRETE, keyFill, k);
              const kw = black ? g.w * karis(1, 0.72, k) : g.w;
              return (
                <g key={i}>
                  {black && k > 0 && <rect x={g.cx - g.w / 2} y={g.y - g.h + pressed} width={g.w} height={g.h} fill={xr > 0.5 ? 'none' : mix(CONCRETE, '#FFFFFF', k)} stroke={xr > 0.5 ? X.cyan : '#6E6A63'} strokeWidth={2} />}
                  <rect x={g.cx - kw / 2} y={g.y - g.h + pressed} width={kw} height={black ? g.h * karis(1, 0.82, k) : g.h} rx={black ? 4 : 2} fill={fillC} stroke={xr > 0.5 ? X.cyan : '#6E6A63'} strokeWidth={2} />
                </g>
              );
            })}
            {/* yürüyen merdiven (sağ) */}
            {Array.from({ length: N }, (_, i) => {
              const g = stepGeo(i, 'y');
              const shift = ((t * 1.1) % 1) * 0;
              return <rect key={i} x={g.cx - g.w / 2} y={g.y - g.h + shift} width={g.w} height={g.h} fill={xr > 0.5 ? 'none' : '#9AA0A6'} stroke={xr > 0.5 ? X.cyan : '#6D737A'} strokeWidth={2} />;
            })}
            {/* yürüyen merdiven basamak çizgileri akar */}
            {Array.from({ length: 22 }, (_, j) => {
              const p = ((j / 22 + t * 0.12) % 1);
              const g = stepGeo(p * (N - 1), 'y');
              return <line key={j} x1={g.cx - g.w / 2 + 6} x2={g.cx + g.w / 2 - 6} y1={g.y - g.h / 2} y2={g.y - g.h / 2} stroke={xr > 0.5 ? X.cyan : '#7C838A'} strokeWidth={2} opacity={0.6} />;
            })}
            {/* trabzanlar */}
            {(['m', 'y'] as const).map((side) => [-1, 1].map((d) => {
              const a = stepGeo(0, side), b = stepGeo(N - 1, side);
              return <line key={side + d} x1={a.cx + (d * a.w) / 2} y1={a.y - 90} x2={b.cx + (d * b.w) / 2} y2={b.y - 60} stroke={ink} strokeWidth={side === 'y' ? 10 : 5} strokeLinecap="round" opacity={0.75} />;
            }))}

            {/* insanlar */}
            {people('y', escCount, 0.05, '#4B5560')}
            {people('m', stairsCount, 0.04, L.accent)}

            {/* tuşa basan: her basamakta bir nota yükselir */}
            {climber >= 0 && (() => {
              const a = along(climber, 'm');
              return <Man x={a.x} y={a.y + 4} s={a.s * 1.15} c={xr > 0.5 ? X.cyan : L.accent} smile={1} />;
            })()}
            {climber >= 0 && Array.from({ length: N }, (_, i) => {
              const born = i / N;
              const age = climber - born;
              if (age < 0 || age > 0.35) return null;
              const g = stepGeo(i, 'm');
              return <Note key={i} x={g.cx + 150 + (i % 3) * 20} y={g.y - 40 - age * 600} s={1.1} o={1 - age / 0.35} c={xr > 0.5 ? X.cyan : L.ink} />;
            })}

            {/* gece */}
            <rect x={0} y={0} width={1080} height={1920} fill="#0A1220" opacity={night * 0.55} />
          </g>
        )}

        {/* 3: %66 — normal gün / piyano günü */}
        {chart > 0 && (
          <g opacity={chart} transform="translate(540,450)">
            <rect x={-360} y={-140} width={720} height={250} rx={28} fill="#FFFFFF" stroke={L.line} strokeWidth={3} />
            {[{ y: -70, v: 1, c: '#9AA0A6', l: 'NORMAL' }, { y: 0, v: karis(1, 1.66, grow), c: L.accent, l: 'O GÜN' }].map((r) => (
              <g key={r.l}>
                <text x={-330} y={r.y + 30} fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill={L.muted}>{r.l}</text>
                <rect x={-200} y={r.y} width={300 * r.v / 1.66} height={44} rx={10} fill={r.c} />
              </g>
            ))}
            <text x={330} y={36} textAnchor="end" fontFamily="Outfit" fontWeight={800} fontSize={60} fill={L.accent} opacity={grow}>%66</text>
          </g>
        )}

        {/* röntgen: adım → nota → keyif döngüsü */}
        {loop > 0 && (
          <g opacity={loop} transform="translate(540,800)" fill="none" stroke={X.cyan} strokeWidth={5} strokeLinecap="round">
            <circle r={300} strokeDasharray="14 18" opacity={0.5} />
            {/* ayak izi */}
            <g transform="translate(0,-300)" opacity={0.35 + 0.65 * loopStep[0]}>
              <circle r={70} fill={X.bg} />
              <path d="M-14 26 q-14 -40 4 -60 q18 -10 18 22 q0 26 -22 38 z" fill={X.cyan} stroke="none" />
              <circle cx={-4} cy={-48} r={6} fill={X.cyan} stroke="none" />
              <circle cx={10} cy={-44} r={5} fill={X.cyan} stroke="none" />
            </g>
            {/* nota */}
            <g transform="translate(260,150)" opacity={0.35 + 0.65 * loopStep[1]}>
              <circle r={70} fill={X.bg} />
              <Note x={-6} y={22} s={1.4} o={1} c={X.cyan} />
            </g>
            {/* gülümseme */}
            <g transform="translate(-260,150)" opacity={0.35 + 0.65 * loopStep[2]}>
              <circle r={70} fill={X.bg} />
              <circle r={40} />
              <circle cx={-13} cy={-8} r={4} fill={X.cyan} />
              <circle cx={13} cy={-8} r={4} fill={X.cyan} />
              <path d="M-16 10 q16 16 32 0" />
            </g>
            {/* oklar */}
            <path d="M80 -250 Q220 -160 250 60" markerEnd="" />
            <path d="M190 210 Q0 300 -190 210" />
            <path d="M-250 60 Q-220 -160 -80 -250" />
          </g>
        )}

        {/* 6: mağazan — tuşlardan ilerleme çubuğu */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect width={1080} height={1920} fill={L.bg} />
            <rect x={90} y={460} width={900} height={560} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <text x={140} y={540} fontFamily="Outfit" fontWeight={800} fontSize={44} fill={L.ink}>Sepetin</text>
            <rect x={140} y={580} width={420} height={22} rx={11} fill={L.line} />
            <rect x={140} y={620} width={300} height={22} rx={11} fill={L.line} />
            {Array.from({ length: N }, (_, i) => {
              const on = fill * N > i + 0.5 && i < 10;
              const black = i % 2 === 1;
              return (
                <rect key={i} x={140 + i * 67} y={black ? 700 : 690} width={60} height={black ? 90 : 120} rx={8}
                  fill={on ? (black ? L.ink : L.accent) : black ? '#CFCAC1' : '#FFFFFF'} stroke={L.ink} strokeWidth={3} />
              );
            })}
            <text x={540} y={900} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={48} fill={L.accent} opacity={msg}>Ücretsiz kargoya az kaldı</text>
            {days > 0 && (
              <g opacity={days} transform="translate(540,1120)">
                <text y={-30} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={26} letterSpacing={3} fill={L.muted}>2 HAFTA SONRA</text>
                {Array.from({ length: 14 }, (_, i) => (
                  <rect key={i} x={-385 + i * 55} y={0} width={45} height={45} rx={8} fill={gir(t, an(6, 12) + i * 0.08, 0.2) > 0.5 ? L.accent : L.line} />
                ))}
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={1 - gir(t, bas(1), 0.4)}>
          <span>Metro merdiveni</span>
          <span style={{ display: 'block', color: L.accent }}>dev bir piyano.</span>
        </Headline>
        <Headline show={lesson}>
          <span>Zor yolu</span>
          <span style={{ display: 'block', color: L.accent }}>kendisi seçti.</span>
        </Headline>
      </WorldQc>
      {/* tarih damgası */}
      <div style={{ position: 'absolute', left: 90, top: 300, fontFamily: 'JetBrains Mono, monospace', fontSize: 34, letterSpacing: 4, color: L.ink, opacity: gir(t, an(1, 0), 0.4) * (1 - gir(t, bas(2), 0.4)) }}>
        2009 · STOCKHOLM
      </div>
    </AbsoluteFill>
  );
}
