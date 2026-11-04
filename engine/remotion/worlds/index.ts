// Özel çizim dünyaları: konu bankasında story.world bu anahtarlardan birini gösterir.
import type { ComponentType } from 'react';
import type { WorldProps } from './kit.tsx';
import { Tuzak } from './Tuzak.tsx';

export const WORLDS: Record<string, ComponentType<WorldProps>> = {
  tuzak: Tuzak,
};
