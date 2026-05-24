import { Search } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

export function EmptyState({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const { t } = useI18n();

  return (
    <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-stone-300 bg-white/80 p-8 text-center">
      <div>
        <Search className="mx-auto mb-4 h-10 w-10 text-stone-400" />
        <p className="text-base font-semibold text-stone-950">{title ?? t('No se encontraron eventos')}</p>
        <p className="mt-2 text-sm text-stone-600">{description ?? t('Aun no hay contenido para mostrar.')}</p>
      </div>
    </div>
  );
}
