// Dünya: "Bu ceketi alma" (Patagonia, NYT ilanı 25 Kasım 2011; resmî hikâye sayfası, David Gelles). Tek dünya: askıdaki ceket ve gazete sayfası.
// Kalıp: Gerçek olay. Kara Cuma vitrini, ceketin etiketinde "ALMA" (kanca) → gazete tam sayfa ilan → 135 litre su (ilana göre),
// alma / onar / yeniden kullan → 57.000 dolarlık ilan çizgisi ↔ 40–50 milyon dolarlık tanıtım (CEO'ya göre) → röntgen: merak + dürüstlük
// → mağazan: "Bu ürünü alma, eğer…" kutusu.
// Bölümler: 0 kanca, 1 ilan, 2 su + onar, 3 tanıtım, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const JACKET = '#2E5E8C';

function Jacket({ x, y, s, xr, tag }: { x: number; y: number; s: number; xr: number; tag: number }) {
  const ink = xr > 0.5 ? X.cyan : L.ink;
  const fill = xr > 0.5 ? 'none' : JACKET;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {/* askı */}
      <path d="M0 -230 q0 -30 24 -30 q20 0 20 20 M0 -230 L-120 -170 H120 z" fill="none" stroke={ink} strokeWidth={6} />
      {/* gövde ve kollar */}
      <path d="M-120 -170 L-200 40 L-160 60 L-120 -40 L-120 200 H120 L120 -40 L160 60 L200 40 L120 -170 L40 -190 L0 -120 L-40 -190 z" fill={fill} stroke={ink} strokeWidth={6} strokeLinejoin="round" />
      <path d="M0 -120 V200" stroke={xr > 0.5 ? X.cyan : '#1D3F60'} strokeWidth={6} />
      <path d="M-110 60 h70 M40 60 h70" stroke={xr > 0.5 ? X.cyan : '#1D3F60'} strokeWidth={6} />
      {/* etiket */}
      {tag > 0 && (
        <g transform={`translate(150,-60) rotate(8)`} opacity={tag}>
          <path d="M-60 -6 L-100 -40" stroke={ink} strokeWidth={3} />
          <path d="M-60 -36 h120 v84 l-60 30 l-60 -30 z" fill={xr > 0.5 ? 'none' : '#FFFFFF'} stroke={xr > 0.5 ? X.cyan : L.accent} strokeWidth={5} />
          <text y={30} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={44} fill={xr > 0.5 ? X.cyan : L.accent}>ALMA</text>
        </g>
      )}
    </g>
  );
}

export function Ceket({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 4), 0.6));
  const bg = mix(L.bg, X.bg, xr);

  // ---- kanca: Kara Cuma vitrini, "alma" ile etiket
  const sale = 1 - gir(t, an(1, 5), 0.6);
  const tag = gir(t, an(0, 5), 0.4);
  // ---- 1: gazete tam sayfa
  const paper = gir(t, an(1, 5), 0.8) * (1 - gir(t, bas(2), 0.6));
  const headline = gir(t, an(1, 12), 0.4);
  // ---- 2: su ve alma/onar/yeniden kullan
  const water = gir(t, an(2, 3), Math.max(1, an(2, 8) - an(2, 3)));
  const waterO = gir(t, an(2, 2), 0.4) * (1 - gir(t, bas(3), 0.5));
  const icons = [gir(t, an(2, 11), 0.3), gir(t, an(2, 12), 0.3), gir(t, an(2, 13), 0.3)];
  // ---- 3: 57.000 $ ↔ 40–50 milyon $
  const bars = gir(t, an(3, 3), 0.4) * (1 - gir(t, bas(4), 0.5));
  const big = gir(t, an(3, 7), 1.2);
  // ---- 5: merak ve dürüstlük
  const q = gir(t, an(5, 1), 0.4) * (1 - gir(t, an(5, 4), 0.4));
  const lesson = gir(t, an(5, 4), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6
  const shop = gir(t, bas(6), 0.8);
  const box = gir(t, an(6, 6), 0.5);
  const rows = [gir(t, an(6, 13), 0.3), gir(t, an(6, 14) + 0.3, 0.3), gir(t, an(6, 16), 0.3)];

  const jacketO = (1 - shop) * (1 - bars) * (1 - paper);
  const jacketS = karis(1.15, 0.9, waterO);
  const jacketX = karis(540, 380, waterO);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {/* kanca: Kara Cuma vitrini */}
        {sale > 0 && (
          <g opacity={sale * (1 - shop)}>
            <rect x={90} y={440} width={900} height={820} rx={20} fill="#1B1B1B" />
            <rect x={110} y={460} width={860} height={780} rx={12} fill="#2A2A2A" />
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${210 + i * 330},${520}) rotate(${-6 + i * 6})`}>
                <rect x={-110} y={-36} width={220} height={72} rx={10} fill={L.accent} />
                <text y={14} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={34} fill="#FFFFFF">KARA CUMA</text>
              </g>
            ))}
          </g>
        )}

        {/* ceket */}
        {jacketO > 0 && (
          <g opacity={jacketO}>
            <Jacket x={jacketX} y={900} s={jacketS} xr={xr} tag={Math.max(tag, xr)} />
          </g>
        )}

        {/* 1: gazete tam sayfa ilan */}
        {paper > 0 && (
          <g opacity={paper} transform={`translate(540,${karis(1100, 850, paper)}) rotate(${karis(6, -2, paper)})`}>
            <rect x={-380} y={-420} width={760} height={840} fill="#F4F1EA" stroke={L.ink} strokeWidth={5} />
            <text x={-340} y={-370} fontFamily="Instrument Serif, serif" fontSize={40} fill={L.ink}>The New York Times</text>
            <line x1={-340} x2={340} y1={-350} y2={-350} stroke={L.ink} strokeWidth={3} />
            <text x={0} y={-270} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={62} fill={L.ink} opacity={headline}>BU CEKETİ ALMAYIN</text>
            <Jacket x={0} y={40} s={0.85} xr={0} tag={0} />
            {[0, 1, 2, 3].map((i) => <rect key={i} x={-340} y={300 + i * 26} width={680} height={12} rx={6} fill="#CFCAC1" />)}
            <text x={340} y={-380} textAnchor="end" fontFamily="JetBrains Mono" fontSize={20} letterSpacing={2} fill={L.muted}>25 KASIM 2011</text>
          </g>
        )}

        {/* 2: 135 litre su (ilana göre) */}
        {waterO > 0 && (
          <g opacity={waterO} transform="translate(790,900)">
            <path d="M-110 -260 h220 v440 q0 30 -30 30 h-160 q-30 0 -30 -30 z" fill="#FFFFFF" stroke={L.ink} strokeWidth={6} />
            <clipPath id="kova"><path d="M-104 -254 h208 v434 q0 24 -24 24 h-160 q-24 0 -24 -24 z" /></clipPath>
            <rect clipPath="url(#kova)" x={-110} y={210 - 470 * water} width={220} height={470} fill="#5FA8C8" />
            <text y={-290} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={64} fill={L.ink}>135 litre</text>
            <text y={270} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill={L.muted}>İLANA GÖRE</text>
          </g>
        )}
        {/* alma / onar / yeniden kullan */}
        {waterO > 0 && (
          <g opacity={waterO}>
            {['ALMA', 'ONAR', 'YENİDEN KULLAN'].map((w, i) => (
              <g key={w} transform={`translate(${200 + i * 340},1230)`} opacity={icons[i]}>
                <rect x={-150} y={-40} width={300} height={80} rx={40} fill={L.ink} />
                <text y={12} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={i === 2 ? 28 : 34} fill="#FFFFFF">{w}</text>
              </g>
            ))}
          </g>
        )}

        {/* 3: 57.000 $ ilan ↔ 40–50 milyon $ tanıtım */}
        {bars > 0 && (
          <g opacity={bars}>
            <g transform="translate(140,560)">
              <text y={-20} fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted}>İLAN · YAKLAŞIK</text>
              <rect y={0} width={8} height={60} fill={L.ink} />
              <text x={30} y={46} fontFamily="Outfit" fontWeight={800} fontSize={52} fill={L.ink}>57.000 dolar</text>
            </g>
            <g transform="translate(140,800)">
              <text y={-20} fontFamily="JetBrains Mono" fontSize={26} letterSpacing={2} fill={L.muted}>ÜCRETSİZ TANITIM · CEO'YA GÖRE</text>
              <rect y={0} width={800 * big} height={300} rx={14} fill={L.accent} />
              <text x={30} y={180} fontFamily="Outfit" fontWeight={800} fontSize={72} fill="#FFFFFF" opacity={big}>40–50 milyon dolar</text>
            </g>
          </g>
        )}

        {/* 5: merak */}
        {q > 0 && <text x={800} y={760} fontFamily="Outfit" fontWeight={800} fontSize={240} fill={X.cyan} opacity={q} textAnchor="middle">?</text>}

        {/* 6: mağazan — dürüst kutu */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={820} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <rect x={140} y={490} width={260} height={260} rx={20} fill="#E7EEF5" />
            <g transform="translate(270,640) scale(0.42)"><Jacket x={0} y={0} s={1} xr={0} tag={0} /></g>
            <text x={440} y={540} fontFamily="Outfit" fontWeight={800} fontSize={36} fill={L.ink}>En çok satan ürün</text>
            <rect x={440} y={570} width={300} height={20} rx={10} fill={L.line} />
            <rect x={440} y={610} width={220} height={20} rx={10} fill={L.line} />
            {box > 0 && (
              <g opacity={box} transform="translate(140,800)">
                <rect width={800} height={410} rx={24} fill="#FFFFFF" stroke={L.accent} strokeWidth={6} />
                <text x={40} y={74} fontFamily="Outfit" fontWeight={800} fontSize={44} fill={L.accent}>Bu ürünü alma, eğer…</text>
                {rows.map((r, i) => (
                  <g key={i} opacity={r} transform={`translate(40,${150 + i * 90})`}>
                    <path d="M0 -14 l28 28 M28 -14 l-28 28" stroke={L.accent} strokeWidth={7} strokeLinecap="round" />
                    <rect x={60} y={-12} width={[560, 480, 520][i]} height={24} rx={12} fill={L.line} />
                  </g>
                ))}
              </g>
            )}
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={1 - gir(t, bas(1), 0.4)}>
          <span>Kara Cuma'da</span>
          <span style={{ display: 'block', color: L.accent }}>"ceketini alma" dedi.</span>
        </Headline>
        <Headline show={lesson}>
          <span>Kendi satışına karşı</span>
          <span style={{ display: 'block', color: L.accent }}>konuşan marka.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
