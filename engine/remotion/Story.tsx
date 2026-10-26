// Sepet Röntgeni hikâye formatı: açık zemin + çizim kartlar; "röntgen" bölümünde koyu, çizgisel mod.
// Seslendirme tek ses izi, altyazı kelime kelime (aynı anda en fazla 3 kelime).
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, useCurrentFrame } from 'remotion';
import type { Beat, CaptionChunk, Mode, StoryScene, StoryScript } from '../src/story/types.ts';
import { FPS } from '../src/plan/script.ts';
import { useTextQc } from './qc.tsx';
import { ease, FONT, H, SAFE, W } from './theme.ts';

export interface StoryProps {
  script: StoryScript;
  [key: string]: unknown;
}

const C = {
  light: { bg: '#ECEAE6', card: '#F7F6F3', ink: '#151515', muted: '#7C7972', line: '#D9D6CF', accent: '#E8402A', good: '#2E9E5B' },
  xray: { bg: '#0D1B2C', card: 'rgba(95,212,230,0.06)', ink: '#E6F6FA', muted: 'rgba(230,246,250,0.55)', line: 'rgba(95,212,230,0.55)', accent: '#5FD4E6', good: '#5FD4E6' },
};
type Pal = (typeof C)['light'];

// Ölçüm, en geç giren öğe (16 kare gecikme + 12 kare giriş) yerine oturduktan sonra; kısa sahnede son karelerde.
const SETTLE = 32;
const SettleCtx = createContext(SETTLE);
const useSettle = () => useContext(SettleCtx);

function Enter({ delay = 0, children, style }: { delay?: number; children: ReactNode; style?: CSSProperties }) {
  const f = useCurrentFrame();
  const p = ease((f - delay) / 12);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 26}px) scale(${0.97 + p * 0.03})`, ...style }}>{children}</div>;
}

// ---------------------------------------------------------------- zemin ve üst bant
function Backdrop({ mode }: { mode: Mode }) {
  const p = C[mode];
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      {mode === 'xray' ? (
        <AbsoluteFill style={{ backgroundImage: `linear-gradient(${p.line.replace('0.55', '0.08')} 1px, transparent 1px), linear-gradient(90deg, ${p.line.replace('0.55', '0.08')} 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
      ) : (
        <AbsoluteFill style={{ background: 'radial-gradient(1100px 900px at 50% 35%, rgba(255,255,255,0.65), transparent 70%)' }} />
      )}
    </AbsoluteFill>
  );
}

function TopBar({ script, mode, progress }: { script: StoryScript; mode: Mode; progress: number }) {
  const p = C[mode];
  const txt: CSSProperties = { fontFamily: FONT.mono, fontSize: 24, letterSpacing: 3, color: p.muted };
  return (
    <div style={{ position: 'absolute', top: 150, left: SAFE.left, right: W - SAFE.right }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...txt, color: p.ink, fontWeight: 500 }}>{script.channel.toLocaleUpperCase('tr')}</span>
        <span style={txt}>{`VAKA #${String(script.case_no).padStart(2, '0')} · ${script.case_label.toLocaleUpperCase('tr')}`}</span>
      </div>
      <div style={{ marginTop: 14, height: 3, background: p.line, opacity: 0.6 }}>
        <div style={{ height: 3, width: `${progress * 100}%`, background: p.accent }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- altyazı
function Captions({ chunks, mode }: { chunks: CaptionChunk[]; mode: Mode }) {
  const f = useCurrentFrame();
  const t = f / FPS;
  const chunk = chunks.find((c) => t >= c.start && t < c.end);
  if (!chunk) return null;
  const ink = mode === 'xray' ? C.xray : C.light;
  return (
    <div style={{ position: 'absolute', top: 1330, left: 0, width: W, display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: '#111', borderRadius: 18, padding: '14px 28px', maxWidth: SAFE.right - SAFE.left, boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }}>
        <span style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 50, lineHeight: 1.15 }}>
          {chunk.words.map((w, i) => (
            <span key={i} style={{ color: t >= w.start ? '#FFFFFF' : 'rgba(255,255,255,0.38)', marginRight: i < chunk.words.length - 1 ? 14 : 0 }}>{w.w}</span>
          ))}
        </span>
      </div>
      {mode === 'xray' && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', outline: `0px solid ${ink.accent}` }} />}
    </div>
  );
}

// ---------------------------------------------------------------- çizim kartlar (beat'ler)
const cardStyle = (p: Pal, extra: CSSProperties = {}): CSSProperties => ({
  background: p.card, border: `2px solid ${p.line}`, borderRadius: 28,
  boxShadow: p === C.light ? '0 18px 40px rgba(21,21,21,0.10)' : `0 0 40px ${p.accent}22`, ...extra,
});

function Title({ b, p, id }: { b: Extract<Beat, { type: 'title' }>; p: Pal; id: string }) {
  const f = useCurrentFrame();
  const ref = useTextQc<HTMLDivElement>(id, useSettle());
  const words = b.text.split(' ');
  return (
    <div ref={ref} style={{ maxHeight: 820, overflow: 'hidden' }}>
      <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 104, lineHeight: 1.04, letterSpacing: -2.5, color: p.ink }}>
        {words.map((w, i) => {
          const q = ease((f - i * 2) / 9);
          return <span key={i} style={{ display: 'inline-block', opacity: q, transform: `translateY(${(1 - q) * 34}px)`, marginRight: 26 }}>{w}</span>;
        })}
      </div>
      <div style={{ height: 10, width: `${ease((f - 12) / 14) * 280}px`, background: p.accent, borderRadius: 5, marginTop: 30 }} />
      {b.sub && <Enter delay={14}><div style={{ fontFamily: FONT.sans, fontSize: 48, color: p.muted, marginTop: 34 }}>{b.sub}</div></Enter>}
    </div>
  );
}

function Phone({ b, p, id }: { b: Extract<Beat, { type: 'phone' }>; p: Pal; id: string }) {
  const f = useCurrentFrame();
  const ref = useTextQc<HTMLDivElement>(id, useSettle());
  const drop = ease((f - 8) / 12);
  const shake = f > 8 && f < 26 ? Math.sin(f * 1.6) * 6 : 0;
  return (
    <Enter>
      <div style={{ width: 560, height: 860, margin: '0 auto', borderRadius: 72, background: '#151515', padding: 22, transform: `rotate(${shake / 6}deg)` }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 54, background: 'linear-gradient(180deg,#2A2F3A,#12151C)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 300, fontSize: 130, color: '#fff', textAlign: 'center', marginTop: 120 }}>{b.time ?? '23:00'}</div>
          <div ref={ref} style={{ position: 'absolute', left: 26, right: 26, top: 330, opacity: drop, transform: `translateY(${(1 - drop) * -40}px)`, background: 'rgba(245,245,245,0.94)', borderRadius: 30, padding: '24px 26px', maxHeight: 300, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: p.accent }} />
              <span style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 28, color: '#333' }}>{b.app.toLocaleUpperCase('tr')}</span>
              <span style={{ fontFamily: FONT.sans, fontSize: 24, color: '#888', marginLeft: 'auto' }}>şimdi</span>
            </div>
            <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 36, color: '#111' }}>{b.title}</div>
            <div style={{ fontFamily: FONT.sans, fontSize: 32, color: '#333', marginTop: 6, lineHeight: 1.25 }}>{b.body}</div>
          </div>
        </div>
      </div>
    </Enter>
  );
}

function Flame({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path d="M32 4c4 12 18 18 18 34a18 18 0 0 1-36 0c0-9 5-14 9-19 1 6 4 9 7 10-2-9 0-17 2-25z" fill={color} />
      <path d="M32 30c3 6 9 8 9 16a9 9 0 0 1-18 0c0-5 4-8 9-16z" fill="#fff" opacity="0.55" />
    </svg>
  );
}

function Counter({ b, p, id }: { b: Extract<Beat, { type: 'counter' }>; p: Pal; id: string }) {
  const f = useCurrentFrame();
  const ref = useTextQc<HTMLDivElement>(id, useSettle());
  const n = Math.round(interpolate(f, [4, 26], [Math.max(0, b.value - 6), b.value], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return (
    <Enter>
      <div ref={ref} style={{ ...cardStyle(p, { padding: '60px 50px', textAlign: 'center' }), maxHeight: 720, overflow: 'hidden' }}>
        <Flame color={p.accent} size={190} />
        <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 220, lineHeight: 1, color: p.ink, letterSpacing: -6 }}>{n}</div>
        <div style={{ fontFamily: FONT.mono, fontSize: 34, letterSpacing: 5, color: p.muted, marginTop: 18 }}>{b.label.toLocaleUpperCase('tr')}</div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 40 }}>
          {Array.from({ length: 7 }, (_, i) => {
            const on = ease((f - 6 - i * 2) / 6);
            return <div key={i} style={{ width: 70, height: 70, borderRadius: 35, border: `3px solid ${p.accent}`, background: on > 0.5 ? p.accent : 'transparent', opacity: 0.3 + on * 0.7 }} />;
          })}
        </div>
      </div>
    </Enter>
  );
}

function Stat({ b, p, id }: { b: Extract<Beat, { type: 'stat' }>; p: Pal; id: string }) {
  const f = useCurrentFrame();
  const ref = useTextQc<HTMLDivElement>(id, useSettle());
  const fill = ease((f - 8) / 18) * (b.bar ?? 0);
  return (
    <Enter>
      <div ref={ref} style={{ ...cardStyle(p, { padding: '56px 56px 60px' }), maxHeight: 780, overflow: 'hidden' }}>
        {/* Uzun değer ("35,8 milyon") tek satırda kalsın diye yazı boyu uzunluğa göre küçülür. */}
        <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: b.value.length <= 5 ? 200 : b.value.length <= 8 ? 150 : 112, lineHeight: 1.05, color: p.accent, letterSpacing: -4, whiteSpace: 'nowrap' }}>{b.value}</div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 50, lineHeight: 1.18, color: p.ink, marginTop: 18 }}>{b.label}</div>
        {b.bar != null && (
          <div style={{ height: 22, borderRadius: 11, background: p.line, marginTop: 44, overflow: 'hidden' }}>
            <div style={{ height: 22, width: `${fill * 100}%`, background: p.accent }} />
          </div>
        )}
        {b.note && <div style={{ fontFamily: FONT.mono, fontSize: 26, color: p.muted, marginTop: 28, letterSpacing: 1 }}>{b.note}</div>}
      </div>
    </Enter>
  );
}

function Compare({ b, p, id }: { b: Extract<Beat, { type: 'compare' }>; p: Pal; id: string }) {
  const f = useCurrentFrame();
  const ref = useTextQc<HTMLDivElement>(id, useSettle());
  const col = (x: { label: string; value: string; bar: number }, i: number, win: boolean) => {
    const g = ease((f - 8 - i * 8) / 16) * x.bar;
    return (
      <div style={{ ...cardStyle(p, { flex: 1, padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 640 }) }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', height: `${g * 100}%`, borderRadius: 16, background: win ? p.accent : p.line }} />
        </div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: x.value.length <= 5 ? 92 : 72, color: win ? p.accent : p.ink, marginTop: 22, whiteSpace: 'nowrap' }}>{x.value}</div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 36, color: p.muted }}>{x.label}</div>
      </div>
    );
  };
  return (
    <Enter>
      <div ref={ref} style={{ maxHeight: 820, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 30 }}>{col(b.left, 0, false)}{col(b.right, 1, true)}</div>
        {b.caption && <div style={{ fontFamily: FONT.mono, fontSize: 28, color: p.muted, marginTop: 26, letterSpacing: 2, textAlign: 'center' }}>{b.caption.toLocaleUpperCase('tr')}</div>}
      </div>
    </Enter>
  );
}

function Stamps({ b, p, id }: { b: Extract<Beat, { type: 'stamps' }>; p: Pal; id: string }) {
  const f = useCurrentFrame();
  const ref = useTextQc<HTMLDivElement>(id, useSettle());
  return (
    <Enter>
      <div ref={ref} style={{ ...cardStyle(p, { padding: 48 }), maxHeight: 640, overflow: 'hidden' }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 30, letterSpacing: 4, color: p.ink, marginBottom: 34 }}>{b.label.toLocaleUpperCase('tr')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${b.total <= 6 ? b.total : Math.ceil(b.total / 2)}, 1fr)` /* az kutu tek satırda */, gap: 22 }}>
          {Array.from({ length: b.total }, (_, i) => {
            const on = i < b.filled && ease((f - 10 - i * 3) / 6) > 0.5;
            return <div key={i} style={{ aspectRatio: '1', borderRadius: '50%', border: `4px solid ${i === b.highlight ? p.accent : p.line}`, background: on ? p.accent : 'transparent' }} />;
          })}
        </div>
      </div>
    </Enter>
  );
}

function Scale({ b, p, id }: { b: Extract<Beat, { type: 'scale' }>; p: Pal; id: string }) {
  const f = useCurrentFrame();
  const ref = useTextQc<HTMLDivElement>(id, useSettle());
  const tilt = ease((f - 10) / 20) * 14;
  const pan = (label: string, color: string): ReactNode => (
    <div style={{ width: 300, textAlign: 'center' }}>
      <div style={{ ...cardStyle(p, { padding: '26px 18px' }), fontFamily: FONT.sans, fontWeight: 700, fontSize: 44, color }}>{label}</div>
    </div>
  );
  return (
    <Enter>
      <div ref={ref} style={{ maxHeight: 760, overflow: 'hidden', paddingTop: 40 }}>
        <div style={{ position: 'relative', height: 520 }}>
          <div style={{ position: 'absolute', left: '50%', top: 60, width: 760, marginLeft: -380, transform: `rotate(${tilt}deg)`, transformOrigin: '50% 50%' }}>
            <div style={{ height: 8, background: p.ink, borderRadius: 4 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <div style={{ transform: `rotate(${-tilt}deg)` }}>{pan(b.light, p.good)}</div>
              <div style={{ transform: `rotate(${-tilt}deg)` }}>{pan(b.heavy, p.accent)}</div>
            </div>
          </div>
          <div style={{ position: 'absolute', left: '50%', top: 64, width: 8, height: 420, marginLeft: -4, background: p.ink }} />
          <div style={{ position: 'absolute', left: '50%', top: 470, width: 260, height: 14, marginLeft: -130, background: p.ink, borderRadius: 7 }} />
        </div>
        {b.caption && <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 52, color: p.ink, textAlign: 'center', marginTop: 20 }}>{b.caption}</div>}
      </div>
    </Enter>
  );
}

function Chips({ b, p, id }: { b: Extract<Beat, { type: 'chips' }>; p: Pal; id: string }) {
  const ref = useTextQc<HTMLDivElement>(id, useSettle());
  return (
    <div ref={ref} style={{ maxHeight: 860, overflow: 'hidden' }}>
      {b.title && <Enter><div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 84, color: p.ink, marginBottom: 40, letterSpacing: -2 }}>{b.title}</div></Enter>}
      {b.items.map((it, i) => (
        <Enter key={i} delay={6 + i * 10}>
          <div style={{ ...cardStyle(p, { padding: '30px 36px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }) }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: p.accent, flexShrink: 0 }} />
            <span style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 50, color: p.ink }}>{it}</span>
          </div>
        </Enter>
      ))}
    </div>
  );
}

function Rule({ b, p, id }: { b: Extract<Beat, { type: 'rule' }>; p: Pal; id: string }) {
  const f = useCurrentFrame();
  const ref = useTextQc<HTMLDivElement>(id, useSettle());
  const strike = ease((f - 8) / 12);
  return (
    <div ref={ref} style={{ maxHeight: 820, overflow: 'hidden' }}>
      {b.strike && (
        <div style={{ position: 'relative', display: 'inline-block', fontFamily: FONT.sans, fontWeight: 700, fontSize: 70, color: p.muted, marginBottom: 30 }}>
          {b.strike}
          <div style={{ position: 'absolute', left: 0, top: '55%', height: 8, width: `${strike * 100}%`, background: p.accent, borderRadius: 4 }} />
        </div>
      )}
      <Enter delay={b.strike ? 16 : 0}>
        <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 96, lineHeight: 1.06, color: p.ink, letterSpacing: -2.5 }}>{b.text}</div>
        <div style={{ height: 10, width: 300, background: p.good, borderRadius: 5, marginTop: 26 }} />
      </Enter>
    </div>
  );
}

function XrayIntro({ b, p, id }: { b: Extract<Beat, { type: 'xray' }>; p: Pal; id: string }) {
  const f = useCurrentFrame();
  const ref = useTextQc<HTMLDivElement>(id, useSettle());
  const scan = interpolate(f, [0, 30], [-200, H], { extrapolateRight: 'clamp' });
  return (
    <>
      <div style={{ position: 'absolute', left: 0, top: scan - 900, width: W, height: 200, background: `linear-gradient(180deg, transparent, ${p.accent}55, transparent)` }} />
      <div ref={ref} style={{ maxHeight: 700, overflow: 'hidden', textAlign: 'center' }}>
        <svg width="260" height="260" viewBox="0 0 100 100" style={{ opacity: ease(f / 10) }}>
          <rect x="10" y="22" width="80" height="62" rx="6" fill="none" stroke={p.accent} strokeWidth="3" />
          <path d="M22 34h56M28 46h44M34 58h32M40 70h20" stroke={p.accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M30 22l6-10h28l6 10" fill="none" stroke={p.accent} strokeWidth="3" />
        </svg>
        <Enter delay={6}><div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 98, color: p.ink, letterSpacing: -2, marginTop: 30 }}>{b.text}</div></Enter>
      </div>
    </>
  );
}

function Outro({ b, p, id, channel }: { b: Extract<Beat, { type: 'outro' }>; p: Pal; id: string; channel: string }) {
  const f = useCurrentFrame();
  const ref = useTextQc<HTMLDivElement>(id, useSettle());
  const stamp = ease((f - 4) / 8);
  return (
    <div ref={ref} style={{ maxHeight: 900, overflow: 'hidden', textAlign: 'center' }}>
      <div style={{ display: 'inline-block', transform: `rotate(-6deg) scale(${1.6 - stamp * 0.6})`, opacity: stamp, border: `8px solid ${p.accent}`, borderRadius: 18, padding: '18px 36px', fontFamily: FONT.mono, fontWeight: 500, fontSize: 56, letterSpacing: 4, color: p.accent }}>
        {`RÖNTGEN #${String(b.caseNo).padStart(2, '0')}`}
      </div>
      <Enter delay={10}><div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 112, letterSpacing: -3, color: p.ink, marginTop: 60, lineHeight: 1 }}>{channel}</div></Enter>
      <Enter delay={16}>
        <div style={{ display: 'inline-block', marginTop: 48, background: p.ink, color: p.bg, borderRadius: 999, padding: '26px 46px', fontFamily: FONT.sans, fontWeight: 700, fontSize: 44 }}>{b.cta}</div>
      </Enter>
    </div>
  );
}

function BeatView({ scene, channel }: { scene: StoryScene; channel: string }) {
  const p = C[scene.mode];
  const b = scene.show;
  const id = scene.id;
  switch (b.type) {
    case 'title': return <Title b={b} p={p} id={id} />;
    case 'phone': return <Phone b={b} p={p} id={id} />;
    case 'counter': return <Counter b={b} p={p} id={id} />;
    case 'stat': return <Stat b={b} p={p} id={id} />;
    case 'compare': return <Compare b={b} p={p} id={id} />;
    case 'stamps': return <Stamps b={b} p={p} id={id} />;
    case 'scale': return <Scale b={b} p={p} id={id} />;
    case 'chips': return <Chips b={b} p={p} id={id} />;
    case 'rule': return <Rule b={b} p={p} id={id} />;
    case 'xray': return <XrayIntro b={b} p={p} id={id} />;
    case 'outro': return <Outro b={b} p={p} id={id} channel={channel} />;
  }
}

function SceneFrame({ scene, channel }: { scene: StoryScene; channel: string }) {
  const f = useCurrentFrame();
  const out = scene.show.type === 'outro' ? 1 : interpolate(f, [scene.frames - 5, scene.frames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <Backdrop mode={scene.mode} />
      <div style={{ position: 'absolute', left: SAFE.left, right: W - SAFE.right, top: 280, height: 1030, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: out }}>
        {/* İçerik sıkıştırılmaz: sığmazsa metin taşması kontrolü yakalar. */}
        <SettleCtx.Provider value={Math.min(SETTLE, scene.frames - 2)}>
          <div style={{ flexShrink: 0 }}><BeatView scene={scene} channel={channel} /></div>
        </SettleCtx.Provider>
      </div>
    </AbsoluteFill>
  );
}

function Chrome({ script }: { script: StoryScript }) {
  const f = useCurrentFrame();
  const t = f / FPS;
  const scene = script.scenes.find((s) => t >= s.start && t < s.start + s.duration) ?? script.scenes.at(-1)!;
  return (
    <>
      <TopBar script={script} mode={scene.mode} progress={Math.min(1, t / script.duration_sec)} />
      {scene.show.type !== 'outro' && <Captions chunks={script.captions} mode={scene.mode} />}
    </>
  );
}

export function Story({ script }: StoryProps) {
  return (
    <AbsoluteFill style={{ width: W, height: H, background: C.light.bg }}>
      {script.scenes.map((s) => (
        <Sequence key={s.id} from={Math.round(s.start * FPS)} durationInFrames={s.frames} layout="none">
          <SceneFrame scene={s} channel={script.channel} />
        </Sequence>
      ))}
      <Chrome script={script} />
      {script.audio_src && <Audio src={script.audio_src} />}
    </AbsoluteFill>
  );
}
