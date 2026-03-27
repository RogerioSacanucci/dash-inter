import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

export function useLinkEditor(linkId: number) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getLinkContent(linkId)
      .then((res) => { setContent(res.content); setOriginalContent(res.content); })
      .catch(() => setError('Erro ao carregar conteudo do arquivo'))
      .finally(() => setLoading(false));
  }, [linkId]);

  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.saveLinkContent(linkId, content);
      setOriginalContent(content);
      return true;
    } catch {
      setSaveError('Erro ao salvar arquivo');
      return false;
    } finally {
      setSaving(false);
    }
  }, [linkId, content]);

  const isDirty = content !== originalContent;

  return { content, setContent, loading, saving, error, saveError, save, isDirty };
}
