import type React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-rose-600 text-white shadow-sm shadow-rose-200 hover:bg-rose-700',
  secondary: 'border border-stone-300 bg-white text-stone-900 hover:border-rose-300 hover:text-rose-700',
  ghost: 'text-stone-700 hover:bg-stone-100',
  danger: 'bg-red-600 text-white shadow-sm shadow-red-100 hover:bg-red-700',
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: Variant;
};

export function ButtonLink({ className, variant = 'primary', ...props }: ButtonLinkProps) {
  return (
    <Link
      className={clsx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
