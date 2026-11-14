// Özel çizim dünyaları: konu bankasında story.world bu anahtarlardan birini gösterir.
import type { ComponentType } from 'react';
import type { WorldProps } from './kit.tsx';
import { Ceket } from './Ceket.tsx';
import { Cukur } from './Cukur.tsx';
import { Detour } from './Detour.tsx';
import { Fiyat9 } from './Fiyat9.tsx';
import { Isim } from './Isim.tsx';
import { Piyano } from './Piyano.tsx';
import { Raf } from './Raf.tsx';
import { Recel } from './Recel.tsx';
import { Stratos } from './Stratos.tsx';
import { Tuzak } from './Tuzak.tsx';

export const WORLDS: Record<string, ComponentType<WorldProps>> = {
  tuzak: Tuzak,
  recel: Recel,
  fiyat9: Fiyat9,
  stratos: Stratos,
  piyano: Piyano,
  isim: Isim,
  raf: Raf,
  detour: Detour,
  cukur: Cukur,
  ceket: Ceket,
};
