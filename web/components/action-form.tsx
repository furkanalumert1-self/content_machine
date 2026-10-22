'use client';
import { useActionState, type ReactNode } from 'react';
import type { ActionResult } from '@/lib/validate';
import { Button, Notice } from './ui';

type Action = (prev: ActionResult, form: FormData) => Promise<ActionResult>;

/** Sunucu eylemi formu: bekleme durumu + sonuç mesajı. confirm verilirse gönderimden önce onay sorar. */
export function ActionForm({ action, label, variant = 'primary', children, confirm, className, hidden }: {
  action: Action; label: string; variant?: 'primary' | 'secondary' | 'success' | 'danger'; children?: ReactNode;
  confirm?: string; className?: string; hidden?: Record<string, string>;
}) {
  const [state, run, pending] = useActionState(action, undefined);
  return (
    <form action={run} className={className}
      onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {children}
      <Button type="submit" variant={variant} disabled={pending} className={children ? 'mt-3' : ''}>{pending ? 'İşleniyor…' : label}</Button>
      {state && <div className="mt-2"><Notice tone={state.ok ? 'ok' : 'error'}>{state.message}</Notice></div>}
    </form>
  );
}
