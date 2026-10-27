// Kilitlenmiş (publishing) bir videoyu Instagram'a Reels olarak yayınlar.
// Mükerrer yayın koruması:
//  1) Container kimliği oluşturulur oluşturulmaz kaydedilir; yeniden denemeler aynı container'ı kullanır.
//  2) media_publish'ten hemen önce publish_requested_at yazılır.
//  3) Bir container için yayın durumu bilinmiyorsa (çökme, ağ hatası) asla körlemesine tekrar yayınlanmaz:
//     önce container durumu sorulur; PUBLISHED ise yayınlanmış sayılır ve medya kimliği bulunur.
//  4) PAUSED ve onay geçerliliği media_publish'ten hemen önce yeniden okunur.
import { IgError, type InstagramClient } from './client.ts';

export const MAX_PUBLISH_TRIES = 3;
export const SIGNED_URL_SECONDS = 6 * 3600; // Meta işleme süresini rahatça karşılar
export const POLL_INTERVAL_MS = 60_000;     // Meta önerisi: dakikada bir
export const POLL_MAX = 5;                   // en fazla 5 dakika; bitmezse sonraki çalışmada devam

export interface ClaimedVideo {
  id: string;
  caption: string;
  hashtags: string[];
  storage_path: string;
  /** Kapak (JPEG) depolama yolu; yoksa Instagram ilk kareyi kullanır. */
  cover_path?: string | null;
  ig_container_id: string | null;
  publish_requested_at: string | null;
  publish_tries: number;
  approved: boolean; // claim anında approved_hash = content_hash mıydı (auto modda false olabilir)
}

export interface PublishDeps {
  ig: Pick<InstagramClient, 'createReelContainer' | 'containerStatus' | 'publish' | 'publishingLimit' | 'recentMedia' | 'permalink'>;
  igUserId: string;
  /** Yayından hemen önce: PAUSED açık mı, video hâlâ yayınlanabilir mi? */
  recheck(videoId: string): Promise<{ paused: boolean; stillPublishable: boolean }>;
  signedUrl(path: string, seconds: number): Promise<string>;
  save(videoId: string, patch: Record<string, unknown>): Promise<void>;
  attempt(videoId: string, outcome: 'published' | 'failed' | 'skipped_paused' | 'retry' | 'postponed' | 'recovered', code?: string, message?: string): Promise<void>;
  sleep(ms: number): Promise<void>;
}

export type Outcome =
  | { result: 'published'; mediaId: string }
  | { result: 'recovered'; mediaId: string }
  | { result: 'released'; reason: string }   // kuyruğa geri döndü, sonraki çalışmada devam
  | { result: 'failed'; reason: string; auth?: boolean };

export const fullCaption = (v: Pick<ClaimedVideo, 'caption' | 'hashtags'>) => `${v.caption}\n\n${v.hashtags.join(' ')}`;

export async function publishClaimed(v: ClaimedVideo, d: PublishDeps): Promise<Outcome> {
  const back = v.approved ? 'approved' : 'ready';
  const release = async (reason: string, outcome: 'retry' | 'postponed' | 'skipped_paused', patch: Record<string, unknown> = {}, code?: string): Promise<Outcome> => {
    await d.save(v.id, { status: back, error: reason, ...patch });
    await d.attempt(v.id, outcome, code, reason);
    return { result: 'released', reason };
  };
  const fail = async (reason: string, code?: string, auth = false): Promise<Outcome> => {
    await d.save(v.id, { status: 'publish_failed', error: reason });
    await d.attempt(v.id, 'failed', code, reason);
    return { result: 'failed', reason, auth };
  };
  const tries = v.publish_tries + 1;
  const retryOrFail = (reason: string, code?: string, patch: Record<string, unknown> = {}) =>
    tries >= MAX_PUBLISH_TRIES ? fail(`${reason} (${tries}. deneme, vazgeçildi)`, code) : release(reason, 'retry', { publish_tries: tries, ...patch }, code);

  try {
    let containerId = v.ig_container_id;

    // ---- 1) Var olan container: önce durumunu sor (mükerrer yayın koruması)
    if (containerId) {
      const { status_code } = await d.ig.containerStatus(containerId);
      if (status_code === 'PUBLISHED') return await recover(v, containerId, d);
      if (status_code === 'EXPIRED' || status_code === 'ERROR') {
        if (status_code === 'ERROR') return await retryOrFail('Instagram videoyu işleyemedi (container ERROR).', 'container_error', { ig_container_id: null, publish_requested_at: null });
        containerId = null;
        await d.save(v.id, { ig_container_id: null, publish_requested_at: null });
      }
    }

    // ---- 2) Günlük limit
    const limit = await d.ig.publishingLimit(d.igUserId).catch(() => null);
    if (limit && limit.used >= limit.total) return await release(`Günlük yayın limiti dolu (${limit.used}/${limit.total}).`, 'postponed');

    // ---- 3) Container oluştur ve hemen kaydet
    if (!containerId) {
      const url = await d.signedUrl(v.storage_path, SIGNED_URL_SECONDS);
      const cover = v.cover_path ? await d.signedUrl(v.cover_path, SIGNED_URL_SECONDS).catch(() => undefined) : undefined;
      try {
        containerId = (await d.ig.createReelContainer(d.igUserId, url, fullCaption(v), cover)).id;
      } catch (e) {
        // Kapak reddedilirse yayın kapaksız denenir (Instagram ilk kareyi kapak yapar); yetki/limit hataları aynen yükselir.
        if (!cover || !(e instanceof IgError) || ['auth', 'limit'].includes(e.kind)) throw e;
        await d.attempt(v.id, 'retry', `${e.code ?? ''}/${e.subcode ?? ''}`, `Kapak kabul edilmedi, kapaksız deneniyor: ${e.message}`);
        containerId = (await d.ig.createReelContainer(d.igUserId, url, fullCaption(v))).id;
      }
      await d.save(v.id, { ig_container_id: containerId });
    }

    // ---- 4) İşlenmesini bekle (en fazla ~5 dk)
    let status = (await d.ig.containerStatus(containerId)).status_code;
    for (let i = 0; status === 'IN_PROGRESS' && i < POLL_MAX; i++) {
      await d.sleep(POLL_INTERVAL_MS);
      status = (await d.ig.containerStatus(containerId)).status_code;
    }
    if (status === 'PUBLISHED') return await recover(v, containerId, d);
    if (status === 'IN_PROGRESS') return await release('Instagram videoyu hâlâ işliyor; sonraki kontrolde devam edilecek.', 'retry');
    if (status === 'ERROR') return await retryOrFail('Instagram videoyu işleyemedi (container ERROR).', 'container_error', { ig_container_id: null });
    if (status === 'EXPIRED') return await retryOrFail('Container süresi doldu.', 'container_expired', { ig_container_id: null });

    // ---- 5) Son kontrol: PAUSED ve onay
    const now = await d.recheck(v.id);
    if (now.paused) return await release('PAUSED açık; yayın durduruldu.', 'skipped_paused');
    if (!now.stillPublishable) return await fail('Video artık yayınlanabilir durumda değil (onay/durum değişti).', 'not_publishable');

    // ---- 6) Yayınla
    await d.save(v.id, { publish_requested_at: new Date().toISOString() });
    const { id: mediaId } = await d.ig.publish(d.igUserId, containerId);
    const permalink = await d.ig.permalink(mediaId).then((p) => p.permalink ?? null).catch(() => null);
    await d.save(v.id, { status: 'published', ig_media_id: mediaId, ig_permalink: permalink, published_at: new Date().toISOString(), error: null });
    await d.attempt(v.id, 'published');
    return { result: 'published', mediaId };
  } catch (e) {
    if (!(e instanceof IgError)) throw e;
    const code = `${e.code ?? ''}/${e.subcode ?? ''}`;
    switch (e.kind) {
      case 'limit': return await release(`Günlük yayın limiti: ${e.message}`, 'postponed', {}, code);
      case 'not_ready': return await release(`Video henüz hazır değil: ${e.message}`, 'retry', {}, code);
      case 'new_container': return await retryOrFail(`Container geçersiz: ${e.message}`, code, { ig_container_id: null, publish_requested_at: null });
      case 'retry': return await retryOrFail(`Geçici hata: ${e.message}`, code);
      case 'auth': return await fail(`Instagram bağlantısı geçersiz, panelden yeniden bağlayın: ${e.message}`, code, true);
      default: return await fail(`Instagram hatası: ${e.message}`, code);
    }
  }
}

/** Container zaten yayınlanmış: tekrar yayınlama, son gönderiler arasından medya kimliğini bul. */
async function recover(v: ClaimedVideo, containerId: string, d: PublishDeps): Promise<Outcome> {
  const caption = fullCaption(v).trim();
  const match = (await d.ig.recentMedia(d.igUserId, 25)).find((m) => (m.caption ?? '').trim() === caption);
  const mediaId = match?.id ?? `container:${containerId}`;
  await d.save(v.id, { status: 'published', ig_media_id: mediaId, ig_permalink: match?.permalink ?? null, published_at: match?.timestamp ?? new Date().toISOString(), error: match ? null : 'Yayınlandı ama medya kimliği bulunamadı (container kimliği kaydedildi).' });
  await d.attempt(v.id, 'recovered', undefined, 'Önceki çalışmada yayınlanmış; tekrar paylaşılmadı.');
  return { result: 'recovered', mediaId };
}
