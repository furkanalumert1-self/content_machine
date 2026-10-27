// Instagram API with Instagram Login (graph.instagram.com). Yalnızca resmi uç noktalar.
// Kaynak: developers.facebook.com/docs/instagram-platform (Ekim 2026; örneklerde v26.0).

export const API_VERSION = process.env.IG_API_VERSION || 'v26.0';
export const SCOPES = ['instagram_business_basic', 'instagram_business_content_publish', 'instagram_business_manage_insights'];

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export type ErrorKind =
  | 'retry'          // geçici: aynı container ile sonra tekrar dene
  | 'new_container'  // container süresi doldu/kayboldu: yenisini oluştur
  | 'not_ready'      // container işleniyor
  | 'limit'          // günlük yayın limiti: yarın
  | 'auth'           // token geçersiz / izin yok: kullanıcı yeniden bağlamalı
  | 'fatal';         // içerik/hesap sorunu: yeniden denemek işe yaramaz

export class IgError extends Error {
  constructor(public readonly status: number, public readonly code: number | null, public readonly subcode: number | null, message: string) {
    super(message);
  }
  get kind(): ErrorKind { return classify(this.status, this.code, this.subcode); }
}

/** Meta hata kodu tablosu (error-codes) + genel Graph API kodları. */
export function classify(status: number, code: number | null, subcode: number | null): ErrorKind {
  if (subcode === 2207042 || code === 9) return 'limit';
  if (subcode === 2207020 || subcode === 2207008 || subcode === 2207006 || subcode === 2207053) return 'new_container';
  if (subcode === 2207027 || code === 9007) return 'not_ready';
  if (subcode === 2207001 || subcode === 2207003 || subcode === 2207032 || code === -1 || code === -2) return 'retry';
  if (code === 190 || code === 10 || code === 200 || (code !== null && code >= 200 && code < 300)) return 'auth';
  if (subcode === 2207050 || subcode === 2207051 || subcode === 2207026 || subcode === 2207052 || code === 9004 || code === 352 || code === 25) return 'fatal';
  if (code === 1 || code === 2 || code === 4 || code === 17 || code === 32 || code === 341 || code === 613) return 'retry';
  if (status >= 500 || status === 0) return 'retry';
  return 'fatal';
}

export class InstagramClient {
  constructor(private readonly token: string, private readonly fetcher: Fetcher = fetch) {}

  private async call<T>(method: 'GET' | 'POST', path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`https://graph.instagram.com/${API_VERSION}/${path.replace(/^\//, '')}`);
    const body = new URLSearchParams({ ...params, access_token: this.token });
    let res: Response;
    try {
      res = method === 'GET'
        ? await this.fetcher(`${url}?${body}`, { method })
        : await this.fetcher(String(url), { method, body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    } catch (e) {
      throw new IgError(0, null, null, `Ağ hatası: ${(e as Error).message}`);
    }
    const json = (await res.json().catch(() => ({}))) as { error?: { code?: number; error_subcode?: number; message?: string; error_user_msg?: string } } & T;
    if (!res.ok || json.error) {
      const e = json.error ?? {};
      throw new IgError(res.status, e.code ?? null, e.error_subcode ?? null, e.error_user_msg || e.message || `HTTP ${res.status}`);
    }
    return json;
  }

  me() { return this.call<{ user_id: string; username: string }>('GET', 'me', { fields: 'user_id,username' }); }

  /** coverUrl: Reels kapağı (JPEG, ≤8 MB, 9:16, herkese açık adres; Meta: ig-user/media › cover_url). */
  createReelContainer(igUserId: string, videoUrl: string, caption: string, coverUrl?: string) {
    return this.call<{ id: string }>('POST', `${igUserId}/media`, { media_type: 'REELS', video_url: videoUrl, caption, share_to_feed: 'true', ...(coverUrl ? { cover_url: coverUrl } : {}) });
  }

  containerStatus(containerId: string) {
    return this.call<{ status_code: 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED'; status?: string }>('GET', containerId, { fields: 'status_code,status' });
  }

  publish(igUserId: string, creationId: string) {
    return this.call<{ id: string }>('POST', `${igUserId}/media_publish`, { creation_id: creationId });
  }

  async publishingLimit(igUserId: string): Promise<{ used: number; total: number } | null> {
    const r = await this.call<{ data?: { quota_usage?: number; config?: { quota_total?: number } }[] }>('GET', `${igUserId}/content_publishing_limit`, { fields: 'quota_usage,config' });
    const d = r.data?.[0];
    return d?.quota_usage != null && d.config?.quota_total != null ? { used: d.quota_usage, total: d.config.quota_total } : null;
  }

  async recentMedia(igUserId: string, limit = 10) {
    const r = await this.call<{ data: { id: string; caption?: string; timestamp: string; permalink?: string; media_product_type?: string }[] }>(
      'GET', `${igUserId}/media`, { fields: 'id,caption,timestamp,permalink,media_product_type', limit: String(limit) });
    return r.data;
  }

  mediaInsights(mediaId: string, metrics: readonly string[]) {
    return this.call<{ data?: { name: string; values?: { value: unknown }[]; total_value?: { value: unknown } }[] }>('GET', `${mediaId}/insights`, { metric: metrics.join(',') });
  }

  onlineFollowers(igUserId: string) {
    return this.call<{ data?: { values?: { value?: Record<string, number>; end_time?: string }[] }[] }>('GET', `${igUserId}/insights`, { metric: 'online_followers', period: 'lifetime' });
  }

  permalink(mediaId: string) { return this.call<{ permalink?: string }>('GET', mediaId, { fields: 'permalink' }); }
}

// ---------------------------------------------------------------- OAuth (panel kullanır)
export function authorizeUrl(appId: string, redirectUri: string, state: string): string {
  const q = new URLSearchParams({ client_id: appId, redirect_uri: redirectUri, response_type: 'code', scope: SCOPES.join(','), state });
  return `https://www.instagram.com/oauth/authorize?${q}`;
}

export async function exchangeCode(appId: string, appSecret: string, redirectUri: string, code: string, fetcher: Fetcher = fetch) {
  const body = new URLSearchParams({ client_id: appId, client_secret: appSecret, grant_type: 'authorization_code', redirect_uri: redirectUri, code: code.replace(/#_$/, '') });
  const res = await fetcher('https://api.instagram.com/oauth/access_token', { method: 'POST', body });
  const json = await res.json().catch(() => ({}));
  const d = Array.isArray(json.data) ? json.data[0] : json;
  if (!res.ok || !d?.access_token) throw new IgError(res.status, json.error?.code ?? json.code ?? null, null, json.error_message || json.error?.message || 'Kod değişimi başarısız.');
  return { shortToken: d.access_token as string, userId: String(d.user_id), permissions: String(d.permissions ?? '').split(',').filter(Boolean) };
}

export async function longLivedToken(appSecret: string, shortToken: string, fetcher: Fetcher = fetch) {
  const q = new URLSearchParams({ grant_type: 'ig_exchange_token', client_secret: appSecret, access_token: shortToken });
  const res = await fetcher(`https://graph.instagram.com/access_token?${q}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new IgError(res.status, json.error?.code ?? null, null, json.error?.message || 'Uzun ömürlü token alınamadı.');
  return { token: json.access_token as string, expiresIn: Number(json.expires_in) };
}

export async function refreshToken(token: string, fetcher: Fetcher = fetch) {
  const q = new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: token });
  const res = await fetcher(`https://graph.instagram.com/refresh_access_token?${q}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new IgError(res.status, json.error?.code ?? null, json.error?.error_subcode ?? null, json.error?.message || 'Token yenilenemedi.');
  return { token: json.access_token as string, expiresIn: Number(json.expires_in) };
}
