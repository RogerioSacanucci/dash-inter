import { useState, useEffect, FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, AdminUser, AdminCartpandaShop, CreateUserPayload, UpdateUserPayload } from '../api/client';

interface UserFormModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onSave: (payload: CreateUserPayload | UpdateUserPayload) => Promise<number | void>;
}

const inputClass =
  'w-full bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-colors';

export default function UserFormModal({ user, onClose, onSave }: UserFormModalProps) {
  const isEdit = user !== null;

  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role ?? 'user');
  const [payerName, setPayerName] = useState(user?.payer_name ?? '');
  const [payerEmail, setPayerEmail] = useState(user?.payer_email ?? '');
  const [cartpandaParam, setCartpandaParam] = useState(user?.cartpanda_param ?? '');
  const [facebookPixelId, setFacebookPixelId] = useState(user?.facebook_pixel_id ?? '');
  const [facebookAccessToken, setFacebookAccessToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shop management
  const { data: shopsData } = useQuery({
    queryKey: ['cartpanda-shops-all'],
    queryFn: () => api.adminCartpandaShops(),
  });
  const allShops = shopsData?.data ?? [];
  const [userShops, setUserShops] = useState<AdminCartpandaShop[]>(user?.shops ?? []);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [shopLoading, setShopLoading] = useState(false);

  const availableShops = allShops.filter(
    (shop) => !userShops.some((us) => us.id === shop.id),
  );

  async function handleAttachShop() {
    if (!selectedShopId) return;
    const shopId = Number(selectedShopId);
    const shop = allShops.find((s) => s.id === shopId);
    if (!shop) return;

    if (isEdit && user) {
      setShopLoading(true);
      try {
        await api.adminAttachUserShop(user.id, shopId);
        setUserShops((prev) => [...prev, shop]);
        setSelectedShopId('');
      } catch {
        setError('Erro ao associar loja.');
      } finally {
        setShopLoading(false);
      }
    } else {
      setUserShops((prev) => [...prev, shop]);
      setSelectedShopId('');
    }
  }

  async function handleDetachShop(shopId: number) {
    if (isEdit && user) {
      setShopLoading(true);
      try {
        await api.adminDetachUserShop(user.id, shopId);
        setUserShops((prev) => prev.filter((s) => s.id !== shopId));
      } catch {
        setError('Erro ao remover loja.');
      } finally {
        setShopLoading(false);
      }
    } else {
      setUserShops((prev) => prev.filter((s) => s.id !== shopId));
    }
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEdit) {
        const payload: UpdateUserPayload = {
          email,
          role,
          payer_name: payerName,
          payer_email: payerEmail,
          cartpanda_param: cartpandaParam || null,
          facebook_pixel_id: facebookPixelId || null,
          ...(facebookAccessToken ? { facebook_access_token: facebookAccessToken } : {}),
        };
        await onSave(payload);
      } else {
        const payload: CreateUserPayload = {
          email,
          password,
          role,
          payer_name: payerName,
          payer_email: payerEmail,
          cartpanda_param: cartpandaParam || null,
          facebook_pixel_id: facebookPixelId || null,
          ...(facebookAccessToken ? { facebook_access_token: facebookAccessToken } : {}),
        };
        const newUserId = await onSave(payload);
        if (typeof newUserId === 'number' && userShops.length > 0) {
          await Promise.all(userShops.map((s) => api.adminAttachUserShop(newUserId, s.id)));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar utilizador.');
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-surface-1 rounded-2xl border border-white/[0.06] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Editar utilizador' : 'Criar utilizador'}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? 'Editar utilizador' : 'Criar utilizador'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="uf-email">
              Email
            </label>
            <input
              id="uf-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className={inputClass}
            />
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="uf-password">
                Password
              </label>
              <input
                id="uf-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="uf-role">
              Role
            </label>
            <select
              id="uf-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="uf-payer-name">
              Nome pagador
            </label>
            <input
              id="uf-payer-name"
              type="text"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              placeholder="Nome completo"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="uf-payer-email">
              Email pagador
            </label>
            <input
              id="uf-payer-email"
              type="email"
              value={payerEmail}
              onChange={(e) => setPayerEmail(e.target.value)}
              placeholder="payer@example.com"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="uf-cartpanda">
              Internacional param
            </label>
            <input
              id="uf-cartpanda"
              type="text"
              value={cartpandaParam}
              onChange={(e) => setCartpandaParam(e.target.value)}
              placeholder="Opcional"
              className={inputClass}
            />
          </div>

          <div className="border-t border-white/[0.06] pt-4 flex flex-col gap-4">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">
              Facebook Conversions API
            </label>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="uf-fb-pixel">
                Pixel ID
              </label>
              <input
                id="uf-fb-pixel"
                type="text"
                value={facebookPixelId}
                onChange={(e) => setFacebookPixelId(e.target.value)}
                placeholder="123456789012345"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/40 uppercase tracking-widest" htmlFor="uf-fb-token">
                Access Token
              </label>
              <input
                id="uf-fb-token"
                type="password"
                value={facebookAccessToken}
                onChange={(e) => setFacebookAccessToken(e.target.value)}
                placeholder={isEdit && user?.facebook_has_token ? 'Configurado (deixe vazio para manter)' : 'EAAxxxxxxx...'}
                className={inputClass}
              />
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-2 flex flex-col gap-3">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">
              Lojas Internacional
            </label>

            {userShops.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {userShops.map((shop) => (
                  <span
                    key={shop.id}
                    className="bg-surface-2 border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-white/70 flex items-center gap-1.5"
                  >
                    {shop.name}
                    <button
                      type="button"
                      disabled={shopLoading}
                      onClick={() => handleDetachShop(shop.id)}
                      className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-50"
                      aria-label={`Remover ${shop.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className={inputClass}
                disabled={shopLoading || availableShops.length === 0}
              >
                <option value="">
                  {availableShops.length === 0 ? 'Sem lojas disponíveis' : 'Selecionar loja...'}
                </option>
                {availableShops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedShopId || shopLoading}
                onClick={handleAttachShop}
                className="px-4 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                Adicionar
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
            >
              {saving ? 'Salvando...' : isEdit ? 'Guardar' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-white/40 hover:text-white/70 rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
