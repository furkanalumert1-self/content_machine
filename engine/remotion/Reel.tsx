import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';
import type { Scene, Script } from '../src/plan/script.ts';
import { useTextQc } from './qc.tsx';
import { ease, FONT, H, SAFE, W, type Brand } from './theme.ts';

export interface ReelProps {
  script: Script;
  brand: Brand;
  featureTitles: string[];
  [key: string]: unknown;
}

const WHITE = '#F4F7FB';
const MUTED = 'rgba(244,247,251,0.62)';
const LINE = 'rgba(95,212,230,0.07)';
const SETTLE = 18; // giriş animasyonu bu karede biter; QC ölçümü burada yapılır

const isLabel = (l: string) => /:$/.test(l) || ['Önce', 'Sonra'].includes(l);

// ---------------------------------------------------------------- sahne zemini
function Stage({ brand }: { brand: Brand }) {
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #0A1222 0%, ${brand.navy} 55%, ${brand.navy2} 100%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
          backgroundSize: '90px 90px',
          backgroundPosition: '0 30px',
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(900px 700px at 85% 8%, ${brand.accent}22, transparent 70%)` }} />
    </AbsoluteFill>
  );
}

function TopBar({ brand, script }: { brand: Brand; script: Script }) {
  const frame = useCurrentFrame();
  const total = script.scenes.reduce((s, x) => s + x.frames, 0);
  return (
    <div style={{ position: 'absolute', top: SAFE.top - 80, left: SAFE.left, right: W - SAFE.right, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 14, height: 14, borderRadius: 7, background: brand.accent, boxShadow: `0 0 18px ${brand.accent}` }} />
      <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 32, color: MUTED, letterSpacing: 0.5 }}>{brand.name}</div>
      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.10)', marginLeft: 20, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${(frame / total) * 100}%`, height: '100%', background: 'rgba(255,255,255,0.45)' }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- yardımcılar
function Enter({ delay = 0, children, style }: { delay?: number; children: ReactNode; style?: CSSProperties }) {
  const f = useCurrentFrame();
  const p = ease((f - delay) / 12);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 28}px)`, ...style }}>{children}</div>;
}

function Label({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ fontFamily: FONT.mono, fontWeight: 500, fontSize: 34, letterSpacing: 4, color, marginBottom: 28 }}>
      {/* CSS uppercase Türkçe İ/ı'yı bozar; tr yerel ayarıyla büyütülür. */}
      {text.replace(/:$/, '').toLocaleUpperCase('tr')}
    </div>
  );
}

function TextBlock({ id, lines, size, maxHeight, labelColor }: { id: string; lines: string[]; size: number; maxHeight: number; labelColor: string }) {
  const ref = useTextQc<HTMLDivElement>(id, SETTLE);
  return (
    <div ref={ref} style={{ width: SAFE.right - SAFE.left, maxHeight, overflow: 'hidden' }}>
      {lines.map((l, i) =>
        isLabel(l) ? (
          <Enter key={i} delay={i * 5}><Label text={l} color={labelColor} /></Enter>
        ) : (
          <Enter key={i} delay={i * 5}>
            <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: size, lineHeight: 1.16, color: WHITE, marginBottom: 22, letterSpacing: -0.5 }}>{l}</div>
          </Enter>
        ),
      )}
    </div>
  );
}

function SampleBadge() {
  return (
    <div style={{ position: 'absolute', top: 26, right: 28, fontFamily: FONT.mono, fontSize: 24, color: MUTED, border: `1px solid ${MUTED}`, borderRadius: 999, padding: '6px 16px' }}>
      ÖRNEK VERİ
    </div>
  );
}

function UiCard({ title, chips, brand, highlight, sample }: { title: string; chips: string[]; brand: Brand; highlight: boolean; sample: boolean }) {
  const f = useCurrentFrame();
  const rows = chips.length ? chips : ['', '', ''];
  return (
    <div style={{ position: 'relative', width: SAFE.right - SAFE.left, background: 'rgba(19,32,59,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, padding: '34px 34px 38px', boxShadow: '0 40px 120px rgba(0,0,0,0.45)' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.18)' }} />)}
      </div>
      <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 36, color: MUTED, marginBottom: 26 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {rows.map((c, i) => {
          const p = ease((f - 8 - i * 3) / 10);
          const accent = highlight && i === 0;
          return c ? (
            <div key={i} style={{ opacity: p, transform: `scale(${0.96 + p * 0.04})`, fontFamily: FONT.sans, fontSize: 34, fontWeight: 500, color: accent ? brand.navy : WHITE, background: accent ? brand.accent : 'rgba(255,255,255,0.06)', border: `1px solid ${accent ? brand.accent : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '14px 26px' }}>
              {c}
            </div>
          ) : (
            <div key={i} style={{ opacity: p, width: '100%', height: 46, borderRadius: 12, background: i === 0 && highlight ? `${brand.accent}55` : 'rgba(255,255,255,0.07)' }} />
          );
        })}
      </div>
      {sample && <SampleBadge />}
    </div>
  );
}

function Scattered() {
  // "Önce": düzensiz, dağınık kartlar (araçlar ve listeler birbirinden kopuk)
  const f = useCurrentFrame();
  const cards = [[-40, 0, -6], [260, 90, 5], [80, 210, -3], [420, 260, 8]];
  return (
    <div style={{ position: 'relative', height: 420, width: SAFE.right - SAFE.left }}>
      {cards.map(([x, y, r], i) => {
        const p = ease((f - 6 - i * 3) / 10);
        return <div key={i} style={{ position: 'absolute', left: 60 + x, top: y, width: 380, height: 120, borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', opacity: p * 0.9, transform: `rotate(${r}deg)` }} />;
      })}
    </div>
  );
}

// ---------------------------------------------------------------- sahneler
type SceneProps = { scene: Scene; brand: Brand; featureTitles: string[] };

const columnStyle = (opacity: number): CSSProperties => ({
  position: 'absolute', left: SAFE.left, top: SAFE.top, width: SAFE.right - SAFE.left, height: SAFE.bottom - SAFE.top,
  display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 56, opacity,
});

function useFadeOut(scene: Scene) {
  const f = useCurrentFrame();
  return scene.kind === 'cta' ? 1 : interpolate(f, [scene.frames - 6, scene.frames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
}

function HookScene({ scene, brand }: SceneProps) {
  const f = useCurrentFrame();
  const ref = useTextQc<HTMLDivElement>(scene.id, SETTLE);
  const words = scene.lines[0].split(' ');
  return (
    <div style={columnStyle(useFadeOut(scene))}>
      <div ref={ref} style={{ maxHeight: 760, overflow: 'hidden' }}>
        <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 92, lineHeight: 1.08, color: WHITE, letterSpacing: -1.5 }}>
          {words.map((w, i) => {
            const p = ease((f - i * 1.5) / 8); // tüm kelimeler ~0,5 sn içinde görünür
            return <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 30}px)`, marginRight: 22 }}>{w}</span>;
          })}
        </div>
      </div>
      <div style={{ height: 6, width: `${ease((f - 10) / 14) * 240}px`, background: brand.accent, borderRadius: 3 }} />
    </div>
  );
}

function CtaScene({ scene, brand }: SceneProps) {
  const ref = useTextQc<HTMLDivElement>(scene.id, SETTLE);
  return (
    <div style={columnStyle(1)}>
      <div ref={ref} style={{ width: SAFE.right - SAFE.left, maxHeight: 900, overflow: 'hidden' }}>
        <Enter><div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 96, lineHeight: 1.05, color: WHITE, letterSpacing: -1.5, marginBottom: 48 }}>{scene.lines[0]}</div></Enter>
        <Enter delay={5}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 18, fontFamily: FONT.sans, fontWeight: 600, fontSize: 46, color: brand.navy, background: brand.accent, borderRadius: 999, padding: '24px 40px' }}>
            {scene.lines[1]} <span style={{ fontSize: 44 }}>↗</span>
          </div>
        </Enter>
      </div>
    </div>
  );
}

function BodyScene({ scene, brand, featureTitles }: SceneProps) {
  const v = scene.visual;
  const hasCard = v.type === 'feature' || v.type === 'after';
  const featureIdx = hasCard ? v.feature : -1;
  const title = featureIdx >= 0 ? featureTitles[featureIdx] : '';
  const textLines = hasCard ? scene.lines.filter(isLabel) : scene.lines;
  return (
    <div style={columnStyle(useFadeOut(scene))}>
      {v.type === 'before' && <Scattered />}
      {v.type === 'fact' && v.number && <BigNumber id={`${scene.id}-num`} text={v.number} color={brand.accent} />}
      {textLines.length > 0 && (
        <TextBlock id={scene.id} lines={textLines} size={64} maxHeight={hasCard ? 160 : 820} labelColor={v.type === 'before' ? MUTED : brand.accent} />
      )}
      {hasCard && (
        <Enter delay={4}>
          <FeatureTitle id={`${scene.id}-title`} text={scene.lines.find((l) => !isLabel(l)) ?? title} />
          <UiCard title={title} chips={'chips' in v ? v.chips : []} brand={brand} highlight sample={scene.sample_data} />
        </Enter>
      )}
    </div>
  );
}

function SceneView(props: SceneProps) {
  if (props.scene.visual.type === 'hook') return <HookScene {...props} />;
  if (props.scene.visual.type === 'cta') return <CtaScene {...props} />;
  return <BodyScene {...props} />;
}

/** Olgu sahnesinde rakam büyük ve tek başına görünür. */
function BigNumber({ id, text, color }: { id: string; text: string; color: string }) {
  const ref = useTextQc<HTMLDivElement>(id, SETTLE);
  return (
    <Enter>
      <div ref={ref} style={{ maxHeight: 320, overflow: 'hidden', marginBottom: 36 }}>
        <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 220, lineHeight: 1.25, color, letterSpacing: -6, whiteSpace: 'nowrap' }}>{text}</div>
      </div>
    </Enter>
  );
}

function FeatureTitle({ id, text }: { id: string; text: string }) {
  const ref = useTextQc<HTMLDivElement>(id, SETTLE);
  return (
    <div ref={ref} style={{ maxHeight: 260, overflow: 'hidden', marginBottom: 40 }}>
      <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 70, lineHeight: 1.1, color: WHITE, letterSpacing: -1 }}>{text}</div>
    </div>
  );
}

export function Reel({ script, brand, featureTitles }: ReelProps) {
  let from = 0;
  return (
    <AbsoluteFill style={{ width: W, height: H }}>
      <Stage brand={brand} />
      {script.scenes.map((s) => {
        const seq = (
          <Sequence key={s.id} from={from} durationInFrames={s.frames} layout="none">
            <SceneView scene={s} brand={brand} featureTitles={featureTitles} />
          </Sequence>
        );
        from += s.frames;
        return seq;
      })}
      <TopBar brand={brand} script={script} />
    </AbsoluteFill>
  );
}
