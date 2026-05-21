export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'Precio no publicado';
  }

  if (value === 0) {
    return 'Gratis';
  }

  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function truncate(text: string | null | undefined, maxLength = 150) {
  if (!text) {
    return 'Sin descripcion disponible.';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

export function getStatusLabel() {
  return 'Publicado';
}
