// Sepet Röntgeni senaryosu: KANCA → OLGU → MEKANİZMA → SENİN MAĞAZAN İÇİN → CTA (45–58 sn).
// Metinler yalnızca konu bankasındaki doğrulanmış cümlelerden kurulur; yeni iddia eklenmez.
import { checkClaims } from '../content/claims.ts';
import type { Idea } from '../ideas/types.ts';
import { lineify, MAX_LINE_CHARS, timeline, type Draft, type Script } from '../plan/script.ts';
import { numbersIn, pickHook } from './bank.ts';
import {
  BASE_TAGS, CAPTION_CTA, CHANNEL_NAME, CTA_KEYWORD, CTA_LINES, MAX_HOOK_WORDS, MAX_SEC, MAX_TAGS, MIN_SEC, MIN_TAGS,
  productNameAllowed, TARGET_SEC, type Phase,
} from './channel.ts';
import type { Pillar, Topic } from './types.ts';

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const end = (s: string) => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
const EMOJI: Record<Pillar, string> = { A: '🔍', B: '🏷️', C: '🛠️', D: '⚖️' };

const st = (lines: string[], visual: Draft['visual'] = { type: 'statement' }): Draft =>
  ({ kind: 'body', lines: lines.flatMap(lineify), visual, sample_data: false });

export function buildTopicScript(idea: Idea, topic: Topic, opts: { targetSec?: number } = {}): Script {
  const { hook, scores } = pickHook(topic);
  const drafts: Draft[] = [
    { kind: 'hook', lines: [hook], visual: { type: 'hook' }, sample_data: false },
    st([end(topic.fact)], { type: 'fact', number: topic.big_number }),
    st([`${topic.mechanism}:`, end(topic.mechanism_lines[0])]),
    ...topic.mechanism_lines.slice(1).map((l) => st([end(l)])),
    st(['Senin mağazan için:', end(topic.action[0])]),
    ...topic.action.slice(1).map((l) => st([end(l)])),
    { kind: 'cta', lines: CTA_LINES, visual: { type: 'cta' }, sample_data: false },
  ];
  const scenes = timeline(drafts, opts.targetSec ?? TARGET_SEC, { min: MIN_SEC, max: MAX_SEC });
  const last = scenes[scenes.length - 1];
  return {
    version: 1,
    product: CHANNEL_NAME,
    content_type: idea.content_type,
    hook,
    scenes,
    duration_sec: Math.round((last.start + last.duration) * 100) / 100,
    cta: CTA_LINES.join(' '),
    cta_url: '',
    sample_data: false,
    review_notes: [],
    channel: CHANNEL_NAME,
    funnel: topic.funnel,
    hook_candidates: scores,
    sources: uniqueSources(topic),
  };
}

const uniqueSources = (t: Topic) =>
  [...new Map(t.facts.map((f) => [f.source_url, { label: f.source_label, url: f.source_url }])).values()];

/** Elle verilen talimat/fikir (kaynaksız): kanal formatında, rakam içeremez. */
export function buildManualChannelScript(idea: Idea, opts: { targetSec?: number } = {}): Script {
  const sentences = idea.idea.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean)
    .filter((x) => x.replace(/[.!?…]$/, '') !== idea.hook.replace(/[.!?…]$/, ''));
  const drafts: Draft[] = [
    { kind: 'hook', lines: [idea.hook], visual: { type: 'hook' }, sample_data: false },
    ...(sentences.length ? sentences.slice(0, 6) : [idea.idea]).map((x) => st([end(x)])),
    { kind: 'cta', lines: CTA_LINES, visual: { type: 'cta' }, sample_data: false },
  ];
  const scenes = timeline(drafts, opts.targetSec ?? TARGET_SEC, { min: MIN_SEC, max: MAX_SEC });
  const last = scenes[scenes.length - 1];
  return {
    version: 1, product: CHANNEL_NAME, content_type: idea.content_type, hook: idea.hook, scenes,
    duration_sec: Math.round((last.start + last.duration) * 100) / 100, cta: CTA_LINES.join(' '), cta_url: '',
    sample_data: false, review_notes: ['Elle verilen fikirden üretildi: kaynak gerektiren rakam içeremez; metni yayından önce gözden geçirin.'],
    channel: CHANNEL_NAME, funnel: idea.funnel, sources: [],
  };
}

export function buildTopicCaption(script: Script, topic: Topic | null): string {
  const emoji = topic ? EMOJI[topic.pillar] : '🔍';
  const lines = [`${end(script.hook)} ${emoji}`];
  if (topic) lines.push(end(topic.insight), end(topic.action[0]));
  lines.push('', CAPTION_CTA);
  if (topic) lines.push(topic.question);
  if (script.sources?.length) lines.push('', `Kaynak: ${[...new Set(script.sources.map((s) => s.label))].join(' · ')}`);
  return lines.join('\n');
}

/** Konu etiketi yoksa (elle fikir) genel iki etiket eklenir. */
const GENERIC_TAGS = ['#tüketicipsikolojisi', '#eticaretipuçları'];

export function buildTopicHashtags(topic: Topic | null): string[] {
  return [...new Set([...BASE_TAGS, ...(topic?.tags ?? GENERIC_TAGS)])].slice(0, MAX_TAGS);
}

/** Yayın öncesi QA (docs/icerik-plani.md › QA listesi). Boş liste = geçti. */
export function validateTopicPlan(script: Script, caption: string, hashtags: string[], topic: Topic | null, phase: Phase): string[] {
  const p: string[] = [];
  const first = script.scenes[0];
  if (first.kind !== 'hook' || first.start !== 0) p.push('İlk sahne kanca olmalı ve 0. saniyede başlamalı.');
  if (first.duration > 3) p.push('Kanca sahnesi 3 saniyeden uzun.');
  if (words(script.hook) > MAX_HOOK_WORDS) p.push(`Kanca ${MAX_HOOK_WORDS} kelimeyi aşıyor (${words(script.hook)}).`);
  if (script.duration_sec < MIN_SEC || script.duration_sec > MAX_SEC) p.push(`Süre ${script.duration_sec} sn; ${MIN_SEC}–${MAX_SEC} olmalı.`);
  for (const s of script.scenes) for (const l of s.lines) if (l.length > MAX_LINE_CHARS) p.push(`Satır çok uzun (${l.length} karakter): "${l}"`);

  const text = [...script.scenes.flatMap((s) => s.lines), caption, hashtags.join(' ')].join('\n');
  if (!productNameAllowed(phase) && /callypso/i.test(text)) p.push('Faz 1: ürün adı hiçbir yerde geçmemeli.');
  if (!text.includes(CTA_KEYWORD) || !caption.includes(CTA_KEYWORD)) p.push(`CTA anahtar kelimesi (${CTA_KEYWORD}) senaryoda ve açıklamada olmalı.`);
  if (script.funnel === 'BOF' && phase < 3) p.push('BOF içerik Faz 3\'e kadar feed\'e girmez.');

  // Kaynak kapısı: CTA'daki sabit "25" dışındaki her rakam kaynaklı olgularda geçmeli.
  const sourced = new Set([...(topic?.facts ?? []).flatMap((f) => numbersIn(f.text)), ...numbersIn(CTA_LINES.join(' '))]);
  const advice = new Set((topic?.action ?? []).flatMap(numbersIn));
  const claimed = [...script.scenes.filter((s) => s.kind !== 'cta').flatMap((s) => s.lines), caption.split('\nKaynak:')[0]].join(' ');
  for (const n of new Set(numbersIn(claimed))) if (!sourced.has(n) && !advice.has(n)) p.push(`Kaynaksız rakam: ${n}`);
  if (topic && !/\nKaynak: /.test(caption)) p.push('Açıklamada kaynak satırı yok.');

  for (const i of checkClaims(text, { sourcedNumbers: sourced })) p.push(`Yasaklı ifade (${i.rule}): "${i.match}"`);
  if (hashtags.length < MIN_TAGS || hashtags.length > MAX_TAGS) p.push(`Hashtag sayısı ${hashtags.length}; ${MIN_TAGS}–${MAX_TAGS} olmalı.`);
  for (const h of hashtags) if (!/^#[\p{L}\p{N}_]+$/u.test(h)) p.push(`Geçersiz hashtag: ${h}`);
  if (caption.length + hashtags.join(' ').length + 2 > 2200) p.push('Açıklama + hashtag 2200 karakteri aşıyor.');
  return p;
}


/** Açıklama + hashtag kuralları (hikâye formatında senaryo ayrıca validateStory ile denetlenir). */
export function captionProblems(caption: string, hashtags: string[], topic: Topic, phase: Phase): string[] {
  const p: string[] = [];
  const text = `${caption}\n${hashtags.join(' ')}`;
  if (!productNameAllowed(phase) && /callypso/i.test(text)) p.push('Faz 1: ürün adı açıklamada geçmemeli.');
  if (!caption.includes(CTA_KEYWORD)) p.push(`Açıklamada ${CTA_KEYWORD} olmalı.`);
  if (!/\nKaynak: /.test(caption)) p.push('Açıklamada kaynak satırı yok.');
  const sourced = new Set([...topic.facts.flatMap((f) => numbersIn(f.text)), ...topic.action.flatMap(numbersIn), ...numbersIn(CTA_LINES.join(' '))]);
  for (const n of new Set(numbersIn(caption.split('\nKaynak:')[0]))) if (!sourced.has(n)) p.push(`Açıklamada kaynaksız rakam: ${n}`);
  for (const i of checkClaims(text, { sourcedNumbers: sourced })) p.push(`Yasaklı ifade (${i.rule}): "${i.match}"`);
  if (hashtags.length < MIN_TAGS || hashtags.length > MAX_TAGS) p.push(`Hashtag sayısı ${hashtags.length}; ${MIN_TAGS}–${MAX_TAGS} olmalı.`);
  if (caption.length + hashtags.join(' ').length + 2 > 2200) p.push('Açıklama + hashtag 2200 karakteri aşıyor.');
  return p;
}
