import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [transitioning, setTransitioning] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) setTransitioning(true);
  }

  function handleTransitionEnd() {
    if (transitioning) navigate('/', { replace: true });
  }

  return (
    <div
      className={`min-h-screen flex bg-canvas transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Left panel — 50% */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden">
        <img
          src="/login.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
        <div className="relative z-10">
          <img src="/logo.png" alt="Fractal" className="h-16 w-auto" />
        </div>
      </div>

      {/* Right panel — 50% */}
      <div className="w-full lg:w-1/2 shrink-0 flex flex-col items-center justify-center px-10 py-12 bg-canvas">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <img src="/logo.png" alt="Fractal" className="h-12 w-auto" />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-white">Entrar na conta</h1>
            <p className="text-sm text-white/40 mt-1">Bem-vindo de volta</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/60" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/60" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98]"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
