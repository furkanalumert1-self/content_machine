import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import '@fontsource/outfit/300.css';
import '@fontsource/jetbrains-mono/500.css';
import { useEffect, useState } from 'react';
import { Composition, continueRender, delayRender, registerRoot } from 'remotion';
import { FPS } from '../src/plan/script.ts';
import { Reel, type ReelProps } from './Reel.tsx';
import { Story, type StoryProps } from './Story.tsx';
import { H, W } from './theme.ts';

const FONTS = ['300 40px Outfit', '800 40px Outfit', '400 40px Outfit', '500 40px Outfit', '600 40px Outfit', '700 40px Outfit', '500 40px "JetBrains Mono"'];

function useFonts() {
  // Fontlar yüklenmeden kare çekilmesin; aksi hâlde metin ölçümü ve görüntü yanlış olur.
  const [handle] = useState(() => delayRender('Fontlar yükleniyor'));
  useEffect(() => {
    Promise.all(FONTS.map((f) => document.fonts.load(f))).then(() => continueRender(handle));
  }, [handle]);
}

function WithFonts(props: ReelProps) {
  useFonts();
  return <Reel {...props} />;
}

function StoryWithFonts(props: StoryProps) {
  useFonts();
  return <Story {...props} />;
}

const storyPlaceholder: StoryProps = {
  script: {
    version: 2, format: 'story', product: 'x', channel: 'Sepet Röntgeni', content_type: 'marka_rontgeni', case_no: 1, case_label: 'örnek', hook: 'Örnek',
    scenes: [{ id: 's0', start: 0, duration: 5, frames: 150, say: 'Örnek', show: { type: 'title', text: 'Örnek' }, mode: 'light' }],
    captions: [], duration_sec: 5, voice: { provider: 'elevenlabs', voice_id: '', model: '', lufs: null },
    cta: '', cta_url: '', sample_data: false, review_notes: [], sources: [],
  },
};

const placeholder: ReelProps = {
  script: { version: 1, product: 'x', content_type: 'ipucu', hook: 'Örnek', scenes: [{ id: 's0', kind: 'hook', start: 0, duration: 15, frames: 450, lines: ['Örnek'], visual: { type: 'hook' }, sample_data: false }], duration_sec: 15, cta: 'Canlı demoyu dene', cta_url: 'https://x', sample_data: false, review_notes: [] },
  brand: { name: 'Callypso Engage', navy: '#0F1B33', navy2: '#1B2F52', accent: '#5FD4E6' },
  featureTitles: [],
};

function Root() {
  return (
    <>
    <Composition
      id="Reel"
      component={WithFonts}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={450}
      defaultProps={placeholder}
      calculateMetadata={({ props }) => ({ durationInFrames: props.script.scenes.reduce((s, x) => s + x.frames, 0) })}
    />
    <Composition
      id="Story"
      component={StoryWithFonts}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={150}
      defaultProps={storyPlaceholder}
      calculateMetadata={({ props }) => ({ durationInFrames: props.script.scenes.reduce((s, x) => s + x.frames, 0) })}
    />
    </>
  );
}

registerRoot(Root);
