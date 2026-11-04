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
