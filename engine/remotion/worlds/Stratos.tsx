// Dünya: "Red Bull Stratos" (14 Ekim 2012, YouTube canlı yayını). Tek dünya: gökyüzünde bir balon ve kapsül.
// Kalıp: Gerçek olay. Kapsül kapısında bekleyen adam → geçmişe dönüş, balon yerden yükselir → yayın ekranı →
// ekran milyonlarca ekrana çoğalır → hepsinde aynı anda atlayış → röntgen: sonucu belli olmayan an → senin canlı yayının.
// Bölümler: 0 kanca, 1 tarih + yükseliş + canlı, 2 aynı anda izleyen, 3 toplam + kutu + konuşma, 4 röntgen, 5 açıklama + ders, 6 mağazan, 7 REHBER.
// Rakamlar yalnız konu bankasındaki kaynaklı olgulardan: 8 milyon+ (YouTube verisi), 9,5 milyon (Red Bull'a göre), 20 dakika (öneri).
import { AbsoluteFill } from 'remotion';
import { W } from '../theme.ts';
import { gir, Headline, karis, L, mix, PaperDefs, useTimeline, WorldQc, X, type WorldProps } from './kit.tsx';

const SKY_LOW = '#6FA6CF';
const SKY_HIGH = '#070F1C';
const SUIT = '#E9ECEF';
const RED = '#E8402A';

// Yayın çerçevesi (telefon ekranı gibi): sahne bu dikdörtgenin içinde akar.
const FX = 90, FY = 330, FW = 900, FH = 990;
const FCX = FX + FW / 2, FCY = FY + FH / 2;

/** İki hex rengi karıştırıp yine hex döndürür (iç içe karışım için). */
function hx(a: string, b: string, u: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, '0')).join('');
}

const STARS = Array.from({ length: 70 }, (_, i) => ({ x: (i * 397) % 1080, y: 40 + ((i * 613) % 1300), r: 1 + (i % 3) * 0.8 }));
const CLOUDS = [
  { x: 180, y: 1080, s: 1.2 }, { x: 860, y: 900, s: 0.9 }, { x: 420, y: 560, s: 1.4 },
  { x: 920, y: 260, s: 1.1 }, { x: 120, y: -80, s: 1.0 }, { x: 640, y: -420, s: 1.3 },
];

function Cloud({ x, y, s, o }: { x: number; y: number; s: number; o: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o} fill="#FFFFFF">
      <ellipse cx={0} cy={0} rx={120} ry={34} />
      <ellipse cx={-50} cy={-20} rx={56} ry={36} />
      <ellipse cx={30} cy={-30} rx={64} ry={44} />
    </g>
  );
}

/** Kapsül + balon + kapıdaki adam. door: kapı açıklığı 0–1, step: adam basamağa çıktı 0–1, fall: düşüş 0–1. */
function Rig({ door, step, fall, xr, sway }: { door: number; step: number; fall: number; xr: number; sway: number }) {
  const ink = mix(L.ink, X.cyan, xr);
  const shell = xr > 0.5 ? 'none' : '#D6DCE2';
  const line = xr > 0.5 ? X.cyan : '#9AA6B2';
  // adam: kapsülün içinden basamağa, sonra aşağı düşer (küçülür, döner)
  const fx = 540 + step * 0 + fall * 40;
  const fy = karis(915, 935, step) + fall * fall * 640;
  const fs = karis(0.42, 0.42, step) * (1 - fall * 0.75);
  const rot = fall * 160;
  return (
    <g transform={`translate(0,300) rotate(${sway} 540 300)`}>
      {/* balon: ince, uzun plastik zarf */}
      <path d="M540 120 C700 140 760 300 640 520 L560 640 L520 640 L440 520 C320 300 380 140 540 120 z"
        fill={xr > 0.5 ? 'none' : '#F4F6F8'} stroke={line} strokeWidth={4} opacity={xr > 0.5 ? 1 : 0.95} />
      <path d="M540 120 C580 260 570 460 545 640 M540 120 C500 260 510 460 535 640" fill="none" stroke={line} strokeOpacity={0.5} strokeWidth={3} />
      <path d="M528 640 L500 770 M552 640 L580 770" stroke={ink} strokeWidth={3} />
      {/* kapsül */}
      <circle cx={540} cy={860} r={100} fill={shell} stroke={line} strokeWidth={5} />
      <rect x={490} y={790} width={100} height={130} rx={18} fill={xr > 0.5 ? 'none' : '#1B2633'} stroke={line} strokeWidth={4} />
      {/* kapı kanadı: yana açılır */}
      <rect x={karis(490, 596, door)} y={790} width={karis(100, 22, door)} height={130} rx={10} fill={xr > 0.5 ? 'none' : '#C3CBD3'} stroke={line} strokeWidth={4} />
      {/* basamak */}
      <rect x={470} y={928} width={140} height={14} rx={6} fill={xr > 0.5 ? 'none' : '#8D99A6'} stroke={line} strokeWidth={3} />
      {/* adam (beyaz giysi, kask) */}
      {fall < 1 && (
        <g transform={`translate(${fx},${fy}) rotate(${rot}) scale(${fs})`} opacity={step > 0 || fall > 0 ? 1 : 0.0}>
          <g fill="none" stroke={xr > 0.5 ? X.cyan : SUIT} strokeWidth={22} strokeLinecap="round">
            <path d="M0 -118 L0 -40" />
            <path d={fall > 0.05 ? 'M0 -100 L-60 -120 M0 -100 L60 -120' : 'M0 -100 L-30 -55 M0 -100 L30 -55'} />
            <path d={fall > 0.05 ? 'M0 -40 L-40 -5 M0 -40 L40 -5' : 'M0 -40 L-18 10 M0 -40 L18 10'} />
          </g>
          <circle cy={-152} r={34} fill={xr > 0.5 ? 'none' : SUIT} stroke={xr > 0.5 ? X.cyan : '#B8C0C8'} strokeWidth={5} />
          <rect x={-22} y={-164} width={44} height={20} rx={8} fill={xr > 0.5 ? X.cyan : '#26313D'} />
        </g>
      )}
    </g>
  );
}

/** Gökyüzü sahnesi. alt: 0 yer, 1 stratosfer. */
function SkyScene({ alt, door, step, fall, xr, t }: { alt: number; door: number; step: number; fall: number; xr: number; t: number }) {
  const sky = hx(hx(SKY_LOW, SKY_HIGH, alt), X.bg, xr);
  const earth = Math.max(0, (alt - 0.6) / 0.4);
  return (
    <g>
      <rect x={-200} y={-200} width={1480} height={2320} fill={sky} />
      {xr > 0 && <rect width={1080} height={1920} fill="url(#izgara)" opacity={xr} />}
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={alt * alt * (0.5 + 0.5 * Math.sin(t * 1.3 + i)) * (1 - xr)} />
      ))}
      {/* Dünya'nın kavisi (yüksekte) */}
      <g opacity={earth}>
        <circle cx={540} cy={3800} r={2500} fill={xr > 0.5 ? 'none' : '#1D4E7E'} stroke={xr > 0.5 ? X.cyan : '#7EC3EE'} strokeWidth={xr > 0.5 ? 4 : 16} />
        <circle cx={540} cy={3800} r={2530} fill="none" stroke="#7EC3EE" strokeOpacity={0.25 * (1 - xr)} strokeWidth={40} />
      </g>
      {/* bulutlar: yükselirken aşağı akar */}
      {CLOUDS.map((c, i) => (
        <Cloud key={i} x={c.x} y={c.y + alt * 2600} s={c.s} o={(1 - xr) * 0.9} />
      ))}
      {/* yer: yalnız en altta */}
      <g transform={`translate(0,${1290 + alt * 2200})`} opacity={1 - xr}>
        <rect x={-200} y={0} width={1480} height={900} fill="#5E7D4A" />
        <rect x={-200} y={0} width={1480} height={16} fill="#4C6A3B" />
      </g>
      <Rig door={door} step={step} fall={fall} xr={xr} sway={Math.sin(t * 0.7) * 1.2} />
    </g>
  );
}

/** Küçük ekran: milyonlarca izleyiciden biri. */
function Tile({ x, y, w, h, o, fall, xr, talk }: { x: number; y: number; w: number; h: number; o: number; fall: number; xr: number; talk: number }) {
  if (o <= 0) return null;
  const dotY = y + h * 0.56 + fall * fall * h * 0.35;
  return (
    <g opacity={o}>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={xr > 0.5 ? 'none' : SKY_HIGH} stroke={xr > 0.5 ? X.cyan : '#2A3A4F'} strokeWidth={3} />
      <path d={`M${x + 12} ${y + h - 10} Q${x + w / 2} ${y + h - 46} ${x + w - 12} ${y + h - 10}`} fill="none" stroke="#7EC3EE" strokeOpacity={0.7} strokeWidth={3} />
      <ellipse cx={x + w / 2} cy={y + h * 0.3} rx={w * 0.12} ry={h * 0.16} fill={xr > 0.5 ? 'none' : '#F4F6F8'} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />
      <circle cx={x + w / 2} cy={y + h * 0.52} r={w * 0.06} fill={xr > 0.5 ? 'none' : '#D6DCE2'} stroke={xr > 0.5 ? X.cyan : 'none'} strokeWidth={2} />
      {fall < 1 && <circle cx={x + w / 2 + fall * 8} cy={dotY} r={3.5} fill={xr > 0.5 ? X.cyan : '#FFFFFF'} />}
      <circle cx={x + 16} cy={y + 16} r={5} fill={RED} />
      {talk > 0 && (
        <g transform={`translate(${x + w - 10},${y - 6}) scale(${talk})`}>
          <path d="M-56 -40 h56 a12 12 0 0 1 12 12 v22 a12 12 0 0 1 -12 12 h-34 l-12 12 v-12 h-10 a12 12 0 0 1 -12 -12 v-22 a12 12 0 0 1 12 -12 z" fill="#FFFFFF" stroke={L.ink} strokeWidth={3} />
          {[0, 1, 2].map((k) => <circle key={k} cx={-40 + k * 15} cy={-17} r={4} fill={L.ink} />)}
        </g>
      )}
    </g>
  );
}

/** Kırmızı "CANLI" etiketi. */
function LivePill({ x, y, s = 1, o = 1, t }: { x: number; y: number; s?: number; o?: number; t: number }) {
  if (o <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <rect x={0} y={-26} width={150} height={52} rx={26} fill={RED} />
      <circle cx={30} cy={0} r={9} fill="#FFFFFF" opacity={0.55 + 0.45 * Math.sin(t * 6)} />
      <text x={50} y={10} fontFamily="Outfit" fontWeight={800} fontSize={28} letterSpacing={2} fill="#FFFFFF">CANLI</text>
    </g>
  );
}

/** Kutu (ürün): adı yok, logo yok. */
function Can({ x, y, s, o, strike }: { x: number; y: number; s: number; o: number; strike: number }) {
  if (o <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <rect x={-60} y={-130} width={120} height={260} rx={22} fill="#C9D3DE" stroke={L.ink} strokeWidth={5} />
      <rect x={-60} y={-60} width={120} height={110} fill="#2E5E8C" />
      <ellipse cx={0} cy={-130} rx={60} ry={14} fill="#E3E8EE" stroke={L.ink} strokeWidth={5} />
      {strike > 0 && (
        <g stroke={RED} strokeWidth={16} strokeLinecap="round">
          <line x1={-110} y1={-170} x2={karis(-110, 110, strike)} y2={karis(-170, 170, strike)} />
        </g>
      )}
    </g>
  );
}

export function Stratos({ script }: WorldProps) {
  const { t, an, bas } = useTimeline(script);

  // ---- röntgen: 4. bölümden 5. bölümün ilk cümlesinin sonuna kadar ("…yaratır.")
  const xr = gir(t, bas(4), 0.5) * (1 - gir(t, an(5, 9), 0.6));

  // ---- yükseklik: kancada tepede; "14 Ekim 2012" ile yere iner (geçmişe dönüş), "balonla stratosfere çıkıyor" ile yükselir
  const down = gir(t, an(1, 0), 0.9);
  const up = gir(t, an(1, 6), Math.max(1.2, an(1, 10) - an(1, 6)));
  const alt = t < an(1, 0) ? 1 : karis(1 - down, 1, up);

  // ---- kapı ve adım: kancada açık kapı, adam basamakta; geçmişe dönüşte kapı kapalı; "atlayacak" ile açılır, adam çıkar
  const hookDoor = 1 - gir(t, an(1, 0), 0.5);
  const door = Math.max(hookDoor, gir(t, an(1, 10), 0.6));
  const step = Math.max(hookDoor, gir(t, an(1, 12), 0.6));
  // ---- atlayış: 3. bölümün başında, bütün ekranlarda aynı anda
  const fall = gir(t, bas(3) + 0.2, 4.0);

  // ---- yayın çerçevesi: "YouTube'da canlı" ile belirir; 6. bölümde mağazan için yeniden
  const live = gir(t, an(1, 13), 0.5);
  // ---- ekranlar çoğalır: 2. bölümde ("aynı anda") geri çekilir; röntgende tekrar içeri
  const out = gir(t, an(2, 5), 1.2) * (1 - gir(t, bas(4), 1.0));
  // atlayış anında ortadaki ekran öne çıkar, sonra yine milyonlardan biri olur
  const jumpZoom = gir(t, bas(3), 0.7) * (1 - gir(t, an(3, 5), 0.8));
  const z = karis(karis(1, 0.19, out), 0.5, jumpZoom * out);
  const tilesIn = gir(t, an(2, 6), 0.9) * (1 - gir(t, bas(4), 0.6));
  const talk = gir(t, an(3, 14), 0.5);

  // ---- etiket: 8 milyon+ → 9,5 milyon
  const n1 = gir(t, an(2, 8), 0.4) * (1 - gir(t, an(3, 5), 0.3));
  const n2 = gir(t, an(3, 6), 0.4) * (1 - gir(t, bas(4), 0.4));

  // ---- kutu: "Kutuyu kimse göstermedi" — kutu belirir, çizilir
  const can = gir(t, an(3, 11), 0.5) * (1 - gir(t, an(3, 14), 0.5));
  const canStrike = gir(t, an(3, 13), 0.4);

  // ---- 5: belirsiz an ("?"), kaçırma korkusu (CANLI büyür), ders: ürün küçük, hikâye büyük
  const q = gir(t, an(5, 1), 0.5) * (1 - gir(t, an(5, 9), 0.5));
  const fomo = gir(t, an(5, 6), 0.5) * (1 - gir(t, an(5, 9), 0.5));
  const lesson = gir(t, an(5, 9), 0.6) * (1 - gir(t, bas(6), 0.5));
  // ---- 6: senin mağazan, canlı yayın; "20 dakikalık" sayaç, "süreli bir kod"
  const shop = gir(t, bas(6), 0.8);
  const timer = gir(t, an(6, 3), 0.5);
  const code = gir(t, an(6, 9), 0.5);
  const codeLeft = 1 - gir(t, an(6, 13), Math.max(1, (script.scenes[6]?.start ?? 0) + (script.scenes[6]?.duration ?? 0) - an(6, 13)));

  // röntgende düşüş ortada donar (adam havada, sonuç belli değil); ders anında atlayış tamamlanmış görünür
  const fallShown = t >= bas(4) && t < an(5, 9) ? 0.22 : fall;
  const bg = mix(SKY_HIGH, X.bg, xr);

  // çerçeve dönüşümü: sahne (1080×1920 koordinatı) çerçevenin merkezine z ölçeğiyle oturur
  const camY = Math.sin(t * 0.5) * 4;
  const sceneT = `translate(${FCX},${FCY + camY}) scale(${z}) translate(${-FCX},${-FCY})`;

  // ızgara: 5 sütun × 7 satır, ortadaki gerçek sahne
  const tw = FW * 0.19, th = FH * 0.19, gx = 22, gy = 26;
  const tiles: { x: number; y: number; d: number }[] = [];
  for (let r = -2; r <= 3; r++) for (let c = -2; c <= 2; c++) {
    if (r === 0 && c === 0) continue;
    tiles.push({ x: FCX - tw / 2 + c * (tw + gx), y: FCY - th / 2 + r * (th + gy), d: Math.abs(r) + Math.abs(c) });
  }

  const shopBg = mix(L.bg, X.bg, 0);

  return (
    <AbsoluteFill style={{ background: shop > 0.99 ? L.bg : bg }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <clipPath id="ekran"><rect x={FX} y={FY} width={FW} height={FH} rx={karis(0, 36, live)} /></clipPath>
        </defs>
        <PaperDefs xr={xr} />

        {/* 0–5: gökyüzü dünyası */}
        {shop < 1 && (
          <g opacity={1 - shop}>
            {/* çerçeve dışı da gökyüzü (çerçeve yokken tam ekran) */}
            <g opacity={1 - live}>
              <SkyScene alt={alt} door={door} step={step} fall={fallShown} xr={xr} t={t} />
            </g>
            {live > 0 && (
              <g opacity={live}>
                {/* ızgara ekranlar */}
                {tiles.map((p, i) => (
                  <Tile key={i} x={p.x} y={p.y} w={tw} h={th} o={gir(t, an(2, 6) + p.d * 0.12, 0.5) * tilesIn} fall={fall} xr={xr} talk={talk * (i % 3 === 0 ? gir(t, an(3, 14) + (i % 7) * 0.1, 0.3) : 0)} />
                ))}
                <g transform={sceneT}>
                  <g clipPath="url(#ekran)">
                    <SkyScene alt={alt} door={door} step={step} fall={fallShown} xr={xr} t={t} />
                  </g>
                  <rect x={FX} y={FY} width={FW} height={FH} rx={36} fill="none" stroke={xr > 0.5 ? X.cyan : '#0B0B0B'} strokeWidth={karis(6, 18, live)} />
                  <LivePill x={FX + 34} y={FY + 56} s={1 + fomo * 0.9} t={t} o={live} />
                </g>
              </g>
            )}

            {/* 5: belirsiz an — dev soru işareti */}
            {q > 0 && (
              <text x={790} y={1160} fontFamily="Outfit" fontWeight={800} fontSize={260} fill={X.cyan} opacity={q} textAnchor="middle">?</text>
            )}

            {/* 3: kutu */}
            <Can x={540} y={1000} s={karis(0.7, 1, can)} o={can} strike={canStrike} />
          </g>
        )}

        {/* ders: ürün küçük, hikâye büyük (terazi değil; boyutla) */}
        {lesson > 0 && (
          <g opacity={lesson}>
            <rect width={1080} height={1920} fill={L.bg} />
            <defs><clipPath id="ders"><rect x={330} y={440} width={660} height={820} rx={36} /></clipPath></defs>
            <g clipPath="url(#ders)">
              <g transform="translate(660,850) scale(0.95) translate(-540,-840)">
                <SkyScene alt={1} door={1} step={1} fall={0} xr={0} t={t} />
              </g>
            </g>
            <rect x={330} y={440} width={660} height={820} rx={36} fill="none" stroke={L.ink} strokeWidth={8} />
            <Can x={190} y={1150} s={0.42} o={1} strike={1} />
          </g>
        )}

        {/* 6: senin mağazan — aynı canlı çerçeve, içinde paket ve sayaç */}
        {shop > 0 && (
          <g opacity={shop}>
            <rect width={1080} height={1920} fill={shopBg} />
            <rect x={FX} y={FY} width={FW} height={FH} rx={36} fill={L.paper} stroke="#0B0B0B" strokeWidth={18} />
            <LivePill x={FX + 34} y={FY + 56} t={t} />
            {/* masa ve paket */}
            <rect x={FX + 60} y={FY + 700} width={FW - 120} height={26} rx={8} fill="#B08A5A" />
            <g transform={`translate(${FCX},${FY + 700})`}>
              <path d="M-170 0 v-220 h340 v220 z" fill="#D9B07A" stroke={L.ink} strokeWidth={5} />
              <path d="M-170 -220 l40 -60 h260 l40 60" fill="#E7C795" stroke={L.ink} strokeWidth={5} />
              <rect x={-30} y={-280} width={60} height={280} fill="#C99A5E" opacity={0.6} />
            </g>
            {/* 20 dakikalık sayaç */}
            {timer > 0 && (
              <g transform={`translate(${FX + FW - 150},${FY + 200}) scale(${0.8 + 0.2 * timer})`} opacity={timer}>
                <circle r={96} fill="#FFFFFF" stroke={L.line} strokeWidth={14} />
                <circle r={96} fill="none" stroke={RED} strokeWidth={14} strokeDasharray={`${2 * Math.PI * 96}`} strokeDashoffset={`${2 * Math.PI * 96 * gir(t, an(6, 4), 6)}`} transform="rotate(-90)" strokeLinecap="round" />
                <text y={16} textAnchor="middle" fontFamily="Outfit" fontWeight={800} fontSize={50} fill={L.ink}>20 dk</text>
              </g>
            )}
            {/* süreli kod */}
            {code > 0 && (
              <g transform={`translate(${FCX},${FY + 830})`} opacity={code}>
                <rect x={-260} y={-50} width={520} height={100} rx={50} fill={L.ink} />
                <text y={14} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight={700} fontSize={36} letterSpacing={3} fill="#FFFFFF">SADECE CANLIDA</text>
                <rect x={-220} y={64} width={440} height={12} rx={6} fill={L.line} />
                <rect x={-220} y={64} width={440 * codeLeft} height={12} rx={6} fill={RED} />
              </g>
            )}
          </g>
        )}
      </svg>

      {/* rakam etiketi (çerçevenin üstü) */}
      <WorldQc script={script} style={{ position: 'absolute', left: 90, right: W - 990, top: 262, height: 168 }}>
        <Headline show={1 - gir(t, bas(1), 0.4)}>
          <span style={{ color: '#FFFFFF' }}>Reklam yerine</span>
          <span style={{ display: 'block', color: '#7EC3EE' }}>stratosferden atlayış.</span>
        </Headline>
        {n1 > 0 && (
          <div style={{ position: 'absolute', left: 0, top: 0, opacity: n1, color: '#FFFFFF', fontFamily: 'Outfit, sans-serif', background: SKY_HIGH, borderRadius: 22, padding: '16px 24px' }}>
            <div style={{ fontWeight: 800, fontSize: 76, lineHeight: 1 }}>8 milyon+</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, letterSpacing: 3, marginTop: 12, color: '#7EC3EE' }}>AYNI ANDA · YOUTUBE VERİSİ</div>
          </div>
        )}
        {n2 > 0 && (
          <div style={{ position: 'absolute', left: 0, top: 0, opacity: n2, color: '#FFFFFF', fontFamily: 'Outfit, sans-serif', background: SKY_HIGH, borderRadius: 22, padding: '16px 24px' }}>
            <div style={{ fontWeight: 800, fontSize: 76, lineHeight: 1 }}>9,5 milyon</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, letterSpacing: 3, marginTop: 12, color: '#7EC3EE' }}>TOPLAM CANLI · RED BULL'A GÖRE</div>
          </div>
        )}
        <Headline show={lesson}>
          <span>Ürünü değil,</span>
          <span style={{ display: 'block', color: L.accent }}>hikâyeyi sahiplendi.</span>
        </Headline>
      </WorldQc>
      {/* tarih damgası (geçmişe dönüş) */}
      <div style={{ position: 'absolute', left: 90, top: 1180, fontFamily: 'JetBrains Mono, monospace', fontSize: 30, letterSpacing: 4, color: '#FFFFFF', opacity: gir(t, an(1, 0), 0.4) * (1 - gir(t, an(1, 13), 0.4)) }}>
        14 EKİM 2012
      </div>
    </AbsoluteFill>
  );
}
