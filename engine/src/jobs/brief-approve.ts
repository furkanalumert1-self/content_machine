// Panel (ADIM 9) gelene kadar: kullanıcı onay verdiğinde brief dosyasına o anki metnin özetini yazar.
// Metin sonradan değişirse özet tutmaz ve onay kendiliğinden düşer.
// Çalıştırma: npx tsx src/jobs/brief-approve.ts callypso-engage
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { approveBriefMarkdown, parseBrief } from '../brief/brief.ts';

const slug = process.argv[2];
if (!slug) throw new Error('Kullanım: brief-approve <ürün-slug>');
const file = join(import.meta.dirname, '../../../config/products', `${slug}.md`);
const updated = approveBriefMarkdown(await readFile(file, 'utf8'));
await writeFile(file, updated);
console.log(`Onaylandı: ${slug} (özet ${parseBrief(updated).approvedHash})`);
