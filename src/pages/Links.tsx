import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLinks } from '../hooks/useLinks';
import { EmptyState, EmptyIcons } from '../components/ui/EmptyState';

export default function Links() {
  const { links, loading, error } = useLinks();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  function copyLink(id: number, url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400 text-sm">Carregando links...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  if (links.length === 0) {
    return <EmptyState icon={EmptyIcons.link} message="Nenhum link configurado" hint="Peça ao administrador para configurar os seus links" />;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-white">Meus Links</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <div
            key={link.id}
            className="bg-surface-1 rounded-xl border border-zinc-800 p-5 flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <span className="text-white font-medium text-sm">
                {link.label}
              </span>
              <a
                href={link.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 text-xs hover:text-white/70 truncate"
              >
                {link.external_url}
              </a>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyLink(link.id, link.external_url)}
                className="flex-1 bg-surface-2 hover:bg-zinc-800 border border-zinc-800 text-white/60 hover:text-white text-xs font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {copiedId === link.id ? 'Copiado!' : 'Copiar link'}
              </button>
              {link.file_path && (
                <button
                  onClick={() =>
                    navigate(`/links/${link.id}/edit`, { state: { link } })
                  }
                  className="flex-1 bg-brand hover:bg-brand-hover text-white text-xs font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Editar arquivo
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
