// Dünya: "Seçim yükü" (Iyengar & Lepper reçel standı). Tek sahne: tenteli bir tadım masası; 24 kavanoz 6'ya iner,
// masa ikiye ayrılır, duranlar ve alanlar sayılır, röntgende karar çizgileri görünür, kararsız müşteri yürüyüp gider.
// Bölümler: 0 kanca, 1 yirmi dört, 2 altı, 3 duranlar, 4 alanlar, 5 röntgen, 6 karar, 7 ders, 8 mağazan, 9 REHBER.
import { AbsoluteFill } from 'remotion';
import { FONT, W } from '../theme.ts';
import { Figure, gir, Headline, karis, L, mix, PaperDefs, Person, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const JAM = ['#B23A48', '#E09F3E', '#7B2D26', '#9E2A2B', '#D17A22', '#6A994E', '#C9184A', '#F4A259'];

function Jar({ x, y, s, c, xr, o = 1 }: { x: number; y: number; s: number; c: string; xr: number; o?: number }) {
  const line = mix('#BFB8AA', X.cyan, xr);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <rect x={-20} y={-74} width={40} height={14} rx={4} fill={mix(L.ink, X.bg, xr)} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />
      <rect x={-26} y={-62} width={52} height={62} rx={12} fill={mix('#FFFFFF', X.bg, xr)} stroke={line} strokeWidth={3} />
      <rect x={-21} y={-44} width={42} height={40} rx={9} fill={c} opacity={1 - xr * 0.85} />
      <rect x={-14} y={-34} width={28} height={12} rx={3} fill="#fff" opacity={0.85 * (1 - xr)} />
    </g>
  );
}

/** Tenteli tadım masası; jars: kavanoz konumları (masa koordinatı), cx merkez, sc ölçek. */
function Stand({ cx, cy, sc, xr, sign, children, over }: { cx: number; cy: number; sc: number; xr: number; sign: string; children: React.ReactNode; over?: React.ReactNode }) {
  const ink = mix(L.ink, X.cyan, xr);
  // Yalnız üst katman (masanın önüne çizilecek çizgiler için).
  if (!sign) return <g transform={`translate(${cx},${cy}) scale(${sc})`}>{over}</g>;
  return (
    <g transform={`translate(${cx},${cy}) scale(${sc})`}>
      {/* tente */}
      <g>
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={-400 + i * 80} y={-360} width={80} height={90} fill={xr > 0.5 ? 'none' : i % 2 ? '#FFFFFF' : L.accent} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />
        ))}
        {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${-400 + i * 80} -270 a40 40 0 0 0 80 0 z`} fill={xr > 0.5 ? 'none' : i % 2 ? '#FFFFFF' : L.accent} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />)}
        <rect x={-120} y={-420} width={240} height={64} rx={12} fill={mix(L.ink, X.bg, xr)} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={3} />
        <text y={-376} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={32} letterSpacing={6} fill={xr > 0.5 ? X.cyan : '#fff'}>{sign}</text>
      </g>
      {/* direkler */}
      <rect x={-392} y={-270} width={14} height={300} fill={ink} opacity={0.6} />
      <rect x={378} y={-270} width={14} height={300} fill={ink} opacity={0.6} />
      {children}
      {/* masa */}
      <rect x={-400} y={0} width={800} height={34} rx={8} fill={mix('#B07A4A', X.bg, xr)} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={3} />
      <rect x={-380} y={34} width={760} height={110} fill={mix('#9C6B3F', X.bg, xr)} opacity={0.9} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />
      {over}
    </g>
  );
}

// Kavanoz yerleşimleri (masa koordinatı): 24 → iki sıra, 6 → tek sıra, büyük.
const lay24 = (i: number) => ({ x: -330 + (i % 12) * 60, y: i < 12 ? -2 : -86, s: 0.95 });
const lay6 = (i: number) => ({ x: -300 + i * 120, y: -2, s: 1.6 });

export function Recel({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(5), 0.5) * (1 - gir(t, bas(6), 0.6));
  const bg = mix(L.bg, X.bg, xr);

  // Kavanoz düzeni: m24 = 1 → 24 kavanoz, 0 → 6 kavanoz.
  // Kanca: masa 24 ↔ 6 arasında gidip gelir (izleyici tahmin etsin). 1: 24; 2: 6'ya iner; 3–6: solda 24; 7: 6'ya iner.
  const ph = Math.floor(t / 0.9);
  const toggle = karis(ph % 2 ? 1 : 0, ph % 2 ? 0 : 1, gir(t, ph * 0.9, 0.35));
  const down = gir(t, an(2, 0), 0.9);
  const sixAgain = gir(t, bas(7), 0.8);
  const m24 = t < bas(1) ? toggle : t < bas(2) ? 1 : t < bas(3) ? 1 - down : t < bas(7) ? gir(t, bas(3), 1.0) : 1 - sixAgain;
  // 3–5: masa ikiye ayrılır (solda 24, sağda 6).
  const split = gir(t, bas(3), 1.0) * (1 - gir(t, bas(6), 1.0));
  const single = 1 - split;
  // 6: tek masa (24) önünde kararsız müşteri; 7: 6'lı masada alan müşteri.
  const phone = gir(t, bas(8), 0.8);

  const jarsOn = (mode24: number, xrr: number, o = 1) =>
    Array.from({ length: 24 }, (_, i) => {
      const a = lay24(i);
      const b = i < 6 ? lay6(i) : a;
      const m = mode24;
      const p = { x: karis(b.x, a.x, m), y: karis(b.y, a.y, m), s: karis(b.s, a.s, m) };
      const vis = i < 6 ? 1 : m;
      return <Jar key={i} x={p.x} y={p.y} s={p.s} c={JAM[i % JAM.length]} xr={xrr} o={vis * o} />;
    });

  // İnsan sıraları (10 kişi): duranlar / alanlar.
  const row = (cx: number, lit: number, color: string, show: number, jarOver = false) => (
    <g opacity={show}>
      {Array.from({ length: 10 }, (_, i) => {
        const on = Math.max(0, Math.min(1, lit - i));
        return (
          <g key={i}>
            <Person x={cx - 180 + i * 40} y={1130} s={2.2} c={on > 0 ? color : mix('#BDB7AC', X.cyan, xr * 0.5)} o={on > 0 ? 0.35 + 0.65 * on : 0.8} />
            {jarOver && on > 0 && <Jar x={cx - 180 + i * 40} y={1085} s={0.32} c={JAM[i]} xr={xr} o={on} />}
          </g>
        );
      })}
    </g>
  );
  const durS = gir(t, an(3, 4), 0.8) * (1 - gir(t, bas(4), 0.4));
  const alS = gir(t, an(4, 4), 0.8) * (1 - gir(t, bas(5), 0.3));
  const alL = gir(t, an(4, 11), 0.8) * (1 - gir(t, bas(5), 0.3));

  // Röntgen: göz çizgileri (bir müşteriden kavanozlara).
  const scan = gir(t, bas(5) + 0.1, 1.3);

  // Kararsız müşteri (6): durur, düşünür, yürüyüp gider.
  const thinkIn = gir(t, an(6, 0), 0.6);
  const leave = gir(t, an(6, 7), 1.6);
  const bubble = gir(t, an(6, 4), 0.4) * (1 - leave);

  const sl = { cx: karis(540, 290, split), cy: karis(1000, 900, split), sc: karis(1, 0.56, split) };
  void single;
  const sr = { cx: karis(1300, 790, split), cy: 900, sc: 0.56 };

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />
        {/* zemin çizgisi */}
        <rect x={0} y={1180} width={1080} height={4} fill={mix(L.line, X.cyan, xr)} opacity={0.6} />

        {/* sol / tek masa */}
        <g opacity={1 - phone}>
          <Stand cx={sl.cx} cy={sl.cy} sc={sl.sc} xr={xr} sign={m24 > 0.5 ? '24 ÇEŞİT' : '6 ÇEŞİT'}>
            {jarsOn(m24, xr)}
          </Stand>
          {/* röntgen: göz çizgileri, solda karmaşa (masanın önünde) */}
          {xr > 0 && <Stand cx={sl.cx} cy={sl.cy} sc={sl.sc} xr={xr} sign="" over={Array.from({ length: 24 }, (_, i) => {
            const a = lay24(i);
            return <line key={i} x1={0} y1={430} x2={karis(0, a.x, scan)} y2={karis(430, a.y - 30, scan)} stroke={X.cyan} strokeWidth={3} opacity={0.8 * xr} />;
          })}>{null}</Stand>}
          {/* sağ masa (6) */}
          {split > 0 && (
            <Stand cx={sr.cx} cy={sr.cy} sc={sr.sc} xr={xr} sign="6 ÇEŞİT">
              {jarsOn(0, xr)}
            </Stand>
          )}
          {split > 0 && xr > 0 && <Stand cx={sr.cx} cy={sr.cy} sc={sr.sc} xr={xr} sign="" over={Array.from({ length: 6 }, (_, i) => {
            const a = lay6(i);
            return <line key={i} x1={0} y1={430} x2={karis(0, a.x, scan)} y2={karis(430, a.y - 40, scan)} stroke={X.cyan} strokeWidth={4} opacity={0.8 * xr} />;
          })}>{null}</Stand>}
          {/* röntgende "göz" */}
          {xr > 0 && [sl.cx, sr.cx].map((x, i) => (
            <g key={i} opacity={xr}><circle cx={x} cy={900 + 430 * 0.56} r={18} fill="none" stroke={X.cyan} strokeWidth={4} /><circle cx={x} cy={900 + 430 * 0.56} r={6} fill={X.cyan} /></g>
          ))}
          {xr > 0 && (
            <g opacity={gir(t, bas(5) + 0.9, 0.4) * xr} fontFamily="JetBrains Mono" fontSize={30} fill={X.cyan} textAnchor="middle">
              <text x={sl.cx} y={1150}>24 SEÇENEK</text><text x={sr.cx} y={1150}>6 SEÇENEK</text>
            </g>
          )}

          {/* duranlar / alanlar */}
          {split > 0.5 && xr < 0.05 && (
            <g>
              {row(sl.cx, 6 * gir(t, an(3, 4), 0.8), L.ink, durS)}
              {row(sr.cx, 4 * gir(t, an(3, 9), 0.8), L.ink, durS)}
              {row(sl.cx, 0.3 * gir(t, an(4, 11), 0.6), L.accent, alL, true)}
              {row(sr.cx, 3 * gir(t, an(4, 4), 0.8), L.accent, alS, true)}
              <g fontFamily="Outfit" fontWeight={800} textAnchor="middle">
                <text x={sl.cx} y={1260} fontSize={84} fill={L.ink} opacity={durS}>%60</text>
                <text x={sr.cx} y={1260} fontSize={84} fill={L.ink} opacity={gir(t, an(3, 9), 0.4) * durS}>%40</text>
                <text x={sl.cx} y={1260} fontSize={84} fill={L.accent} opacity={alL}>%3</text>
                <text x={sr.cx} y={1260} fontSize={84} fill={L.accent} opacity={alS}>%30</text>
              </g>
              <g fontFamily="JetBrains Mono" fontSize={26} fill={L.muted} textAnchor="middle" opacity={Math.max(durS, alS)}>
                <text x={540} y={560}>{durS > alS ? 'DURANLAR' : 'SATIN ALANLAR'}</text>
              </g>
            </g>
          )}

          {/* kararsız müşteri (6) ve alan müşteri (7) */}
          {t >= bas(6) && t < bas(8) && (
            <g>
              {sixAgain < 1 && (
                <g opacity={thinkIn * (1 - sixAgain)}>
                  <Figure x={karis(540, -120, leave)} y={1180} s={1.4} walk={leave > 0 ? t * 1.6 : 0} />
                  {bubble > 0 && (
                    <g opacity={bubble} transform={`translate(${540 + 110},${880})`}>
                      <ellipse rx={170} ry={70} fill="#fff" stroke={L.line} strokeWidth={3} />
                      <circle cx={-120} cy={80} r={14} fill="#fff" stroke={L.line} strokeWidth={3} />
                      <text y={12} textAnchor="middle" fontFamily="Outfit" fontWeight={600} fontSize={36} fill={L.ink}>Sonra bakarım…</text>
                    </g>
                  )}
                  {/* soru işaretleri çoğalır */}
                  {Array.from({ length: 6 }, (_, i) => (
                    <text key={i} x={540 + Math.cos(i * 1.1) * 120} y={820 + Math.sin(i * 1.7) * 40} fontFamily="Outfit" fontWeight={800} fontSize={54} fill={L.accent}
                      opacity={gir(t, an(6, 1) + i * 0.18, 0.3) * (1 - bubble)}>?</text>
                  ))}
                </g>
              )}
              {sixAgain > 0 && <Figure x={540} y={1180} s={1.4} face={1} />}
              {sixAgain > 0 && <Jar x={575} y={1050} s={0.9} c={JAM[0]} xr={0} o={gir(t, bas(7) + 0.5, 0.4)} />}
            </g>
          )}
        </g>

        {/* 8: mağazanın kategori sayfası */}
        {phone > 0 && (
          <g opacity={phone} transform={`translate(540,${karis(1100, 860, phone)})`}>
            <rect x={-230} y={-430} width={460} height={860} rx={50} fill={L.ink} />
            <rect x={-210} y={-410} width={420} height={820} rx={38} fill="#fff" />
            <text x={-170} y={-340} fontFamily="Outfit" fontWeight={800} fontSize={30} fill={L.ink}>Senin mağazan</text>
            <text x={-170} y={-300} fontFamily="JetBrains Mono" fontSize={20} fill={L.muted}>KATEGORİ · REÇEL</text>
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${-170},${-260 + i * 150})`} opacity={gir(t, an(8, 8) + i * 0.15, 0.4)}>
                <rect width={340} height={130} rx={20} fill={L.paper} stroke={L.accent} strokeWidth={4} />
                <Jar x={60} y={110} s={1.1} c={JAM[i]} xr={0} />
                <rect x={130} y={34} width={150} height={16} rx={8} fill={L.ink} />
                <rect x={130} y={64} width={100} height={12} rx={6} fill={L.line} />
                <rect x={130} y={90} width={130} height={26} rx={13} fill={L.accent} />
                <text x={195} y={109} textAnchor="middle" fontFamily="Outfit" fontWeight={700} fontSize={16} fill="#fff">EN ÇOK SATAN</text>
              </g>
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x={-170 + (i % 4) * 88} y={200 + Math.floor(i / 4) * 80} width={76} height={64} rx={12} fill={L.line} opacity={0.6 * (1 - gir(t, an(8, 4), 0.6) * 0.7)} />
            ))}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={1 - gir(t, bas(1), 0.4)}>
          <span>24 çeşit mi, 6 çeşit mi?</span>
          <span style={{ display: 'block', color: L.accent }}>Tahmin et.</span>
        </Headline>
        <Headline show={gir(t, bas(7), 0.5) * (1 - gir(t, bas(8), 0.4))}>
          <span>Çok çeşit,</span>
          <span style={{ display: 'block', color: L.accent }}>çok satış demek değil.</span>
        </Headline>
      </WorldQc>
      <div style={{ display: 'none', fontFamily: FONT.sans }} />
    </AbsoluteFill>
  );
}
