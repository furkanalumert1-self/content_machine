// Dünya: "Fiyat paketi" (PENNY Almanya "Price Packs"; Serviceplan Cannes 2025 sayfası: tasarım = fiyat, 2.150 mağazanın hepsi,
// 4 haftada 1,4 milyon ürün — ajans beyanı; Storyboard18: yulaf 1,79 €, Print & Publishing Grand Prix). Logo yok: genel paketler.
// 17.11/25.11 kuralı: 0. kare dolu ve hareketli, ürün görünür (rafta renkli paketler arasında yalnız fiyat yazan sade paket öne çıkıyor).
// Akış: desenli paket sadeleşir, fiyat büyür → 2.150 mağaza → 1,4 milyon / 4 hafta + ödül → röntgen: basılı fiyat silinmez
// → mağazan: tarihli fiyat sözü.
// Bölümler: 0 kanca, 1 paket, 2 mağazalar, 3 sonuç, 4 röntgen, 5 söz + ders, 6 mağazan, 7 REHBER.
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const RENK = ['#E8402A', '#3B6FD8', '#F2C14E', '#2E9E5B', '#D94F9B', '#7B4FD9'];

/** Genel karton paket; plain 0 desenli, 1 yalnız fiyat. */
function Pack({ x, y, s, i, plain, xr = 0, price = '1,79 €' }: { x: number; y: number; s: number; i: number; plain: number; xr?: number; price?: string }) {
  const c = RENK[i % RENK.length];
  const line = xr > 0.5 ? X.cyan : '#00000030';
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-80} y={-220} width={160} height={220} rx={10} fill={xr > 0.5 ? 'none' : mix(c, '#F7F6F3', plain)} stroke={line} strokeWidth={4} />
      <g opacity={1 - plain}>
        <circle cx={0} cy={-150} r={40} fill="#FFFFFF" opacity={0.85} />
        <rect x={-60} y={-90} width={120} height={18} rx={9} fill="#FFFFFF" opacity={0.7} />
        <path d="M-80 -40 Q0 -80 80 -40 L80 0 L-80 0 Z" fill="#00000025" />
      </g>
      <text y={-90} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={karis(20, 52, plain)} fill={xr > 0.5 ? X.cyan : L.ink} opacity={plain}>{price}</text>
    </g>
  );
}

export function FiyatPaket({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, bas(6), 0.6));
  const bg = mix(L.bg, X.bg, xr);
  const ink = mix(L.ink, X.cyan, xr);

  // ---- kanca: rafta renkli paketler; sade fiyat paketi öne çıkar, nabız atar
  const hook = 1 - gir(t, bas(1), 0.4);
  const pulse = 1 + Math.sin(t * 6) * 0.04;
  const slide = (t * 30) % 180;
  // ---- 1: paket sadeleşir
  const pack = gir(t, bas(1), 0.4) * (1 - gir(t, bas(2), 0.4));
  const strip = gir(t, an(1, 6), Math.max(0.8, an(1, 12) - an(1, 6)));
  // ---- 2: mağazalar
  const stores = gir(t, bas(2), 0.4) * (1 - gir(t, bas(3), 0.4));
  const fill = gir(t, an(2, 3), Math.max(0.8, an(2, 8) - an(2, 3)));
  // ---- 3: sonuç
  const res = gir(t, bas(3), 0.4) * (1 - gir(t, bas(4), 0.5));
  const prize = gir(t, an(3, 10), 0.5);
  // ---- 5: silinmeyen fiyat
  const why = gir(t, bas(4) + 0.3, 0.4) * (1 - gir(t, bas(6), 0.4));
  const rub = t > an(5, 1) && t < an(5, 8) ? Math.sin(t * 18) * 60 : 0;
  const eraser = gir(t, an(5, 1), 0.3) * (1 - gir(t, an(5, 8), 0.3));
  const lesson = gir(t, an(5, 12), 0.5) * (1 - gir(t, bas(6), 0.4));
  // ---- 6
  const shop = gir(t, bas(6), 0.8);
  const sticker = gir(t, an(6, 8), 0.4);
  const terms = gir(t, an(6, 14), 0.4);

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <PaperDefs xr={xr} />

        {hook > 0 && (
          <g opacity={hook}>
            {[0, 1].map((r) => <rect key={r} x={60} y={860 + r * 360} width={960} height={20} rx={6} fill="#C9C2B4" />)}
            {Array.from({ length: 14 }, (_, i) => {
              const r = Math.floor(i / 7);
              const x = ((i % 7) * 180 + (r ? -slide : slide)) % 1260 - 90;
              return <Pack key={i} x={x} y={860 + r * 360} s={0.85} i={i} plain={0} />;
            })}
            <g transform={`translate(540,1180) scale(${pulse})`}>
              <rect x={-170} y={-440} width={340} height={460} rx={20} fill="#00000018" transform="translate(12,14)" />
              <Pack x={0} y={20} s={2.1} i={0} plain={1} />
            </g>
          </g>
        )}

        {pack > 0 && (
          <g opacity={pack}>
            <Pack x={540} y={1270} s={3} i={1} plain={strip} />
            <text x={540} y={540} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={30} letterSpacing={3} fill={L.muted}>
              {strip < 0.5 ? 'LOGO · DESEN · SLOGAN' : 'TASARIM = FİYAT'}
            </text>
          </g>
        )}

        {stores > 0 && (
          <g opacity={stores}>
            {Array.from({ length: 60 }, (_, i) => {
              const x = 150 + (i % 10) * 86; const y = 560 + Math.floor(i / 10) * 100;
              const on = fill > 0;
              return (
                <g key={i} transform={`translate(${x},${y})`} opacity={on ? 1 : 0.4}>
                  <path d="M-30 0 L-30 -36 L0 -56 L30 -36 L30 0 Z" fill={on ? L.accent : L.line} />
                  <rect x={-8} y={-22} width={16} height={22} fill={L.paper} />
                </g>
              );
            })}
            <text x={540} y={1200} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={64} fill={L.ink} opacity={fill}>2.150 mağazanın hepsi</text>
            <text x={540} y={1250} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={22} letterSpacing={2} fill={L.muted} opacity={fill}>ALMANYA · AJANS BEYANI</text>
          </g>
        )}

        {res > 0 && (
          <g opacity={res}>
            <g transform="translate(120,520)">
              <rect width={840} height={220} rx={28} fill={L.ink} />
              <text x={50} y={130} fontFamily="Outfit" fontWeight={800} fontSize={96} fill="#FFFFFF">1,4 milyon</text>
              <text x={50} y={186} fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill="#FFFFFF" opacity={0.75}>ÜRÜN · 4 HAFTADA · AJANS BEYANI</text>
            </g>
            <g opacity={prize} transform="translate(540,900)">
              <rect x={-300} y={-40} width={600} height={80} rx={40} fill="#F2C14E" />
              <text y={12} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700} fontSize={28} letterSpacing={2} fill={L.ink}>CANNES 2025 · GRAND PRIX</text>
            </g>
          </g>
        )}

        {why > 0 && (
          <g opacity={why}>
            <Pack x={540} y={1270} s={3} i={2} plain={1} xr={xr} />
            {eraser > 0 && (
              <g opacity={eraser} transform={`translate(${620 + rub},${960}) rotate(-20)`}>
                <rect x={-70} y={-40} width={140} height={80} rx={12} fill="#F28CA8" />
                <rect x={-70} y={10} width={140} height={30} rx={8} fill="#3B6FD8" />
              </g>
            )}
            <text x={540} y={560} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700} fontSize={32} letterSpacing={3} fill={ink}>
              {t < an(5, 8) ? 'SİLİNMİYOR' : 'GERİ ALINAMAZ SÖZ'}
            </text>
          </g>
        )}

        {shop > 0 && (
          <g opacity={shop}>
            <rect x={90} y={440} width={900} height={840} rx={36} fill={L.paper} stroke={L.line} strokeWidth={4} />
            <text x={140} y={520} fontFamily="Outfit" fontWeight={800} fontSize={38} fill={L.ink}>En çok satanlar</text>
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${250 + i * 290},700)`}>
                <rect x={-120} y={-100} width={240} height={200} rx={18} fill={L.line} />
                <Pack x={0} y={80} s={0.75} i={i + 3} plain={0} />
              </g>
            ))}
            {sticker > 0 && (
              <g opacity={sticker} transform="translate(540,1000) rotate(-4)">
                <rect x={-380} y={-80} width={760} height={160} rx={28} fill={L.accent} />
                <text y={18} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={54} fill="#FFFFFF">Ay sonuna kadar bu fiyat</text>
              </g>
            )}
            <text x={540} y={1170} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={24} letterSpacing={2} fill={L.muted} opacity={terms}>SÜRE VE ŞARTLAR SAYFADA</text>
          </g>
        )}
      </svg>

      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 150 }}>
        <Headline show={hook}>
          <span>Logo yok, desen yok.</span>
          <span style={{ display: 'block', color: L.accent }}>Sadece fiyat.</span>
        </Headline>
        <Headline show={lesson}>
          <span style={{ color: xr > 0.5 ? X.cyan : L.ink }}>Geri alınamayan söz,</span>
          <span style={{ display: 'block', color: L.accent }}>inandırıcı söz.</span>
        </Headline>
      </WorldQc>
    </AbsoluteFill>
  );
}
