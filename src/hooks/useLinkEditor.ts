import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useLinkEditor(linkId: number) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['link-content', linkId],
    queryFn: () => api.getLinkContent(linkId),
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setContent(data.content);
    }
  }, [data]);

  const originalContent =
    queryClient.getQueryData<{ content: string }>(['link-content', linkId])
      ?.content ?? '';

  const saveMutation = useMutation({
    mutationFn: () => api.saveLinkContent(linkId, content),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['link-content', linkId] }),
  });

  return {
    content,
    setContent,
    loading: isLoading,
    saving: saveMutation.isPending,
    error: error?.message ?? null,
    saveError: saveMutation.error?.message ?? null,
    save: useCallback(() => saveMutation.mutateAsync(), [saveMutation]),
    isDirty: content !== originalContent,
  };
}
