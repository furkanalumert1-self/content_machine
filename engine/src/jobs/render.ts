// Planlanmış videoları render eder → kalite kontrolü → Supabase Storage (özel bucket) → "ready".
// Başarısızsa en fazla 2 yeniden deneme; sonra "render_failed" (yayınlanamaz) ve hata kaydı.
// Tekrar çalıştırılabilir: yalnızca "planned" ve 30 dakikadan uzun süredir takılı "rendering" videoları alır.
// Çalıştırma: npx tsx src/jobs/render.ts
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseBrief } from '../brief/brief.ts';
import { serviceClient } from '../lib/db.ts';
import { createLogger } from '../lib/logger.ts';
import type { Script } from '../plan/script.ts';
import { toSrt } from '../render/qc.ts';
import { MAX_ATTEMPTS, renderWithRetries } from '../render/render.ts';
import { BUCKET } from '../lib/storage.ts';
import { buildButtons, callbackKey, readyMessage } from '../approvals/telegram-approval.ts';
import { TelegramApi } from '../notify/telegram.ts';
import { renderCover } from '../story/cover.ts';
import { produceStory } from '../story/produce.ts';
import { storySrt } from '../story/render.ts';
import type { StoryScript } from '../story/types.ts';
import { VOICE_ID } from '../topics/channel.ts';

const PREVIEW_URL_SECONDS = 48 * 3600;

export const LICENSES = [
  { asset: 'Outfit (font)', license: 'OFL-1.1', source: '@fontsource/outfit 5.3.0' },
  { asset: 'JetBrains Mono (font)', license: 'OFL-1.1', source: '@fontsource/jetbrains-mono 5.3.0' },
  { asset: 'Dark Tech Keynote stil kuralları', license: 'MIT', source: 'github.com/lemomo-ai/lemo-opuscar (LemoLab)' },
  { asset: 'Remotion (render motoru)', license: 'Remotion Free License (birey / ≤3 çalışan)', source: 'remotion.dev/license' },
  { asset: 'Görseller', license: 'Kendi üretimimiz (kodla çizildi)', source: 'engine/remotion' },
  { asset: 'Müzik', license: 'Yok (sessiz ses izi)', source: '-' },
];

const STORY_LICENSES = [
  ...LICENSES.filter((l) => !['Müzik', 'Dark Tech Keynote stil kuralları'].includes(l.asset)),
  { asset: 'Seslendirme', license: 'ElevenLabs ücretli plan ticari lisansı (yapay zekâ sesi)', source: 'elevenlabs.io/terms-of-use' },
  { asset: 'Müzik', license: 'Yok', source: '-' },
  { asset: 'Instrument Serif (kapak yazı tipi)', license: 'OFL-1.1', source: '@fontsource/instrument-serif 5.3.0' },
];

const db = serviceClient('render');
const log = createLogger('render', db);

const { data: buckets } = await db.storage.listBuckets();
if (!buckets?.some((b) => b.name === BUCKET)) {
  const { error } = await db.storage.createBucket(BUCKET, { public: false });
  if (error) throw error;
}

const staleBefore = new Date(Date.now() - 30 * 60_000).toISOString();
const { data: queue, error } = await db.from('videos')
  .select('id, product_id, brief_id, script, render_attempts, status, products(slug, name, brand_colors), product_briefs(content_md)')
  .or(`status.eq.planned,and(status.eq.rendering,updated_at.lt.${staleBefore})`)
  .order('created_at');
if (error) throw error;

let failures = 0;
for (const v of queue ?? []) {
  const product = (Array.isArray(v.products) ? v.products[0] : v.products) as { slug: string; name: string; brand_colors: Record<string, string> };
  const briefRow = (Array.isArray(v.product_briefs) ? v.product_briefs[0] : v.product_briefs) as { content_md: string };
  const brief = parseBrief(briefRow.content_md);
  if ((v.script as { format?: string }).format === 'story') {
    if (await renderStoryVideo(v.id, v.script as StoryScript, product.slug, v.render_attempts)) failures++;
    continue;
  }
  const script = v.script as Script;
  const props = {
    script,
    brand: { name: (v.script as Script).channel ?? product.name, navy: product.brand_colors.navy, navy2: product.brand_colors.navy_2, accent: product.brand_colors.cyan },
    featureTitles: brief.features.map((f) => f.title),
  };

  let attempts = v.render_attempts;
  const result = await renderWithRetries(props, join(tmpdir(), 'cm-render'), v.id, {
    maxAttempts: MAX_ATTEMPTS - attempts, // takılıp yeniden alınan videoda önceki denemeler sayılır
    onAttempt: async () => {
      attempts += 1;
      await db.from('videos').update({ status: 'rendering', render_attempts: attempts }).eq('id', v.id);
    },
  });

  if (!result.ok || !result.output) {
    failures++;
    await db.from('videos').update({ status: 'render_failed', error: result.errors.join('\n'), qc: result.output?.qc ?? null }).eq('id', v.id);
    await log.error(`Video ${v.id} üretilemedi; yayınlanmayacak.`, { errors: result.errors, notify: true });
    continue;
  }

  const path = `${product.slug}/${v.id}.mp4`;
  const up = await db.storage.from(BUCKET).upload(path, readFileSync(result.output.file), { contentType: 'video/mp4', upsert: true });
  if (up.error) {
    failures++;
    await db.from('videos').update({ status: 'render_failed', error: `Yükleme hatası: ${up.error.message}` }).eq('id', v.id);
    await log.error(`Video ${v.id} yüklenemedi.`, { error: up.error.message, notify: true });
    continue;
  }
  await db.storage.from(BUCKET).upload(`${product.slug}/${v.id}.srt`, toSrt(script), { contentType: 'text/plain', upsert: true });

  await db.from('videos').update({
    status: 'ready', storage_path: path, file_size_bytes: result.output.qc.probe.bytes,
    qc: { ...result.output.qc, render_ms: result.output.ms, attempts: result.attempts }, licenses: LICENSES, error: null,
  }).eq('id', v.id);
  await log.info(`Video ${v.id} hazır (${(result.output.ms / 1000).toFixed(0)} sn render, ${result.attempts}. deneme).`);
  await sendForApproval(v.id);
}
if (failures) process.exitCode = 1;

/** Hikâye formatı: seslendir → zamanla → render → yükle. Hata olursa true döner. */
async function renderStoryVideo(id: string, stored: StoryScript, slug: string, attempts: number): Promise<boolean> {
  // Kanal sesi değişirse yeniden üretilen videolar da güncel sesle seslendirilir.
  const plan: StoryScript = { ...stored, voice: { ...stored.voice, voice_id: VOICE_ID } };
  if (attempts >= MAX_ATTEMPTS) {
    await db.from('videos').update({ status: 'render_failed', error: 'Deneme hakkı doldu.' }).eq('id', id);
    return true;
  }
  if (!process.env.ELEVENLABS_API_KEY) {
    await db.from('videos').update({ status: 'render_failed', error: 'ELEVENLABS_API_KEY tanımlı değil (GitHub Secrets).' }).eq('id', id);
    await log.error(`Video ${id}: seslendirme anahtarı yok; GitHub Secrets'a ELEVENLABS_API_KEY ekleyin.`, { notify: true });
    return true;
  }
  await db.from('videos').update({ status: 'rendering', render_attempts: attempts + 1 }).eq('id', id);
  let r;
  try {
    r = await produceStory(plan, join(tmpdir(), 'cm-render'), id);
  } catch (e) {
    await db.from('videos').update({ status: attempts + 1 >= MAX_ATTEMPTS ? 'render_failed' : 'planned', error: (e as Error).message }).eq('id', id);
    await log.error(`Video ${id} seslendirilemedi: ${(e as Error).message}`, { notify: attempts + 1 >= MAX_ATTEMPTS });
    return true;
  }
  if (!r.ok || !r.output || !r.script) {
    await db.from('videos').update({ status: 'render_failed', error: r.errors.join('\n'), qc: r.output?.qc ?? null }).eq('id', id);
    await log.error(`Video ${id} üretilemedi; yayınlanmayacak.`, { errors: r.errors, notify: true });
    return true;
  }
  const path = `${slug}/${id}.mp4`;
  const up = await db.storage.from(BUCKET).upload(path, readFileSync(r.output.file), { contentType: 'video/mp4', upsert: true });
  if (up.error) {
    await db.from('videos').update({ status: 'render_failed', error: `Yükleme hatası: ${up.error.message}` }).eq('id', id);
    await log.error(`Video ${id} yüklenemedi.`, { error: up.error.message, notify: true });
    return true;
  }
  await db.storage.from(BUCKET).upload(`${slug}/${id}.srt`, storySrt(r.script), { contentType: 'text/plain', upsert: true });
  // Kapak: üretilemezse video yine hazır olur; Instagram ilk kareyi kapak yapar.
  if (r.script.cover) {
    try {
      const file = join(tmpdir(), 'cm-render', `${id}-kapak.jpg`);
      const c = await renderCover(r.script.cover, r.script.channel, r.script.case_no, file);
      if (!c.ok) throw new Error(c.problems.join('; '));
      const coverPath = `${slug}/${id}-kapak.jpg`;
      const cu = await db.storage.from(BUCKET).upload(coverPath, readFileSync(file), { contentType: 'image/jpeg', upsert: true });
      if (cu.error) throw new Error(cu.error.message);
      r.script.cover_path = coverPath;
    } catch (e) {
      await log.warn(`Video ${id}: kapak üretilemedi (${(e as Error).message}); ilk kare kullanılacak.`);
    }
  }
  // Zamanlanmış senaryo ve gerçek süre kaydedilir (ses verisi kaydedilmez).
  await db.from('videos').update({
    status: 'ready', storage_path: path, file_size_bytes: r.output.qc.probe.bytes, script: r.script, duration_sec: r.script.duration_sec,
    qc: { ...r.output.qc, render_ms: r.output.ms, attempts: r.attempts }, licenses: STORY_LICENSES, error: null,
  }).eq('id', id);
  await log.info(`Video ${id} hazır (hikâye, ${r.script.duration_sec} sn, ${(r.output.ms / 1000).toFixed(0)} sn render).`);
  await sendForApproval(id);
  return false;
}

/** Hazır videoyu Telegram'a önizleme + imzalı Onayla/Reddet düğmeleriyle gönderir (Telegram tanımlı değilse atlar). */
async function sendForApproval(videoId: string) {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat, TOKEN_ENCRYPTION_KEY: secret } = process.env;
  if (!token || !chat || !secret) return;
  const { data: v } = await db.from('videos')
    .select('id, caption, hashtags, publish_at, publish_at_reason, plan_reason, duration_sec, content_hash, storage_path, script').eq('id', videoId).single();
  const { data: s } = await db.from('app_settings').select('mode').single();
  if (!v) return;
  const tg = new TelegramApi(token);
  const text = readyMessage({ ...v, review_notes: (v.script as Script).review_notes ?? [] });
  if (s?.mode === 'auto') {
    await tg.sendMessage(chat, `🤖 Otomatik mod: bu video onaysız yayınlanacak.\n\n${text}`).catch(() => undefined);
    return;
  }
  const buttons = buildButtons(callbackKey(secret), v.id, v.content_hash);
  try {
    const { data: signed } = await db.storage.from(BUCKET).createSignedUrl(v.storage_path, PREVIEW_URL_SECONDS);
    if (signed) await tg.sendVideo(chat, signed.signedUrl, 'Önizleme', undefined);
    await tg.sendMessage(chat, text, buttons);
  } catch (e) {
    await log.warn(`Onay mesajı Telegram'a gönderilemedi: ${(e as Error).message}. Panelden onaylayabilirsiniz.`);
  }
}
