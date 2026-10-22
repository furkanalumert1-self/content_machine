import 'server-only';
import { optional } from './env';

// Vercel: yalnızca proje alan adları ve son deployment'lar OKUNUR. Hiçbir şey değiştirilmez.
export interface VercelInfo { domains: string[]; deployments: { url: string; created: string; state: string; target: string | null }[] }

export async function vercelInfo(project: string | null): Promise<VercelInfo | { error: string } | null> {
  const token = optional('VERCEL_TOKEN');
  if (!token || !project) return null;
  const team = optional('VERCEL_TEAM_ID');
  const q = (extra: Record<string, string> = {}) => `?${new URLSearchParams({ ...(team ? { teamId: team } : {}), ...extra })}`;
  const get = async <T>(path: string, extra?: Record<string, string>) => {
    const res = await fetch(`https://api.vercel.com${path}${q(extra)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) throw new Error(`Vercel HTTP ${res.status}`);
    return (await res.json()) as T;
  };
  try {
    const p = await get<{ id: string }>(`/v9/projects/${encodeURIComponent(project)}`);
    const [d, deps] = await Promise.all([
      get<{ domains: { name: string }[] }>(`/v9/projects/${p.id}/domains`),
      get<{ deployments: { url: string; created: number; state?: string; readyState?: string; target?: string | null }[] }>('/v6/deployments', { projectId: p.id, limit: '5' }),
    ]);
    return {
      domains: d.domains.map((x) => x.name),
      deployments: deps.deployments.map((x) => ({ url: x.url, created: new Date(x.created).toISOString(), state: x.state ?? x.readyState ?? '?', target: x.target ?? null })),
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
