'use client';
import { useActionState } from 'react';
import { Button, Field, Input, Notice } from '@/components/ui';
import { sendMagicLink } from './actions';

export function LoginForm() {
  const [state, action, pending] = useActionState(sendMagicLink, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="E-posta">
        <Input type="email" name="email" required autoComplete="email" placeholder="siz@ornek.com" />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">{pending ? 'Gönderiliyor…' : 'Giriş bağlantısı gönder'}</Button>
      {state && <Notice tone={state.ok ? 'ok' : 'error'}>{state.message}</Notice>}
    </form>
  );
}
