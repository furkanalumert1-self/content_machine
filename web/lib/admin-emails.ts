/** ADMIN_EMAIL: bir veya birden çok e-posta (virgül, noktalı virgül veya boşlukla ayrılmış). Boşsa liste boş döner. */
export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? '').split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
}
