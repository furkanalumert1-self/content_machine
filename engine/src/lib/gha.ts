// GitHub Actions adım çıktısı (sonraki adımlar `steps.<id>.outputs.<ad>` ile okur). Actions dışında sessizce atlanır.
import { appendFileSync } from 'node:fs';

export function setOutput(name: string, value: string | boolean | number) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}
