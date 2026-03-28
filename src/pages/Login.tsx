import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      {/* Subtle radial glow behind the form */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-brand/[0.04] blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-2">
            <img src="/logo.png" alt="Fractal" className="h-10 w-auto" />
          </div>
          <p className="text-white/40 text-sm mt-2">Entre na sua conta</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-1 rounded-2xl border border-white/[0.07] p-8 flex flex-col gap-5"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="email">
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
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="password">
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
            className="mt-1 w-full bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
