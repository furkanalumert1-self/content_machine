'use client';
import { useActionState } from 'react';
import { Button, Field, Input, Notice } from '@/components/ui';
import { signIn } from './actions';

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="E-posta">
        <Input type="email" name="email" required autoComplete="username" placeholder="siz@ornek.com" />
      </Field>
      <Field label="Şifre">
        <Input type="password" name="password" required autoComplete="current-password" />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">{pending ? 'Giriş yapılıyor…' : 'Giriş yap'}</Button>
      {state && <Notice tone={state.ok ? 'ok' : 'error'}>{state.message}</Notice>}
    </form>
  );
}
