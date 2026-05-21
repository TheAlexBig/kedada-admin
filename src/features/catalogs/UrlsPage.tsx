import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

import { getApiErrorMessage } from '../../api/httpClient';
import { getUrls } from '../../api/urlService';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/StatusMessage';
import type { UrlResponse } from '../../types/event';

export function UrlsPage() {
  const [urls, setUrls] = useState<UrlResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUrls() {
      try {
        setLoading(true);
        const page = await getUrls();
        setUrls(page.content);
        setError(null);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void loadUrls();
  }, []);

  if (loading) {
    return <LoadingState label="Cargando enlaces..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-stone-950">URLs / Enlaces</h2>
        <p className="mt-1 text-sm text-stone-600">Catalogo de enlaces externos disponible en la API.</p>
      </div>

      {urls.length === 0 ? (
        <EmptyState title="No hay enlaces" description="Agrega URLs desde la API para asociarlas a eventos." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Descripcion</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {urls.map((url) => (
                <tr key={url.id}>
                  <td className="px-4 py-3 font-semibold text-stone-950">{url.description || 'Sin descripcion'}</td>
                  <td className="px-4 py-3 text-stone-700">{url.kind || 'Sin tipo'}</td>
                  <td className="px-4 py-3">
                    <a
                      href={url.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-md items-center gap-1 truncate font-semibold text-rose-700"
                    >
                      {url.url} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
