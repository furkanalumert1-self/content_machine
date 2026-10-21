import { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame } from 'remotion';
import { SAFE } from './theme.ts';

// Türkçe harf çıkıntıları (İ noktası, ş/ç kuyruğu) satır kutusunu birkaç piksel aşar; bu taşma sayılmaz.
// Gerçek taşmada en az bir satır (≥60 px) kesilir.
const INK_TOLERANCE = 16;

/**
 * Metin kutusunun taşıp taşmadığını ve güvenli alanın dışına çıkıp çıkmadığını ölçer.
 * Sonuç tarayıcı konsoluna "QC|" önekiyle yazılır; render tarafı bunu toplar.
 * Ölçüm, sahnenin giriş animasyonu bittikten sonraki karede yapılır.
 */
export function useTextQc<T extends HTMLElement>(id: string, settleFrame: number) {
  const ref = useRef<T>(null);
  const frame = useCurrentFrame();
  useLayoutEffect(() => {
    if (frame !== settleFrame || !ref.current) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const scale = r.width / el.offsetWidth || 1; // önizlemede ölçek olabilir
    const box = { top: r.top / scale, bottom: r.bottom / scale, left: r.left / scale, right: r.right / scale };
    const problems: string[] = [];
    if (el.scrollWidth > el.clientWidth + 1) problems.push(`yatay taşma (${el.scrollWidth}>${el.clientWidth})`);
    if (el.scrollHeight > el.clientHeight + INK_TOLERANCE) problems.push(`dikey taşma (${el.scrollHeight}>${el.clientHeight})`);
    if (box.top < SAFE.top - 1 || box.bottom > SAFE.bottom + 1 || box.left < SAFE.left - 1 || box.right > SAFE.right + 1) {
      problems.push(`güvenli alan dışı (${Math.round(box.left)},${Math.round(box.top)})–(${Math.round(box.right)},${Math.round(box.bottom)})`);
    }
    console.log(`QC|${JSON.stringify({ id, ok: problems.length === 0, problems })}`);
  }, [frame, settleFrame, id]);
  return ref;
}
