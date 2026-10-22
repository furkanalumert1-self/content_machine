import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { STATUS } from '@/lib/format';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, aside }: { children: ReactNode; className?: string; title?: string; aside?: ReactNode }) {
  return (
    <section className={cx('rounded-2xl border border-line bg-white p-5 shadow-sm', className)}>
      {(title || aside) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

const BTN = {
  primary: 'bg-navy text-white hover:bg-navy-2',
  secondary: 'border border-line bg-white text-ink hover:bg-surface',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
};
export function Button({ variant = 'primary', className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BTN }) {
  return <button {...rest} className={cx('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50', BTN[variant], className)} />;
}

const TONE = {
  gray: 'bg-slate-100 text-slate-700', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-800',
  green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700', cyan: 'bg-cyan-50 text-cyan-800',
};
export function Badge({ tone = 'gray', children }: { tone?: keyof typeof TONE; children: ReactNode }) {
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TONE[tone])}>{children}</span>;
}
export const StatusBadge = ({ status }: { status: string }) => <Badge tone={STATUS[status]?.tone ?? 'gray'}>{STATUS[status]?.label ?? status}</Badge>;

const NOTICE = { info: 'border-blue-200 bg-blue-50 text-blue-900', warn: 'border-amber-200 bg-amber-50 text-amber-900', error: 'border-red-200 bg-red-50 text-red-900', ok: 'border-emerald-200 bg-emerald-50 text-emerald-900' };
export function Notice({ tone = 'info', children }: { tone?: keyof typeof NOTICE; children: ReactNode }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={cx('rounded-xl border px-4 py-3 text-sm', NOTICE[tone])}>{children}</div>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center">
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
const INPUT = 'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-navy-2 focus:ring-2 focus:ring-cyan/40';
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(INPUT, p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx(INPUT, 'font-mono', p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(INPUT, p.className)} />;
