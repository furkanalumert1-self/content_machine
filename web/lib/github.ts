import 'server-only';
import { redact } from '@content-machine/engine/lib/redact.ts';
import { optional } from './env';

// Panel butonları: GitHub Actions workflow_dispatch. Token yalnızca content_machine reposunda Actions yazma yetkilidir.
export type Workflow = 'daily.yml' | 'ideas.yml';

export async function dispatch(workflow: Workflow, inputs: Record<string, string> = {}): Promise<{ ok: boolean; message: string }> {
  const token = optional('GH_DISPATCH_TOKEN');
  const repo = optional('GH_AUTOMATION_REPO');
  if (!token || !repo) return { ok: false, message: 'GitHub tetikleme yapılandırılmamış (GH_DISPATCH_TOKEN, GH_AUTOMATION_REPO). İş bir sonraki zamanlanmış çalışmada yapılacak.' };
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'content-machine-panel' };
  try {
    const info = await fetch(`https://api.github.com/repos/${repo}`, { headers, cache: 'no-store' });
    if (!info.ok) return { ok: false, message: `GitHub reposu okunamadı (HTTP ${info.status}). Token yetkisini kontrol edin.` };
    const { default_branch } = (await info.json()) as { default_branch: string };
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
      method: 'POST', headers, body: JSON.stringify({ ref: default_branch, inputs }), cache: 'no-store',
    });
    if (res.status === 204) return { ok: true, message: 'GitHub Actions işi başlatıldı (birkaç dakika sürebilir).' };
    return { ok: false, message: `GitHub işi başlatılamadı (HTTP ${res.status}). AUTOMATION_ENABLED ve token yetkisini kontrol edin.` };
  } catch (e) {
    return { ok: false, message: `GitHub'a ulaşılamadı: ${redact((e as Error).message)}` };
  }
}
