import type { Language } from '../i18n/I18nContext';

export function formatCurrency(value: number | null | undefined, language: Language = 'es') {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return language === 'es' ? 'Precio no publicado' : 'Price not published';
  }

  if (value === 0) {
    return language === 'es' ? 'Gratis' : 'Free';
  }

  return new Intl.NumberFormat(language === 'es' ? 'es-SV' : 'en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function formatDate(value: string | null | undefined, language: Language = 'es') {
  if (!value) {
    return language === 'es' ? 'Fecha no disponible' : 'Date unavailable';
  }

  return new Intl.DateTimeFormat(language === 'es' ? 'es-SV' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function truncate(text: string | null | undefined, maxLength = 150, language: Language = 'es') {
  if (!text) {
    return language === 'es' ? 'Sin descripcion disponible.' : 'No description available.';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

export function getStatusLabel(language: Language = 'es') {
  return language === 'es' ? 'Publicado' : 'Published';
}
