import { useI18n } from '../../i18n/I18nContext';

export function MediaPage() {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6">
      <h2 className="text-2xl font-black text-stone-950">{t('Medios / Imagenes')}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
        {t('Las imagenes se cargan al crear o editar un evento y se almacenan en el bucket privado.')}
      </p>
      <p className="mt-4 text-sm font-semibold text-rose-700">
        {t('La aplicacion solicita URLs firmadas temporales para mostrar cada imagen publicada.')}
      </p>
    </div>
  );
}
