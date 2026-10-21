// Dark Tech Keynote — lemo-opuscar/styles/dark-keynote (MIT) kurallarından uyarlanmıştır.
export const W = 1080;
export const H = 1920;

// Reels arayüzü (üstte hesap adı, altta açıklama/butonlar) bu alanların dışını kapatır.
export const SAFE = { top: 250, bottom: 1500, left: 90, right: 990 };

export interface Brand {
  name: string;
  navy: string;
  navy2: string;
  accent: string; // tek vurgu rengi: yalnızca sahnedeki en önemli öğe
}

export const FONT = { sans: 'Outfit, sans-serif', mono: '"JetBrains Mono", monospace' };

export const ease = (t: number) => {
  // Zıplamasız, ızgaraya oturan hareket: cubic-bezier(0.2, 0, 0, 1) yaklaşık hâli.
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 4);
};
