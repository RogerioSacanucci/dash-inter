import { useCallback, useEffect, useState } from 'react';
import { api, UserLink } from '../api/client';

export function useLinks() {
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.links();
      setLinks(res.data);
    } catch {
      setError('Erro ao carregar links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { links, loading, error, reload: load };
}
