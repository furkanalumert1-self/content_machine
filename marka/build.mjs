// Marka çıktılarını üretir: profil logosu (PNG/SVG) ve "25 taktik" PDF rehberi.
// Çalıştırma (depo kökünden): node marka/build.mjs   → marka/cikti/
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { logoSvg } from './logo.mjs';
import { CHAPTERS, CLOSING, INTRO, LEGAL, SOURCES, SUBTITLE, TITLE } from './rehber-icerik.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'cikti');
mkdirSync(out, { recursive: true });
const font = (pkg, file) => pathToFileURL(join(here, '../node_modules/@fontsource', pkg, 'files', file)).href;

const FONTS = `
@font-face { font-family: Outfit; font-weight: 400; src: url(${font('outfit', 'outfit-latin-ext-400-normal.woff2')}); unicode-range: U+0100-024F; }
@font-face { font-family: Outfit; font-weight: 400; src: url(${font('outfit', 'outfit-latin-400-normal.woff2')}); }
@font-face { font-family: Outfit; font-weight: 600; src: url(${font('outfit', 'outfit-latin-ext-600-normal.woff2')}); unicode-range: U+0100-024F; }
@font-face { font-family: Outfit; font-weight: 600; src: url(${font('outfit', 'outfit-latin-600-normal.woff2')}); }
@font-face { font-family: Outfit; font-weight: 800; src: url(${font('outfit', 'outfit-latin-ext-800-normal.woff2')}); unicode-range: U+0100-024F; }
@font-face { font-family: Outfit; font-weight: 800; src: url(${font('outfit', 'outfit-latin-800-normal.woff2')}); }
@font-face { font-family: Mono; font-weight: 500; src: url(${font('jetbrains-mono', 'jetbrains-mono-latin-ext-500-normal.woff2')}); unicode-range: U+0100-024F; }
@font-face { font-family: Mono; font-weight: 500; src: url(${font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2')}); }`;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const up = (s) => s.toLocaleUpperCase('tr');

function rehberHtml() {
  let n = 0;
  const srcNo = Object.fromEntries(Object.keys(SOURCES).map((k, i) => [k, i + 1]));
  const chapters = CHAPTERS.map((c, ci) => `
    <section class="chapter">
      <div class="kicker">BÖLÜM ${ci + 1} / ${CHAPTERS.length}</div>
      <h2>${esc(c.title)}</h2>
      <p class="lead">${esc(c.intro)}</p>
    </section>
    ${c.items.map((it) => {
      n += 1;
      return `
      <article>
        <div class="no">${String(n).padStart(2, '0')}</div>
        <h3>${esc(it.t)}</h3>
        <div class="label">NEDEN İŞE YARAR</div>
        <p>${esc(it.why)}${it.src ? ` <span class="ref">[${it.src.map((s) => srcNo[s]).join(', ')}]</span>` : ''}</p>
        <div class="label">NASIL UYGULARSIN</div>
        <ul>${it.how.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
        ${it.msg ? `<div class="label">ÖRNEK MESAJ</div><div class="msg">${esc(it.msg).replace(/\[([^\]]+)\]/g, '<b>[$1]</b>')}</div>` : ''}
      </article>`;
    }).join('')}`).join('');

  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(TITLE)}</title><style>
${FONTS}
@page { size: A4; margin: 18mm 17mm 20mm; }
:root { --paper:#ECEAE6; --card:#F7F6F3; --ink:#151515; --muted:#6F6C66; --line:#D9D6CF; --red:#E8402A; --navy:#0D1B2C; --cyan:#5FD4E6; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: Outfit, sans-serif; color: var(--ink); font-size: 10.5pt; line-height: 1.5; }
.cover { height: 257mm; background: var(--navy); color: #E6F6FA; margin: -18mm -17mm 0; padding: 26mm 20mm; display: flex; flex-direction: column; page-break-after: always;
  background-image: linear-gradient(rgba(95,212,230,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(95,212,230,.07) 1px, transparent 1px); background-size: 9mm 9mm; }
.cover .brand { font-family: Mono; letter-spacing: .3em; font-size: 9pt; color: var(--cyan); }
.cover h1 { font-weight: 800; font-size: 34pt; line-height: 1.06; letter-spacing: -.02em; margin: 36mm 0 6mm; }
.cover h1 em { font-style: normal; color: var(--red); }
.cover .sub { font-size: 13pt; color: rgba(230,246,250,.75); max-width: 130mm; }
.cover .logo { width: 34mm; height: 34mm; margin-top: auto; border-radius: 50%; overflow: hidden; }
.cover .scan { height: 2.2mm; background: var(--red); width: 46mm; margin: 8mm 0; border-radius: 2mm; }
.page { page-break-after: always; }
.kicker, .label { font-family: Mono; font-size: 7.5pt; letter-spacing: .18em; color: var(--muted); }
.label { margin: 3mm 0 1mm; }
h2 { font-weight: 800; font-size: 24pt; letter-spacing: -.01em; margin: 2mm 0 2mm; }
.lead { font-size: 12pt; color: var(--muted); margin: 0 0 4mm; }
.chapter { page-break-before: always; border-top: 1.2mm solid var(--red); padding-top: 6mm; margin-bottom: 6mm; }
article { background: var(--card); border: .3mm solid var(--line); border-radius: 4mm; padding: 6mm 7mm 5mm; margin: 0 0 5mm; page-break-inside: avoid; position: relative; }
article .no { position: absolute; top: 5mm; right: 7mm; font-weight: 800; font-size: 20pt; color: var(--red); }
h3 { font-weight: 800; font-size: 14pt; margin: 0 14mm 1mm 0; line-height: 1.2; }
article p { margin: 0; }
ul { margin: 0; padding-left: 5mm; } li { margin: .5mm 0; }
.msg { background: #fff; border-left: 1.2mm solid var(--ink); border-radius: 2mm; padding: 2.5mm 3.5mm; font-size: 10pt; }
.msg b { color: var(--red); font-weight: 600; }
.ref { font-family: Mono; font-size: 7.5pt; color: var(--muted); }
.box { background: var(--card); border: .3mm solid var(--line); border-radius: 4mm; padding: 6mm 7mm; margin: 5mm 0; }
.legal li { margin: 1.5mm 0; }
.sources { font-size: 8.5pt; } .sources li { margin: 1mm 0; word-break: break-all; } .sources a { color: var(--ink); }
.closing { background: var(--navy); color: #E6F6FA; border-radius: 5mm; padding: 10mm; margin-top: 8mm; page-break-inside: avoid; }
.closing h2 { color: #fff; }
.btn { display: inline-block; margin-top: 4mm; background: var(--red); color: #fff; text-decoration: none; font-weight: 600; padding: 3mm 7mm; border-radius: 10mm; }
</style></head><body>
  <section class="cover">
    <div class="brand">SEPET RÖNTGENİ · REHBER</div>
    <h1>${esc(TITLE).replace('25 taktik', '<em>25 taktik</em>')}</h1>
    <div class="scan"></div>
    <div class="sub">${esc(SUBTITLE)}</div>
    <div class="logo">${logoSvg('koyu').replace('width="1080" height="1080"', 'width="100%" height="100%"')}</div>
  </section>
  <section class="page">
    <div class="kicker">BAŞLAMADAN ÖNCE</div>
    <h2>Bu rehber nasıl okunur?</h2>
    ${INTRO.map((p) => `<p class="lead">${esc(p)}</p>`).join('')}
    <div class="box legal"><div class="label">YASAL HATIRLATMA</div><ul>${LEGAL.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>
    <div class="box"><div class="label">İÇİNDEKİLER</div><ol>${CHAPTERS.map((c, i) => `<li>${esc(c.title)} <span class="ref">· taktik ${i * 5 + 1}–${i * 5 + 5}</span></li>`).join('')}</ol></div>
  </section>
  ${chapters}
  <section class="chapter">
    <div class="kicker">KAYNAKLAR</div>
    <h2>Rakamların kaynakları</h2>
    <ol class="sources">${Object.values(SOURCES).map(([l, u]) => `<li>${esc(l)} — <a href="${u}">${esc(u)}</a></li>`).join('')}</ol>
    <div class="closing">
      <div class="kicker" style="color:var(--cyan)">SIRADAKİ ADIM</div>
      <h2>${esc(CLOSING.title)}</h2>
      <p>${esc(CLOSING.text)}</p>
      <a class="btn" href="${CLOSING.url}">${esc(CLOSING.button)} →</a>
    </div>
  </section>
</body></html>`;
}

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
try {
  const page = await browser.newPage();
  // Logolar
  for (const v of ['koyu', 'acik']) {
    const svg = logoSvg(v);
    writeFileSync(join(out, `logo-${v}.svg`), svg);
    await page.setViewportSize({ width: 1080, height: 1080 });
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.screenshot({ path: join(out, `logo-${v}.png`), clip: { x: 0, y: 0, width: 1080, height: 1080 } });
  }
  // Profil önizlemesi: daire kırpma, küçük boy
  await page.setViewportSize({ width: 900, height: 360 });
  await page.setContent(`<html><body style="margin:0;background:#fff;font-family:sans-serif;display:flex;gap:40px;align-items:center;padding:30px">
    ${['koyu', 'acik'].map((v) => `<div style="text-align:center"><img src="data:image/svg+xml;base64,${Buffer.from(logoSvg(v)).toString('base64')}" style="width:220px;height:220px;border-radius:50%;border:1px solid #ddd"><div>${v} · 220px</div></div>
      <div style="text-align:center"><img src="data:image/svg+xml;base64,${Buffer.from(logoSvg(v)).toString('base64')}" style="width:56px;height:56px;border-radius:50%"><div>56px</div></div>`).join('')}
  </body></html>`);
  await page.screenshot({ path: join(out, 'logo-onizleme.png') });

  // PDF
  const html = rehberHtml();
  writeFileSync(join(out, 'rehber.html'), html);
  await page.goto(pathToFileURL(join(out, 'rehber.html')).href);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: join(out, 'sepet-rontgeni-25-taktik.pdf'), format: 'A4', printBackground: true, displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:7pt;width:100%;padding:0 17mm;color:#8a867f;display:flex;justify-content:space-between;font-family:monospace"><span>SEPET RÖNTGENİ · 25 TAKTİK</span><span class="pageNumber"></span></div>',
    margin: { top: '18mm', bottom: '20mm', left: '17mm', right: '17mm' } });
  console.log('Yazıldı:', out);
} finally {
  await browser.close();
}
