import { useNavigate } from 'react-router-dom';
import { useLinks } from '../hooks/useLinks';

export default function Links() {
  const { links, loading, error } = useLinks();
  const navigate = useNavigate();

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
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <div className="text-zinc-400 text-sm">Nenhum link configurado</div>
        <div className="text-zinc-600 text-xs">
          Peça ao administrador para configurar seus links
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold text-white">Meus Links</h1>
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
                className="text-zinc-400 text-xs hover:text-brand truncate"
              >
                {link.external_url}
              </a>
            </div>
            <button
              onClick={() =>
                navigate(`/links/${link.id}/edit`, { state: { link } })
              }
              className="w-full bg-brand hover:bg-brand-hover text-white text-xs font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Editar arquivo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
