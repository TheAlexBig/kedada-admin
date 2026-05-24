import { useI18n } from './I18nContext';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-stone-600">
      <span className="sr-only">{t('Idioma')}</span>
      <select
        aria-label={t('Idioma')}
        className="h-10 rounded-md border border-stone-300 bg-white px-2 text-sm text-stone-800"
        value={language}
        onChange={(event) => setLanguage(event.target.value as 'es' | 'en')}
      >
        <option value="es">{t('Español')}</option>
        <option value="en">{t('Ingles')}</option>
      </select>
    </label>
  );
}
