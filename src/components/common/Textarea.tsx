import type React from 'react';
import clsx from 'clsx';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
};

export function Textarea({ label, error, helperText, required, className, id, ...props }: TextareaProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block" htmlFor={inputId}>
      <span className="text-sm font-semibold text-stone-900">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      <textarea
        id={inputId}
        className={clsx(
          'mt-2 min-h-32 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100',
          error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
          className,
        )}
        {...props}
      />
      {helperText && !error && <span className="mt-1.5 block text-xs text-stone-500">{helperText}</span>}
      {error && <span className="mt-1.5 block text-xs font-medium text-red-700">{error}</span>}
    </label>
  );
}
