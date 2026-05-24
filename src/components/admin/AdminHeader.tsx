import { ButtonLink } from '../common/Button';
import { Button } from '../common/Button';
import { useAuth } from '../../auth/useAuth';
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher';
import { useI18n } from '../../i18n/I18nContext';

export function AdminHeader() {
  const { logout, session } = useAuth();
  const { t } = useI18n();

  return (
    <header className="flex flex-col gap-3 border-b border-stone-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-stone-500">{t('Panel de administracion')}</p>
        <h1 className="text-xl font-bold text-stone-950">{t('Gestion de contenido Kedada')}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {session?.name && <span className="text-sm font-semibold text-stone-600">{session.name}</span>}
        <LanguageSwitcher />
        <ButtonLink to="/admin/events/new">{t('Crear evento')}</ButtonLink>
        <Button type="button" variant="secondary" onClick={logout}>
          {t('Salir')}
        </Button>
      </div>
    </header>
  );
}
