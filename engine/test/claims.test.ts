import { describe, expect, it } from 'vitest';
import { checkClaims, mentionsUnverified } from '../src/content/claims.ts';

const rules = (t: string) => checkClaims(t).map((i) => i.rule);

describe('checkClaims', () => {
  it.each([
    ['Satışlarını %30 artır', 'Kanıtlanmamış yüzde/artış vaadi'],
    ['Gelirin 2 kat daha fazla', 'Kanıtlanmamış yüzde/artış vaadi'],
    ['Sonuç garantili!', 'Kesin sonuç vaadi'],
    ['48.920 müşteri bizi kullanıyor', 'Demo rakamı'],
    ["Mailchimp'ten daha iyi", 'Rakip adı'],
    ['Cold outreach için ideal', 'Cold outreach çağrışımı'],
    ['KVKK uyumunu biz hallederiz', 'Hukuki garanti'],
    ['Sadece $49', 'Fiyat'],
    ['Dene: callypso-engage.vercel.app', 'Web adresi (yönlendirme yalnızca profil bağlantısıyla)'],
    ['https://cal.com/furkan-alumert', 'Web adresi (yönlendirme yalnızca profil bağlantısıyla)'],
  ])('"%s" → %s', (text, rule) => {
    expect(rules(text)).toContain(rule);
  });

  it('temiz metne dokunmaz', () => {
    expect(checkClaims('Terk edilmiş sepet akışına satın alma kontrolü ekle. Canlı demoyu dene.')).toEqual([]);
  });
});

describe('mentionsUnverified', () => {
  const unverified = ['**Mağaza senkronu (Shopify vb.):** yok', '**Gerçek İYS entegrasyonu:** yok', '**WhatsApp kanalı:** demo'];
  it('doğrulanmamış özellik adını yakalar', () => {
    expect(mentionsUnverified('Mağaza senkronu ile siparişler gelir', unverified)).toEqual(['Mağaza senkronu']);
    expect(mentionsUnverified('İYS entegrasyonu hazır', unverified)).toEqual(['Gerçek İYS entegrasyonu']);
    expect(mentionsUnverified('WhatsApp kanalı geldi', unverified)).toEqual(['WhatsApp kanalı']);
  });
  it('"İYS\'ye hazır izin takibi" serbesttir', () => {
    expect(mentionsUnverified("İYS'ye hazır izin takibi", unverified)).toEqual([]);
  });
});
