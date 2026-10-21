// Video metinlerinde yasaklı iddiaları yakalar. Fikirler, senaryolar ve caption'lar bundan geçer.

export interface ClaimIssue { rule: string; match: string }

const RULES: { rule: string; re: RegExp }[] = [
  { rule: 'Kanıtlanmamış yüzde/artış vaadi', re: /(%\s?\d+([.,]\d+)?|\d+([.,]\d+)?\s?%|\d+\s?kat)\s*(daha\s+)?(artış|fazla|daha|büyüme|yükseliş|gelir|satış)?/gi },
  { rule: 'Kesin sonuç vaadi', re: /\b(garanti(li|liyoruz)?|kesin(likle)? (artar|kazanırsın)|ikiye katla|patlat)\w*/gi },
  { rule: 'Demo rakamı', re: /48[.,]?920|42[.,]6/g },
  { rule: 'Rakip adı', re: /\b(mailchimp|klaviyo|omnisend|brevo|sendinblue|insider|hubspot|activecampaign|netgsm|iletimerkezi)\b/gi },
  { rule: 'Cold outreach çağrışımı', re: /\b(cold (email|outreach)|soğuk (e-?posta|mail|arama)|satın alınmış liste|toplu liste satın)\b/gi },
  { rule: 'Hukuki garanti', re: /\b(kvkk|iys|İYS)\b[^.]{0,40}\b(garanti|biz hallederiz|tamamen uyumlu|%100 uyumlu)/gi },
  { rule: 'Web adresi (yönlendirme yalnızca profil bağlantısıyla)', re: /\b(https?:\/\/\S+|www\.\S+|[a-z0-9-]+\.(vercel\.app|com|app|io|net|org|com\.tr)\b\S*)/gi },
  { rule: 'Fiyat', re: /(\$|₺|TL|USD|€)\s?\d+|\d+\s?(\$|₺|TL|USD|€)/g },
];

export function checkClaims(text: string): ClaimIssue[] {
  const issues: ClaimIssue[] = [];
  for (const { rule, re } of RULES) {
    for (const m of text.matchAll(re)) {
      if (m[0].trim()) issues.push({ rule, match: m[0].trim() });
    }
  }
  return issues;
}

/** Doğrulanmamış özellik adlarını (brief'ten) metinde arar. */
export function mentionsUnverified(text: string, unverified: string[]): string[] {
  const lower = text.toLocaleLowerCase('tr');
  return unverified
    .map((u) => u.match(/^\*\*(.+?)(\s*\(.+?\))?:?\*\*/)?.[1])
    .filter((name): name is string => !!name)
    .filter((name) => {
      const key = name.toLocaleLowerCase('tr').replace(/^gerçek\s+/, '');
      return lower.includes(key);
    });
}
