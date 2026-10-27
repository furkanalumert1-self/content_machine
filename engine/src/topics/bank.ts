// Konu bankası: config/topics/*.json → doğrulama → fikir kaydı. Kaynaksız rakam senaryoya giremez.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { IdeaDraft } from '../ideas/types.ts';
import { MAX_HOOK_WORDS } from './channel.ts';
import { PILLAR_FUNNEL, PILLAR_TYPE, type Topic, type TopicBank } from './types.ts';

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function loadBank(file = join(import.meta.dirname, '../../../config/topics/sepet-rontgeni.json')): TopicBank {
  return JSON.parse(readFileSync(file, 'utf8')) as TopicBank;
}

/** Metindeki rakamlar ("%34", "2,5 kat", "1.400") → karşılaştırılabilir biçim. */
export function numbersIn(text: string): string[] {
  return [...text.matchAll(/\d+(?:[.,]\d+)*/g)].map((m) => m[0].replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.'));
}

/** Kanca puanı: merak boşluğu + somutluk + kısalık (en yüksek olan seçilir). */
export function hookScore(hook: string, brand = ''): number {
  const w = words(hook);
  const curiosity = /\b(değil|aslında|ama|neden|sanma|gizli|yok|kimse|bilmeden|sessizce)\b|\?/i.test(hook) ? 3 : 0;
  const concrete = (/\d/.test(hook) ? 2 : 0) + (brand && hook.toLocaleLowerCase('tr').includes(brand.toLocaleLowerCase('tr').split(/[\s/]+/)[0]) ? 1 : 0);
  const brevity = Math.max(0, MAX_HOOK_WORDS + 1 - w) / 2;
  return curiosity + concrete + brevity;
}

export function pickHook(topic: Pick<Topic, 'hooks' | 'brand'>): { hook: string; scores: { hook: string; score: number }[] } {
  const scores = topic.hooks.map((hook) => ({ hook, score: Math.round(hookScore(hook, topic.brand) * 10) / 10 }));
  const best = [...scores].filter((s) => words(s.hook) <= MAX_HOOK_WORDS).sort((a, b) => b.score - a.score)[0];
  return { hook: (best ?? scores[0]).hook, scores };
}

/** Konu kuralları: kaynak kapısı, kanca uzunluğu, sütun/huni tutarlılığı. Sorun listesi boşsa konu kullanılabilir. */
export function validateTopic(t: Topic): string[] {
  const p: string[] = [];
  if (!/^[a-z0-9-]+$/.test(t.key)) p.push('Geçersiz anahtar.');
  if (PILLAR_FUNNEL[t.pillar] !== t.funnel) p.push(`Sütun ${t.pillar} için huni ${PILLAR_FUNNEL[t.pillar]} olmalı.`);
  if (t.hooks.length !== 3) p.push('3 kanca adayı olmalı.');
  for (const h of t.hooks) if (words(h) > MAX_HOOK_WORDS) p.push(`Kanca ${MAX_HOOK_WORDS} kelimeyi aşıyor: "${h}"`);
  if (words(`${t.cover.line1} ${t.cover.line2}`) > 8) p.push('Kapak metni 8 kelimeyi aşıyor.');
  if (!t.facts.length) p.push('Kaynaklı olgu yok.');
  for (const f of t.facts) {
    if (!/^https:\/\/\S+$/.test(f.source_url)) p.push(`Kaynak adresi geçersiz: ${f.source_label}`);
    if (!f.source_label.trim()) p.push('Kaynak etiketi boş.');
  }
  // Kaynak kapısı: olgu/mekanizma/içgörü/kanca/kapak metnindeki her rakam bir kaynaklı olguda geçmeli.
  // "Senin mağazan için" önerileri (ör. "45 gün") iddia değil tavsiyedir; onlar yüzde/kat vaadi denetiminden geçer.
  const sourced = new Set(t.facts.flatMap((f) => numbersIn(f.text)));
  const claimed = [t.fact, ...t.mechanism_lines, t.insight, ...t.hooks, t.cover.line1, t.cover.line2, t.cover.number ?? '', t.big_number ?? ''];
  for (const n of new Set(claimed.flatMap(numbersIn))) if (!sourced.has(n)) p.push(`Kaynaksız rakam: ${n}`);
  const { callypso_feature: _, ...content } = t;
  if (/callypso/i.test(JSON.stringify(content))) p.push('Konu metninde ürün adı geçiyor.');
  if (t.tags.length !== 2 || t.tags.some((h) => !/^#[\p{L}\p{N}_]+$/u.test(h))) p.push('2 geçerli konu hashtag\'i olmalı.');
  return p;
}

export function topicToIdea(t: Topic): IdeaDraft & { topic: Topic } {
  return {
    idea: `[${t.key}] ${t.brand}: ${t.mechanism}`,
    hook: pickHook(t).hook,
    content_type: PILLAR_TYPE[t.pillar],
    source: 'topic_bank',
    source_ref: t.key,
    score: t.score,
    is_exploration: false,
    why: `Sütun ${t.pillar} (${t.funnel}) · ${t.mechanism} · kaynak: ${[...new Set(t.facts.map((f) => f.source_label))].join(', ')}`,
    funnel: t.funnel,
    topic: t,
  };
}
