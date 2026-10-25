import { describe, expect, it } from 'vitest';
import { checkClaims } from '../src/content/claims.ts';
import type { Idea } from '../src/ideas/types.ts';
import { buildForIdea } from '../src/plan/planner.ts';
import { choosePillar } from '../src/plan/rotation.ts';
import { hookScore, loadBank, numbersIn, pickHook, topicToIdea, validateTopic } from '../src/topics/bank.ts';
import { pillarTargets } from '../src/topics/channel.ts';
import type { Topic } from '../src/topics/types.ts';
import { parseBrief } from '../src/brief/brief.ts';
import { readFileSync } from 'node:fs';

const brief = parseBrief(readFileSync(new URL('../../config/products/callypso-engage.md', import.meta.url), 'utf8'));

const topic = (over: Partial<Topic> = {}): Topic => ({
  key: 'damga-karti', pillar: 'A', funnel: 'TOF', brand: 'Araba yıkama', mechanism: 'Hazır ilerleme etkisi',
  callypso_feature: 'Otomasyon akışları', status: 'dogrulandi',
  hooks: ['İki damga hediye, kart dolmaya başlar', 'Bedava damga değil, geri çağırma', 'Kartı yarısı dolu verince ne olur?'],
  cover: { line1: 'Bedava değil.', line2: 'Geri çağırıyor.', object: 'damga kartı' },
  fact: 'Bir deneyde 2 damgası hazır basılı kartı tamamlayanların oranı %34 oldu.',
  big_number: '%34',
  mechanism_lines: ['Hedefe yakın olduğunu hisseden insan bırakmak istemez.', 'Başlamış bir işi yarım bırakmak kayıp gibi gelir.'],
  action: ['İlk siparişten sonra puanın bir kısmını hediye olarak yükle.', 'Mesajda kalan adımı göster.'],
  insight: 'Hazır ilerleme müşteriyi geri getirir.',
  question: 'Senin sadakat programında müşteri sıfırdan mı başlıyor? 👇',
  tags: ['#sadakatprogramı', '#tüketicipsikolojisi'],
  facts: [{ text: 'Hazır 2 damgalı kartı tamamlama oranı %34, damgasız 8\'lik kartta %19.', source_label: 'Nunes & Drèze (2006)', source_url: 'https://doi.org/10.1086/500480', source_type: 'academic', checked_at: '2026-10-25' }],
  score: 80,
  ...over,
});

const ideaOf = (t: Topic): Idea => ({ ...topicToIdea(t), id: 'i1', product_id: 'p1', used: false, last_used_at: null });

describe('konu bankası', () => {
  it('rakamları karşılaştırılabilir biçime çevirir', () => {
    expect(numbersIn('%34, 1.400 dolar ve 2,5 kat')).toEqual(['34', '1400', '2.5']);
  });

  it('geçerli konu kurallardan geçer', () => {
    expect(validateTopic(topic())).toEqual([]);
  });

  it('kaynaksız rakam, uzun kanca, ürün adı ve yanlış huni reddedilir', () => {
    expect(validateTopic(topic({ fact: 'Kartı tamamlayanlar %50 arttı.' }))).toContain('Kaynaksız rakam: 50');
    expect(validateTopic(topic({ hooks: ['bir iki üç dört beş altı yedi sekiz dokuz', 'a', 'b'] })).join()).toMatch(/8 kelimeyi aşıyor/);
    expect(validateTopic(topic({ insight: 'Callypso bunu yapar.' }))).toContain('Konu metninde ürün adı geçiyor.');
    expect(validateTopic(topic({ funnel: 'MOF' })).join()).toMatch(/huni TOF/);
  });

  it('kanca puanı merak + somutluk + kısalıkla en iyisini seçer', () => {
    expect(hookScore('Bedava değil, geri çağırıyor')).toBeGreaterThan(hookScore('Sadakat kartları hakkında bilmen gerekenler burada'));
    const { hook, scores } = pickHook(topic());
    expect(scores).toHaveLength(3);
    expect(hook).toBe([...scores].sort((a, b) => b.score - a.score)[0].hook);
  });

  it('depodaki konu bankası dosyası okunur ve doğrulanmış konuları kurallardan geçer', () => {
    const bank = loadBank();
    expect(bank.channel).toBe('Sepet Röntgeni');
    for (const t of bank.topics.filter((x) => x.status === 'dogrulandi')) expect([t.key, validateTopic(t)]).toEqual([t.key, []]);
  });
});

describe('Sepet Röntgeni senaryosu', () => {
  it('KANCA → OLGU → MEKANİZMA → MAĞAZAN İÇİN → CTA, 45–58 sn, Faz 1 kurallarına uyar', () => {
    const { script, caption, hashtags, problems } = buildForIdea(ideaOf(topic()), { brief, phase: 1 });
    expect(problems).toEqual([]);
    expect(script.hook_candidates).toHaveLength(3);
    expect(script.scenes[0]).toMatchObject({ kind: 'hook', start: 0 });
    expect(script.scenes[1].visual).toEqual({ type: 'fact', number: '%34' });
    expect(script.scenes.some((s) => s.lines[0] === 'Senin mağazan için:')).toBe(true);
    expect(script.scenes.at(-1)!.lines.join(' ')).toContain('REHBER');
    expect(script.duration_sec).toBeGreaterThanOrEqual(45);
    expect(script.duration_sec).toBeLessThanOrEqual(58);
    expect(script.channel).toBe('Sepet Röntgeni');
    expect(caption).toContain('Kaynak: Nunes & Drèze (2006)');
    expect(caption).toContain('REHBER');
    expect(hashtags.length).toBeGreaterThanOrEqual(3);
    expect(hashtags.length).toBeLessThanOrEqual(5);
    expect(JSON.stringify({ script, caption, hashtags })).not.toMatch(/callypso/i);
  });

  it('kaynaklı yüzde vaat sayılmaz, kaynaksız yüzde yakalanır; markayı suçlayan dil yakalanır', () => {
    expect(checkClaims('Oran %34 oldu.', { sourcedNumbers: new Set(['34']) })).toEqual([]);
    expect(checkClaims('Satışlar %50 artar.', { sourcedNumbers: new Set(['34']) })).toHaveLength(1);
    expect(checkClaims('Bu marka seni kandırıyor.').map((i) => i.rule)).toContain('Markayı suçlayan dil');
  });

  it('Faz 1: ürün tanıtımı (BOF) ve ürün adı geçen elle fikir reddedilir', () => {
    const manual: Idea = { id: 'm', product_id: 'p', used: false, last_used_at: null, idea: 'Sepet unutulmaz. Callypso ile hatırlat.', hook: 'Sepet unutulmaz.', content_type: 'marka_rontgeni', source: 'manual', source_ref: null, score: 75, is_exploration: false, why: '', funnel: 'TOF' };
    expect(buildForIdea(manual, { brief, phase: 1 }).problems).toContain('Faz 1: ürün adı hiçbir yerde geçmemeli.');
    const short = { ...manual, idea: 'Sepet unutulmaz. Bir hatırlatma yeter.' };
    expect(buildForIdea(short, { brief, phase: 1 }).problems.join()).toMatch(/Süre .* 45–58/);
    const clean = { ...manual, idea: 'Sepet unutulmaz. Sepete ürün ekleyen müşteri aslında karar vermek üzereydi. Bir şey araya girdi ve sayfayı kapattı. Ona suçlama değil, hatırlatma gönder. Mesajda sepetteki ürünü göster. İlk hatırlatmayı aynı gün içinde gönder.' };
    expect(buildForIdea(clean, { brief, phase: 1 }).problems).toEqual([]);
  });
});

describe('sütun karması', () => {
  it('hedef orana en çok gerisinde kalan sütunu seçer', () => {
    const v = (content_type: string) => ({ product_id: 'p', content_type, style: 's', created_at: '' }) as never;
    expect(choosePillar([], pillarTargets(1)).pillar).toBe('A');
    const recent = [v('marka_rontgeni'), v('marka_rontgeni'), v('marka_rontgeni')];
    expect(choosePillar(recent, pillarTargets(1)).pillar).toBe('B');
  });
});
