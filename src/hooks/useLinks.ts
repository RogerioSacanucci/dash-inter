import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useLinks() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['links'],
    queryFn: () => api.links(),
  });

  return {
    links: data?.data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    reload: refetch,
  };
}
