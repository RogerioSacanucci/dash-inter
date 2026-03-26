const HUB_URL = import.meta.env.VITE_HUB_URL ?? 'https://hub.exemplo.com';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  const res = await fetch(HUB_URL + path, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'Unexpected error');
  }

  return data as T;
}

export interface LoginResponse {
  token: string;
  user: { id: number; email: string; payer_email: string; pushcut_url?: string; pushcut_notify?: 'all' | 'created' | 'paid'; role?: string };
}

export interface AdminUser {
  id: number;
  email: string;
  payer_email: string;
  payer_name: string;
}

export interface Transaction {
  transaction_id: string;
  amount: number;
  currency: string;
  method: 'mbway' | 'multibanco';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  payer_name: string | null;
  payer_email: string | null;
  payer_document: string | null;
  reference_entity: string | null;
  reference_number: string | null;
  reference_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionsResponse {
  data: Transaction[];
  meta: { total: number; page: number; per_page: number; pages: number };
}

export interface StatsResponse {
  overview: {
    total_transactions: number;
    completed: number;
    pending: number;
    failed: number;
    declined: number;
    total_volume: number;
    mbway_volume: number;
    multibanco_volume: number;
    completed_volume: number;
    pending_volume: number;
    conversion_rate: number;
    declined_rate: number;
  };
  chart: { date?: string; hour?: string; transactions: number; volume: number }[];
  methods: { method: string; count: number; volume: number }[];
  conversions: { amount: number; generated: number; paid: number; conversion: number }[];
  period: string;
  hourly: boolean;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: LoginResponse['user'] }>('/api/auth/me.php'),

  transactions: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<TransactionsResponse>(`/api/transactions.php?${qs}`);
  },

  stats: (period: string = '30d', dateFrom?: string, dateTo?: string, userId?: number) => {
    const params = new URLSearchParams({ period });
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (userId !== undefined) params.set('user_id', String(userId));
    return request<StatsResponse>(`/api/stats.php?${params}`);
  },

  users: () => request<{ users: AdminUser[] }>('/api/auth/users.php'),

  updateSettings: (data: { pushcut_url: string; pushcut_notify: 'all' | 'created' | 'paid' }) =>
    request<{ user: LoginResponse['user'] }>('/api/auth/update.php', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
