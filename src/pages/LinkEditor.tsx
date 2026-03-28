import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useLinkEditor } from '../hooks/useLinkEditor';
import type { UserLink } from '../api/client';

function getLanguage(filePath: string): string {
  return filePath.endsWith('.js') ? 'javascript' : 'html';
}

function injectBaseTag(html: string, externalUrl: string): string {
  const base = `<base href="${externalUrl}">`;
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${base}`);
  }
  return base + html;
}

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 13,
  wordWrap: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
} as const;

export default function LinkEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const linkId = Number(id);

  const state = (window.history.state?.usr ?? {}) as { link?: UserLink };
  const link = state.link;
  const language = getLanguage(link?.file_path ?? '');

  const { content, setContent, loading, saving, error, saveError, save, isDirty } =
    useLinkEditor(linkId);

  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => setPreviewContent(content), 600);
    return () => clearTimeout(timer);
  }, [content, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-canvas">
        <div className="text-zinc-400 text-sm">Carregando arquivo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-canvas gap-3">
        <div className="text-red-400 text-sm">{error}</div>
        <Link to="/links" className="text-brand text-sm hover:underline">
          ← Voltar para links
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-canvas">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-1 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/links')}
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            ← Voltar
          </button>
          {link && (
            <span className="text-white text-sm font-medium">{link.label}</span>
          )}
          {isDirty && (
            <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
              não salvo
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {link && (
            <a
              href={link.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white text-sm transition-colors"
            >
              Abrir site ↗
            </a>
          )}
          {saveError && (
            <span className="text-red-400 text-xs">{saveError}</span>
          )}
          <button
            onClick={save}
            disabled={saving || !isDirty}
            className="bg-brand hover:bg-brand-hover text-white text-xs font-medium py-1.5 px-4 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 min-h-0">
        {/* Monaco Editor */}
        <div className="w-1/2 h-full">
          <Editor
            height="100%"
            language={language}
            value={content}
            onChange={(value) => setContent(value ?? '')}
            theme="vs-dark"
            options={EDITOR_OPTIONS}
          />
        </div>

        {/* Live preview */}
        <div className="w-1/2 h-full border-l border-zinc-800">
          <iframe
            srcDoc={link?.external_url ? injectBaseTag(previewContent, link.external_url) : previewContent}
            title="preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
