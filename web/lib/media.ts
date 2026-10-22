import 'server-only';
import { BUCKET } from '@content-machine/engine/lib/storage.ts';
import { adminClient } from './supabase/admin';

/** Panel önizlemesi için 1 saatlik imzalı video bağlantıları (bucket özeldir). Çağıran önce requireAdmin yapmış olmalı. */
export async function previewUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data } = await adminClient().storage.from(BUCKET).createSignedUrls(paths, 3600);
  const out: Record<string, string> = {};
  for (const d of data ?? []) if (d.path && d.signedUrl) out[d.path] = d.signedUrl;
  return out;
}
