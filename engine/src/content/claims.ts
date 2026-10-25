// Video metinlerinde yasaklı iddiaları yakalar. Fikirler, senaryolar ve caption'lar bundan geçer.

export interface ClaimIssue { rule: string; match: string }

const RULES: { rule: string; re: RegExp }[] = [
  { rule: 'Kanıtlanmamış yüzde/artış vaadi', re: /(%\s?\d+([.,]\d+)?|\d+([.,]\d+)?\s?%|\d+([.,]\d+)?\s?kat)\s*(daha\s+)?(artış|fazla|daha|büyüme|yükseliş|gelir|satış)?/gi },
  { rule: 'Kesin sonuç vaadi', re: /\b(garanti(li|liyoruz)?|kesin(likle)? (artar|kazanırsın)|ikiye katla|patlat)\w*/gi },
  { rule: 'Demo rakamı', re: /48[.,]?920|42[.,]6/g },
  { rule: 'Rakip adı', re: /\b(mailchimp|klaviyo|omnisend|brevo|sendinblue|insider|hubspot|activecampaign|netgsm|iletimerkezi)\b/gi },
  { rule: 'Cold outreach çağrışımı', re: /\b(cold (email|outreach)|soğuk (e-?posta|mail|arama)|satın alınmış liste|toplu liste satın)\b/gi },
  { rule: 'Hukuki garanti', re: /\b(kvkk|iys|İYS)\b[^.]{0,40}\b(garanti|biz hallederiz|tamamen uyumlu|%100 uyumlu)/gi },
  { rule: 'Web adresi (yönlendirme yalnızca profil bağlantısıyla)', re: /\b(https?:\/\/\S+|www\.\S+|[a-z0-9-]+\.(vercel\.app|com|app|io|net|org|com\.tr)\b\S*)/gi },
  { rule: 'Kişisel veri (e-posta)', re: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g },
  { rule: 'Kişisel veri (telefon)', re: /(\+?90[\s-]?)?\(?0?5\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/g },
  { rule: 'Markayı suçlayan dil', re: /\b(kandır|dolandır|aldat|sömür|manipüle ed)\p{L}*/giu },
  { rule: 'Fiyat', re: /(\$|₺|TL|USD|€)\s?\d+|\d+\s?(\$|₺|TL|USD|€)/g },
];

/**
 * @param opts.sourcedNumbers kaynağı doğrulanmış rakamlar (konu bankası); bunları içeren yüzde/kat ifadeleri vaat sayılmaz.
 */
export function checkClaims(text: string, opts: { sourcedNumbers?: Set<string> } = {}): ClaimIssue[] {
  const issues: ClaimIssue[] = [];
  for (const { rule, re } of RULES) {
    for (const m of text.matchAll(re)) {
      if (!m[0].trim()) continue;
      if (rule === 'Kanıtlanmamış yüzde/artış vaadi' && opts.sourcedNumbers) {
        const nums = [...m[0].matchAll(/\d+(?:[.,]\d+)*/g)].map((x) => x[0].replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.'));
        if (nums.length && nums.every((n) => opts.sourcedNumbers!.has(n))) continue;
      }
      issues.push({ rule, match: m[0].trim() });
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
