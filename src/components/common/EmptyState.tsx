import { Search } from 'lucide-react';

export function EmptyState({
  title = 'No se encontraron eventos',
  description = 'Aun no hay contenido para mostrar.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-stone-300 bg-white/80 p-8 text-center">
      <div>
        <Search className="mx-auto mb-4 h-10 w-10 text-stone-400" />
        <p className="text-base font-semibold text-stone-950">{title}</p>
        <p className="mt-2 text-sm text-stone-600">{description}</p>
      </div>
    </div>
  );
}
