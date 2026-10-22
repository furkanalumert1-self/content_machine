'use server';
import { revalidatePath } from 'next/cache';
import { hashBody, parseBrief, BriefError } from '@content-machine/engine/brief/brief.ts';
import { refreshSources, skeletonBrief } from '@content-machine/engine/brief/draft.ts';
import { checkClaims } from '@content-machine/engine/content/claims.ts';
import { inspectRepo, LeakSuspectedError } from '@content-machine/engine/sync/github.ts';
import { inspectSite } from '@content-machine/engine/sync/site.ts';
import { requireAdmin } from '@/lib/dal';
import { optional } from '@/lib/env';
import { vercelInfo } from '@/lib/vercel';
import { fail, text, uuid, type ActionResult } from '@/lib/validate';

async function insertDraft(db: Awaited<ReturnType<typeof requireAdmin>>['db'], productId: string, md: string, sources: unknown) {
  const hash = hashBody(md.replace(/^---\n[\s\S]*?\n---\n?/, ''));
  const { data: same } = await db.from('product_briefs').select('id, version, status').eq('product_id', productId).eq('content_hash', hash).maybeSingle();
  if (same) return { created: false, version: same.version as number };
  const { data: last } = await db.from('product_briefs').select('version').eq('product_id', productId).order('version', { ascending: false }).limit(1).maybeSingle();
  const version = (last?.version ?? 0) + 1;
  const { error } = await db.from('product_briefs').insert({ product_id: productId, version, content_md: md, content_hash: hash, status: 'draft', sources });
  if (error) throw new Error(error.message);
  return { created: true, version };
}

/** Senkronize et: repo (salt okunur) + canlı site (robots.txt'e uyarak) + Vercel (salt okunur) → brief taslağı. */
export async function syncProduct(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const id = uuid(form);
    const { db } = await requireAdmin();
    const { data: p } = await db.from('products').select('id, slug, name, site_url, github_repo, vercel_project, last_synced_at').eq('id', id).single();
    if (!p) return { ok: false, message: 'Ürün bulunamadı.' };

    const warnings: string[] = [];
    let repo = null;
    if (p.github_repo) {
      try { repo = await inspectRepo(p.github_repo, optional('GH_PRODUCT_READ_TOKEN')); } catch (e) {
        if (e instanceof LeakSuspectedError) return { ok: false, message: `DURDURULDU: ${e.message} Repoyu kontrol edin; hiçbir şey kaydedilmedi.` };
        warnings.push(`Repo okunamadı: ${(e as Error).message}`);
      }
    }
    const site = p.site_url ? await inspectSite(p.site_url).catch((e) => { warnings.push(`Site okunamadı: ${(e as Error).message}`); return null; }) : null;
    const vercel = await vercelInfo(p.vercel_project);
    if (vercel && 'error' in vercel) warnings.push(`Vercel okunamadı: ${vercel.error}`);
    const input = {
      slug: p.slug, name: p.name, repo, pages: site?.pages ?? [], skipped: site?.skipped ?? [], since: p.last_synced_at, now: new Date(),
      deployments: vercel && !('error' in vercel) ? vercel.deployments : null,
    };

    // Taban: onaylı sürüm; yoksa en son sürüm.
    const { data: approvedRow } = await db.from('product_briefs').select('content_md').eq('product_id', id).eq('status', 'approved').maybeSingle();
    const { data: latestRow } = approvedRow ? { data: null } : await db.from('product_briefs').select('content_md').eq('product_id', id)
      .order('version', { ascending: false }).limit(1).maybeSingle();
    const base = approvedRow ?? latestRow;
    const md = base ? refreshSources(base.content_md, input) : skeletonBrief(input);
    const sources = { repo: repo ? { repo: repo.repo, head: repo.head_sha, routes: repo.routes } : null, site: site?.pages.map((x) => x.url) ?? [], vercel: input.deployments?.[0] ?? null };
    const r = await insertDraft(db, id, md, sources);
    await db.from('products').update({ last_synced_at: new Date().toISOString() }).eq('id', id);
    revalidatePath('/urunler');
    revalidatePath(`/urunler/${p.slug}`);
    const head = r.created ? `Brief taslağı v${r.version} oluşturuldu. İnceleyip onaylayın; onaylanmadan içerikte kullanılmaz.` : 'Değişiklik yok; mevcut brief güncel.';
    return { ok: true, message: [head, ...warnings].join('\n') };
  } catch (e) { return fail(e); }
}

export async function saveBrief(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const id = uuid(form, 'product_id');
    const body = text(form, 'content_md', { required: true, max: 30000 });
    const { db } = await requireAdmin();
    const { data: p } = await db.from('products').select('slug').eq('id', id).single();
    if (!p) return { ok: false, message: 'Ürün bulunamadı.' };
    const md = `---\nproduct: ${p.slug}\n---\n${body.replace(/^---\n[\s\S]*?\n---\n?/, '')}`;
    const r = await insertDraft(db, id, md, [{ editor: 'panel' }]);
    revalidatePath(`/urunler/${p.slug}`);
    return { ok: true, message: r.created ? `Taslak v${r.version} kaydedildi. Onaylamadan kullanılmaz.` : 'Aynı metin zaten kayıtlı.' };
  } catch (e) { return fail(e); }
}

export async function approveBrief(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const briefId = uuid(form);
    const { db, user } = await requireAdmin();
    const { data: b } = await db.from('product_briefs').select('id, product_id, content_md, status, products(slug, status)').eq('id', briefId).single();
    if (!b) return { ok: false, message: 'Brief bulunamadı.' };
    if (b.status === 'approved') return { ok: true, message: 'Bu sürüm zaten onaylı.' };
    const problems: string[] = [];
    try {
      const parsed = parseBrief(b.content_md);
      if (b.content_md.includes('BİLGİ YOK')) problems.push('"BİLGİ YOK" ile işaretli alanları doldurun.');
      for (const s of ['Acı noktaları', 'Doğrulanmış özellikler', 'Mitler', 'Ek ipuçları', 'Ton'])
        for (const i of checkClaims(parsed.sections[s] ?? '')) problems.push(`${s}: ${i.rule} ("${i.match}")`);
    } catch (e) {
      if (e instanceof BriefError) problems.push(...e.problems); else throw e;
    }
    if (problems.length) return { ok: false, message: `Onaylanamadı:\n• ${problems.join('\n• ')}` };

    const { error } = await db.from('product_briefs').update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }).eq('id', briefId);
    if (error) throw new Error(error.message);
    const product = (Array.isArray(b.products) ? b.products[0] : b.products) as { slug: string; status: string };
    revalidatePath(`/urunler/${product.slug}`);
    revalidatePath('/urunler');
    return { ok: true, message: 'Brief onaylandı. Bundan sonraki videolar bu sürümle üretilir.' };
  } catch (e) { return fail(e); }
}

export async function setProductStatus(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const id = uuid(form);
    const status = String(form.get('status'));
    if (!['active', 'paused'].includes(status)) throw new Error('Geçersiz durum.');
    const { db } = await requireAdmin();
    const { error } = await db.from('products').update({ status }).eq('id', id);
    if (error) {
      // Veritabanı kuralları: onaylı brief şart; MVP'de tek aktif ürün.
      return { ok: false, message: error.message.replace(/^.*?:\s*/, '') };
    }
    revalidatePath('/urunler');
    return { ok: true, message: status === 'active' ? 'Ürün aktif.' : 'Ürün duraklatıldı; yeni video planlanmaz.' };
  } catch (e) { return fail(e); }
}

export async function addProduct(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const slug = text(form, 'slug', { required: true, max: 40 }).toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Kısa ad yalnızca küçük harf, rakam ve tire içerebilir.');
    const name = text(form, 'name', { required: true, max: 80 });
    const site = text(form, 'site_url', { max: 200 });
    const repo = text(form, 'github_repo', { max: 120 });
    const vercel = text(form, 'vercel_project', { max: 100 });
    if (site && !/^https:\/\/[^\s]+$/.test(site)) throw new Error('Site adresi https:// ile başlamalı.');
    if (repo && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('Repo "sahip/repo" biçiminde olmalı.');
    const { db } = await requireAdmin();
    const { error } = await db.from('products').insert({ slug, name, site_url: site || null, github_repo: repo || null, vercel_project: vercel || null, status: 'draft' });
    if (error) throw new Error(error.code === '23505' ? 'Bu kısa adla ürün zaten var.' : error.message);
    revalidatePath('/urunler');
    return { ok: true, message: 'Ürün taslak olarak eklendi. "Senkronize et" ile brief taslağı çıkarın; onaylamadan içerik üretilmez. MVP süresince yalnızca bir ürün aktif olabilir.' };
  } catch (e) { return fail(e); }
}

export async function updateProduct(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const id = uuid(form);
    const site = text(form, 'site_url', { max: 200 });
    const repo = text(form, 'github_repo', { max: 120 });
    const vercel = text(form, 'vercel_project', { max: 100 });
    const colors = text(form, 'brand_colors', { max: 400 });
    const logo = text(form, 'logo_url', { max: 300 });
    if (site && !/^https:\/\/[^\s]+$/.test(site)) throw new Error('Site adresi https:// ile başlamalı.');
    if (repo && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('Repo "sahip/repo" biçiminde olmalı.');
    let brand: Record<string, string> = {};
    if (colors) {
      for (const pair of colors.split(',')) {
        const [k, v] = pair.split('=').map((x) => x.trim());
        if (!k || !/^#[0-9a-f]{6}$/i.test(v ?? '')) throw new Error('Renkler "ad=#RRGGBB, ad=#RRGGBB" biçiminde olmalı.');
        brand[k] = v;
      }
    }
    const { db } = await requireAdmin();
    const { error } = await db.from('products').update({ site_url: site || null, github_repo: repo || null, vercel_project: vercel || null, brand_colors: brand, logo_url: logo || null }).eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/urunler');
    return { ok: true, message: 'Kaydedildi.' };
  } catch (e) { return fail(e); }
}
