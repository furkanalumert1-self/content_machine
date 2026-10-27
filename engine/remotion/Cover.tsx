// Reels kapağı (1080×1920): üstte iki satırlık başlık (kalın + italik serif), ortada tek çizim nesne,
// altta aralıklı kanal adı. Profil ızgarası kapağı 3:4 kırpar: her şey ortadaki 1080×1440 alanda (y 240–1680) kalır.
// Resmî logo yok; marka nesne ve renkle çağrıştırılır.
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { useTextQc } from './qc.tsx';
import { FONT, H, W } from './theme.ts';

export type CoverIcon =
  | 'stamp-card' | 'phone-streak' | 'hourglass' | 'parcel' | 'coffee' | 'music-cards' | 'cart' | 'cookie-jar'
  | 'ruler' | 'gift' | 'tag' | 'hanger' | 'remote' | 'flatpack' | 'basket';
export type CoverTheme = 'light' | 'dark' | 'warm' | 'green';

export interface CoverSpec { line1: string; line2: string; icon: CoverIcon; number?: string; theme: CoverTheme }
export interface CoverProps { cover: CoverSpec; channel: string; caseNo: number; [key: string]: unknown }

export const COVER_SAFE = { top: 240, bottom: 1680 }; // 3:4 ızgara kırpması
const SERIF = '"Instrument Serif", serif';

const THEMES: Record<CoverTheme, { bg: string; glow: string; ink: string; accent: string; muted: string; obj: string; obj2: string; shadow: string }> = {
  light: { bg: '#ECEAE6', glow: 'rgba(255,255,255,0.75)', ink: '#151515', accent: '#E8402A', muted: '#6F6C66', obj: '#FFFFFF', obj2: '#D9D6CF', shadow: 'rgba(21,21,21,0.18)' },
  dark: { bg: '#0D1B2C', glow: 'rgba(95,212,230,0.16)', ink: '#F4F7FB', accent: '#5FD4E6', muted: 'rgba(244,247,251,0.55)', obj: '#1C2E45', obj2: '#2A4260', shadow: 'rgba(0,0,0,0.45)' },
  warm: { bg: '#E7DCCB', glow: 'rgba(255,248,236,0.8)', ink: '#1E1A16', accent: '#E8402A', muted: '#7A6E60', obj: '#FBF6EE', obj2: '#D8CBB6', shadow: 'rgba(60,40,20,0.2)' },
  green: { bg: '#0F3B2E', glow: 'rgba(255,255,255,0.10)', ink: '#F3F1EA', accent: '#F2C14E', muted: 'rgba(243,241,234,0.6)', obj: '#F3F1EA', obj2: '#CFC8B6', shadow: 'rgba(0,0,0,0.4)' },
};
type T = (typeof THEMES)[CoverTheme];

// ---------------------------------------------------------------- çizim nesneler (viewBox 0 0 400 400)
const Svg = ({ children, t }: { children: ReactNode; t: T }) => (
  <svg viewBox="0 0 400 400" width="680" height="680" style={{ filter: `drop-shadow(0 34px 40px ${t.shadow})` }}>{children}</svg>
);

const ICONS: Record<CoverIcon, (t: T) => ReactNode> = {
  'stamp-card': (t) => (
    <Svg t={t}>
      <g transform="rotate(-8 200 200)">
        <rect x="30" y="100" width="340" height="210" rx="22" fill={t.obj} stroke={t.obj2} strokeWidth="4" />
        <rect x="30" y="100" width="340" height="52" rx="22" fill={t.ink} />
        <rect x="30" y="130" width="340" height="22" fill={t.ink} />
        <text x="54" y="135" fontFamily="Outfit" fontWeight="800" fontSize="26" fill={t.obj}>SADAKAT KARTI</text>
        {Array.from({ length: 10 }, (_, i) => {
          const x = 70 + (i % 5) * 65, y = 195 + Math.floor(i / 5) * 72, on = i < 2;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="24" fill={on ? t.accent : 'none'} stroke={on ? t.accent : t.obj2} strokeWidth="5" strokeDasharray={on ? undefined : '6 6'} />
              {on && <path d={`M${x - 11} ${y} l8 9 l15 -18`} stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            </g>
          );
        })}
      </g>
    </Svg>
  ),
  'phone-streak': (t) => (
    <Svg t={t}>
      <rect x="110" y="20" width="180" height="360" rx="34" fill="#151515" />
      <rect x="122" y="32" width="156" height="336" rx="26" fill="#22272F" />
      <rect x="132" y="120" width="136" height="74" rx="14" fill="#F5F5F5" />
      <circle cx="152" cy="140" r="9" fill={t.accent} />
      <rect x="168" y="134" width="80" height="10" rx="5" fill="#333" />
      <rect x="146" y="160" width="108" height="8" rx="4" fill="#999" />
      <rect x="146" y="175" width="76" height="8" rx="4" fill="#BBB" />
      <path d="M200 228c10 26 40 36 40 70a40 40 0 0 1-80 0c0-20 11-30 20-41 2 13 9 19 15 21-4-19 0-36 5-50z" fill="#F2994A" />
      <path d="M200 280c7 13 19 17 19 33a19 19 0 0 1-38 0c0-11 9-17 19-33z" fill="#FFE08A" />
    </Svg>
  ),
  hourglass: (t) => (
    <Svg t={t}>
      <rect x="100" y="30" width="200" height="24" rx="10" fill={t.ink} />
      <rect x="100" y="346" width="200" height="24" rx="10" fill={t.ink} />
      <path d="M125 54h150c0 70-55 100-55 146s55 76 55 146H125c0-70 55-100 55-146s-55-76-55-146z" fill={t.obj} stroke={t.obj2} strokeWidth="5" />
      <path d="M150 90h100c-8 40-40 60-50 90-10-30-42-50-50-90z" fill={t.accent} opacity="0.35" />
      <path d="M140 330h120c-10-40-40-56-60-60-20 4-50 20-60 60z" fill={t.accent} />
      <path d="M200 190v80" stroke={t.accent} strokeWidth="4" strokeDasharray="6 8" />
    </Svg>
  ),
  parcel: (t) => (
    <Svg t={t}>
      <path d="M60 140 200 80l140 60v160l-140 60-140-60z" fill="#C89B62" />
      <path d="M60 140 200 200l140-60-140-60z" fill="#DDB27A" />
      <path d="M200 200v160l140-60V140z" fill="#B3854F" />
      <path d="M128 110 268 170v40l-22 10v-40L106 120z" fill="#2A6FDB" opacity="0.9" />
      <path d="M90 250l70 30" stroke="#8A6236" strokeWidth="6" strokeLinecap="round" />
    </Svg>
  ),
  coffee: (t) => (
    <Svg t={t}>
      <path d="M110 120h180l-22 240a16 16 0 0 1-16 14H148a16 16 0 0 1-16-14z" fill={t.obj} />
      <rect x="100" y="96" width="200" height="34" rx="10" fill={t.obj2} />
      <rect x="116" y="74" width="168" height="30" rx="10" fill={t.obj} />
      <rect x="126" y="210" width="148" height="70" fill={t.accent} opacity="0.9" />
      <path d="M200 222l9 19 21 3-15 14 4 21-19-10-19 10 4-21-15-14 21-3z" fill="#fff" />
    </Svg>
  ),
  'music-cards': (t) => (
    <Svg t={t}>
      <rect x="70" y="80" width="200" height="260" rx="20" fill="#7B4DFF" transform="rotate(-14 170 210)" />
      <rect x="110" y="70" width="200" height="260" rx="20" fill="#FF5E7E" transform="rotate(-4 210 200)" />
      <rect x="140" y="64" width="200" height="260" rx="20" fill="#1ED760" transform="rotate(8 240 194)" />
      <g transform="rotate(8 240 194)">
        <text x="160" y="120" fontFamily="Outfit" fontWeight="800" fontSize="30" fill="#0B0B0B">SENİN</text>
        <text x="160" y="152" fontFamily="Outfit" fontWeight="800" fontSize="30" fill="#0B0B0B">YILIN</text>
        {[0, 1, 2, 3].map((i) => <rect key={i} x="160" y={190 + i * 28} width={140 - i * 26} height="16" rx="8" fill="#0B0B0B" opacity={0.85 - i * 0.15} />)}
      </g>
    </Svg>
  ),
  cart: (t) => (
    <Svg t={t}>
      <path d="M40 90h50l40 170h190l30-120H110" fill="none" stroke={t.ink} strokeWidth="16" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="140" y="160" width="60" height="70" rx="8" fill={t.accent} />
      <rect x="210" y="150" width="70" height="80" rx="8" fill={t.obj2} />
      <circle cx="150" cy="310" r="24" fill={t.ink} />
      <circle cx="290" cy="310" r="24" fill={t.ink} />
      <rect x="60" y="360" width="280" height="18" rx="9" fill={t.obj2} />
      <rect x="60" y="360" width="220" height="18" rx="9" fill={t.accent} />
    </Svg>
  ),
  'cookie-jar': (t) => (
    <Svg t={t}>
      <rect x="120" y="40" width="160" height="40" rx="12" fill={t.ink} />
      <path d="M110 90h180c20 0 30 14 30 34v214c0 22-14 34-34 34H114c-20 0-34-12-34-34V124c0-20 10-34 30-34z" fill="rgba(255,255,255,0.55)" stroke={t.obj2} strokeWidth="6" />
      {[[160, 330], [235, 322]].map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r="34" fill="#C98B4B" />{[[-12, -8], [10, -12], [0, 10], [14, 8]].map(([dx, dy], k) => <circle key={k} cx={x + dx} cy={y + dy} r="5" fill="#5A3416" />)}</g>
      ))}
      <path d="M120 120c10-6 20-6 30 0" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity="0.8" />
    </Svg>
  ),
  ruler: (t) => (
    <Svg t={t}>
      <g transform="rotate(-18 200 200)">
        <rect x="20" y="150" width="360" height="100" rx="10" fill="#F2C14E" />
        {Array.from({ length: 25 }, (_, i) => <rect key={i} x={36 + i * 13.5} y="150" width="4" height={i % 5 === 0 ? 46 : 26} fill="#151515" />)}
        <text x="40" y="236" fontFamily="Outfit" fontWeight="800" fontSize="34" fill="#151515">5</text>
        <text x="330" y="236" fontFamily="Outfit" fontWeight="800" fontSize="34" fill="#151515">25</text>
      </g>
    </Svg>
  ),
  gift: (t) => (
    <Svg t={t}>
      <rect x="70" y="170" width="260" height="190" rx="14" fill={t.obj} />
      <rect x="56" y="126" width="288" height="60" rx="12" fill={t.obj2} />
      <rect x="182" y="126" width="36" height="234" fill={t.accent} />
      <path d="M200 126c-40-60-110-40-80 0zM200 126c40-60 110-40 80 0z" fill="none" stroke={t.accent} strokeWidth="18" strokeLinejoin="round" />
    </Svg>
  ),
  tag: (t) => (
    <Svg t={t}>
      <g transform="rotate(-16 200 200)">
        <path d="M30 120h260l80 80-80 80H30z" fill={t.accent} />
        <circle cx="318" cy="200" r="16" fill={t.bg} />
        <text x="58" y="214" fontFamily="Outfit" fontWeight="800" fontSize="40" fill="#fff">SANA ÖZEL</text>
        <path d="M334 200c40 0 50-60 30-110" stroke={t.ink} strokeWidth="6" fill="none" />
      </g>
    </Svg>
  ),
  hanger: (t) => (
    <Svg t={t}>
      <rect x="30" y="60" width="340" height="14" rx="7" fill={t.ink} />
      {[90, 200, 310].map((x, i) => (
        <g key={i}>
          <path d={`M${x} 74v20`} stroke={t.ink} strokeWidth="6" />
          <path d={`M${x - 70} 150 L${x} 100 L${x + 70} 150 V330 H${x - 70} Z`} fill={i === 1 ? t.accent : i === 0 ? t.obj : t.obj2} />
        </g>
      ))}
      <rect x="250" y="268" width="110" height="40" rx="8" fill={t.ink} />
      <text x="262" y="296" fontFamily="Outfit" fontWeight="800" fontSize="24" fill={t.bg}>YENİ</text>
    </Svg>
  ),
  remote: (t) => (
    <Svg t={t}>
      <g transform="rotate(-20 200 200)">
        <rect x="140" y="30" width="120" height="340" rx="50" fill="#151515" />
        <circle cx="200" cy="110" r="38" fill="#2A2F3A" />
        <path d="M188 92v36l30-18z" fill="#E50914" />
        {[0, 1, 2].map((i) => <rect key={i} x="170" y={180 + i * 44} width="60" height="24" rx="12" fill="#2A2F3A" />)}
      </g>
      <path d="M300 300a80 80 0 1 1-30-90" fill="none" stroke={t.accent} strokeWidth="14" strokeLinecap="round" />
      <path d="M262 186l14 26 24-14" fill="none" stroke={t.accent} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  flatpack: (t) => (
    <Svg t={t}>
      <path d="M50 170 200 110l150 60v130l-150 60-150-60z" fill="#C89B62" />
      <path d="M50 170 200 230l150-60-150-60z" fill="#DDB27A" />
      <path d="M200 230v130l150-60V170z" fill="#B3854F" />
      <rect x="230" y="250" width="90" height="40" fill="#F2C14E" transform="skewY(-22)" />
      <path d="M90 60l60 60v24" stroke="#5E6670" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  basket: (t) => (
    <Svg t={t}>
      <path d="M120 150 Q200 40 280 150" fill="none" stroke={t.ink} strokeWidth="16" strokeLinecap="round" />
      <rect x="60" y="150" width="280" height="30" rx="14" fill={t.ink} />
      <path d="M78 190l26 150q4 14 18 14h156q14 0 18-14l26-150z" fill={t.obj} stroke={t.ink} strokeWidth="10" strokeLinejoin="round" />
      <rect x="130" y="196" width="60" height="70" rx="8" fill={t.accent} />
      <rect x="210" y="210" width="60" height="56" rx="8" fill={t.obj2} />
      <circle cx="320" cy="90" r="46" fill={t.obj} stroke={t.accent} strokeWidth="8" />
      <path d="M320 64v28l18 12" stroke={t.accent} strokeWidth="8" fill="none" strokeLinecap="round" />
    </Svg>
  ),
};

export function Cover({ cover, channel, caseNo }: CoverProps) {
  const t = THEMES[cover.theme];
  const titleRef = useTextQc<HTMLDivElement>('kapak-baslik', 0);
  return (
    <AbsoluteFill style={{ width: W, height: H, background: t.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: `radial-gradient(900px 900px at 50% 58%, ${t.glow}, transparent 70%)` }} />
      <div ref={titleRef} style={{ position: 'absolute', top: 300, left: 84, right: 84, maxHeight: 330, overflow: 'hidden' }}>
        <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 128, lineHeight: 0.98, letterSpacing: -4, color: t.ink }}>{cover.line1}</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 108, lineHeight: 1.05, color: t.accent, marginTop: 6 }}>{cover.line2}</div>
      </div>
      <div style={{ position: 'absolute', top: 610, left: 0, width: W, display: 'flex', justifyContent: 'center' }}>{ICONS[cover.icon](t)}</div>
      {cover.number && (
        <div style={{ position: 'absolute', left: 84, top: 1330, fontFamily: FONT.sans, fontWeight: 800, fontSize: 140, letterSpacing: -5, color: t.accent, lineHeight: 1, textShadow: `0 8px 24px ${t.shadow}` }}>{cover.number}</div>
      )}
      <div style={{ position: 'absolute', top: 1560, left: 0, width: W, textAlign: 'center', fontFamily: FONT.mono, fontSize: 30, letterSpacing: 14, color: t.muted }}>
        {channel.toLocaleUpperCase('tr').split('').join('')}
        <span style={{ color: t.accent, marginLeft: 18 }}>#{String(caseNo).padStart(2, '0')}</span>
      </div>
    </AbsoluteFill>
  );
}
