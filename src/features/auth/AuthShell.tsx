import type { ReactNode } from 'react';

export function AuthShell({ children, title, description }: { children: ReactNode; title: string; description: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-stone-50 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-lg font-black tracking-tight text-stone-950">Kedada Admin</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Panel de administracion</p>
        </div>
        <h1 className="text-2xl font-black text-stone-950">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
