// Stil listesi (config/styles/*.json). Panel ve motor aynı listeyi kullanır; dosya sistemine bağımlı değildir.
import darkKeynote from '../../../config/styles/dark-keynote.json' with { type: 'json' };

export interface StyleConfig { slug: string; name: string; status: string }
export const STYLES: StyleConfig[] = [darkKeynote];
export const activeStyles = () => STYLES.filter((s) => s.status === 'mvp' || s.status === 'active');
