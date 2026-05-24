import { useI18n } from '../../i18n/I18nContext';

export function MediaPage() {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6">
      <h2 className="text-2xl font-black text-stone-950">{t('Medios / Imagenes')}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
        {t('El backend de Kedada todavia no expone endpoints para subir, listar o administrar imagenes.')}{' '}
        {t('Actualmente')} <code>thumbnail</code> {t('en eventos es un UUID simple. El formulario permite capturar ese UUID mientras se define el catalogo real de medios.')}
      </p>
      <p className="mt-4 text-sm font-semibold text-rose-700">
        {t('TODO backend: agregar endpoints de medios antes de habilitar carga o selector visual de imagenes.')}
      </p>
    </div>
  );
}
