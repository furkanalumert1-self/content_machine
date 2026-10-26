// Sepet Röntgeni profil logosu: röntgendeki bir alışveriş sepeti + tarama çizgisi + vizör köşeleri.
// Instagram profil fotoğrafını daire olarak kırpar; önemli her şey ortadaki dairenin içinde kalır.
export const COLORS = { navy: '#0D1B2C', cyan: '#5FD4E6', red: '#E8402A', paper: '#ECEAE6', ink: '#151515' };

function basket(stroke, w) {
  return `
  <path d="M33 44 Q50 20 67 44" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>
  <path d="M20 44 H80" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>
  <path d="M24 50 L30 76 Q31 79 34 79 H66 Q69 79 70 76 L76 50 Z" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>
  <path d="M38 55 L40 73 M50 55 V73 M62 55 L60 73" stroke="${stroke}" stroke-width="${w * 0.8}" stroke-linecap="round" opacity="0.85"/>`;
}

function corners(stroke) {
  const c = (x, y, dx, dy) => `<path d="M${x} ${y + dy * 7} V${y} H${x + dx * 7}" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"/>`;
  return c(17, 17, 1, 1) + c(83, 17, -1, 1) + c(17, 83, 1, -1) + c(83, 83, -1, -1);
}

export function logoSvg(variant) {
  const dark = variant !== 'acik';
  const bg = dark ? COLORS.navy : COLORS.paper;
  const line = dark ? COLORS.cyan : COLORS.ink;
  const grid = dark
    ? `<g opacity="0.10" stroke="${COLORS.cyan}" stroke-width="0.3">${Array.from({ length: 11 }, (_, i) => `<path d="M${i * 10} 0 V100 M0 ${i * 10} H100"/>`).join('')}</g>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1080" height="1080">
  <rect width="100" height="100" fill="${bg}"/>
  ${grid}
  ${corners(dark ? COLORS.cyan : COLORS.ink)}
  ${dark ? `<g filter="url(#glow)">${basket(line, 3.2)}</g>` : basket(line, 3.6)}
  <rect x="12" y="60.2" width="76" height="2.6" rx="1.3" fill="${COLORS.red}"/>
  <rect x="12" y="56" width="76" height="11" fill="${COLORS.red}" opacity="0.12"/>
  <defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
</svg>`;
}
