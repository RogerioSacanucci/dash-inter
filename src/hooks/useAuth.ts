import { useState, useEffect } from 'react';
import { api, LoginResponse } from '../api/client';

interface AuthState {
  user: LoginResponse['user'] | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setState({ user: null, loading: false, error: null });
      return;
    }
    api.me()
      .then(({ user }) => setState({ user, loading: false, error: null }))
      .catch(() => {
        localStorage.removeItem('token');
        setState({ user: null, loading: false, error: null });
      });
  }, []);

  async function login(email: string, password: string) {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { token, user } = await api.login(email, password);
      localStorage.setItem('token', token);
      setState({ user, loading: false, error: null });
      return true;
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Erro ao fazer login',
      }));
      return false;
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setState({ user: null, loading: false, error: null });
  }

  return { ...state, login, logout };
}
