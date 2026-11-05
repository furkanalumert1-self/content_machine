// Özel çizim dünyaları için ortak araçlar (Animasyon Sistemi): sahne anı kelimeden gelir, elle saniye yazılmaz.
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import type { StoryScript } from '../../src/story/types.ts';
import { FPS } from '../../src/plan/script.ts';
import { useTextQc } from '../qc.tsx';

export interface WorldProps { script: StoryScript }

/** Kelime zamanları: her kelime hangi bölümde (scene) söylendiğiyle birlikte. */
export function useTimeline(script: StoryScript) {
  const t = useCurrentFrame() / FPS;
  const words = script.captions.flatMap((c) => c.words);
  const seg = (w: { start: number }) => script.scenes.reduce((k, s, i) => (w.start + 0.02 >= s.start ? i : k), 0);
  const bySeg = script.scenes.map((_, i) => words.filter((w) => seg(w) === i));
  /** an(2, 3): 3. bölümün 4. kelimesinin başladığı an (yoksa bölüm başlangıcı). */
  const an = (s: number, k = 0) => bySeg[s]?.[Math.min(k, (bySeg[s]?.length ?? 1) - 1)]?.start ?? script.scenes[s]?.start ?? 0;
  /** Bölümün başlangıcı (sahne geçişleri için). */
  const bas = (s: number) => script.scenes[s]?.start ?? 0;
  const scene = script.scenes.reduce((k, s, i) => (t >= s.start ? i : k), 0);
  return { t, an, bas, scene };
}

/** t0'dan başlayıp 0'dan 1'e yumuşak gider; kamera ve hareketler bununla. Hareket kelimeden 2 kare önce başlar. */
export const gir = (t: number, t0: number, sure = 0.8) =>
  interpolate(t, [t0 - 2 / FPS, t0 - 2 / FPS + sure], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.55, 1) });
export const karis = (a: number, b: number, u: number) => a + (b - a) * u;

/** Her bölüm için metin taşması ölçümü (render kalite kontrolü her sahnenin ölçülmesini ister). */
export function WorldQc({ script, children, style }: { script: StoryScript; children: React.ReactNode; style: React.CSSProperties }) {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const s = script.scenes.find((x) => t >= x.start && t < x.start + x.duration) ?? script.scenes[0];
  const settle = Math.round(s.start * FPS) + Math.min(32, s.frames - 2);
  const ref = useTextQc<HTMLDivElement>(s.id, settle);
  return <div ref={ref} style={{ overflow: 'hidden', ...style }}>{children}</div>;
}

// ---------------------------------------------------------------- ortak görsel dil (Tuzak pilotundan)
export const L = { bg: '#ECEAE6', paper: '#F7F6F3', ink: '#151515', muted: '#7C7972', line: '#D9D6CF', accent: '#E8402A', good: '#2E9E5B' };
export const X = { bg: '#0D1B2C', cyan: '#5FD4E6' };

/** İki renk arasında karışım (#rrggbb). */
export function mix(a: string, b: string, u: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(',')})`;
}

/** Kağıt dokusu, vinyet ve röntgen ızgarası (xr: 0 açık, 1 röntgen). SVG'nin en altına konur. */
export function PaperDefs({ xr }: { xr: number }) {
  return (
    <>
      <defs>
        <filter id="gren"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0" /></filter>
        <radialGradient id="vin" cx="50%" cy="40%" r="75%"><stop offset="60%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity="0.14" /></radialGradient>
        <pattern id="izgara" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke={X.cyan} strokeOpacity="0.09" /></pattern>
      </defs>
      <rect width="1080" height="1920" fill="url(#izgara)" opacity={xr} />
      <rect width="1080" height="1920" filter="url(#gren)" />
      <rect width="1080" height="1920" fill="url(#vin)" />
    </>
  );
}

/** Dev yazı (yalnız kanca ve ders). */
export function Headline({ show, children }: { show: number; children: React.ReactNode }) {
  if (show <= 0) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: show, fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 64, lineHeight: 1.08, letterSpacing: -1.5, color: L.ink }}>
      {children}
    </div>
  );
}

/** Küçük insan figürü (baş + gövde); s ölçek. */
export function Person({ x, y, c, o = 1, s = 1 }: { x: number; y: number; c: string; o?: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <circle cy={-11} r={6.5} fill={c} />
      <rect x={-6} y={-3} width={12} height={15} rx={6} fill={c} />
    </g>
  );
}

/** Büyük insan figürü (yürür, kolları sallanır); walk: 0–1 adım fazı. */
export function Figure({ x, y, c = L.ink, s = 1, walk = 0, face = 0 }: { x: number; y: number; c?: string; s?: number; walk?: number; face?: number }) {
  const a = Math.sin(walk * Math.PI * 2) * 18;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={10} strokeLinecap="round">
      <circle cy={-150} r={30} fill={c} stroke="none" />
      <path d="M0 -118 L0 -40" />
      <path d={`M0 -100 L${-26 + a / 2} -60 M0 -100 L${26 - a / 2} -60`} />
      <path d={`M0 -40 L${-18 + a} 10 M0 -40 L${18 - a} 10`} />
      {face !== 0 && <path d={face > 0 ? 'M-10 -142 q10 10 20 0' : 'M-10 -136 q10 -8 20 0'} stroke="#fff" strokeWidth={4} transform="translate(0,0)" />}
    </g>
  );
}
