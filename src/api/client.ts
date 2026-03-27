const HUB_URL = import.meta.env.VITE_HUB_URL ?? "https://hub.exemplo.com";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  const res = await fetch(HUB_URL + path, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Unexpected error");
  }

  return data as T;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    payer_email: string;
    pushcut_url?: string;
    pushcut_notify?: "all" | "created" | "paid";
    role?: string;
    cartpanda_param?: string | null;
  };
}

export interface AdminUser {
  id: number;
  email: string;
  payer_email: string;
  payer_name: string;
  role: string;
  cartpanda_param: string | null;
  active: boolean;
  created_at: string;
}

export interface AdminUsersResponse {
  data: AdminUser[];
  meta: { total: number; page: number; per_page: number; pages: number };
}

export interface CreateUserPayload {
  email: string;
  password: string;
  payer_email?: string;
  payer_name?: string;
  role: string;
  cartpanda_param?: string | null;
  success_url?: string;
  failed_url?: string;
  pushcut_url?: string;
  pushcut_notify?: string;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'password'> & { active: boolean }>;

export interface Transaction {
  transaction_id: string;
  amount: number;
  currency: string;
  method: "mbway" | "multibanco";
  status: "PENDING" | "COMPLETED" | "FAILED" | "EXPIRED";
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
  chart: {
    date?: string;
    hour?: string;
    transactions: number;
    volume: number;
  }[];
  methods: { method: string; count: number; volume: number }[];
  conversions: {
    amount: number;
    generated: number;
    paid: number;
    conversion: number;
  }[];
  period: string;
  hourly: boolean;
}

export interface CartpandaOrder {
  cartpanda_order_id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "DECLINED" | "REFUNDED";
  event: string;
  payer_name: string | null;
  payer_email: string | null;
  created_at: string;
}

export interface CartpandaOrdersResponse {
  data: CartpandaOrder[];
  meta: { total: number; page: number; per_page: number; pages: number };
}

export interface CartpandaStatsResponse {
  overview: {
    total_orders: number;
    completed: number;
    pending: number;
    failed: number;
    declined: number;
    refunded: number;
    total_volume: number;
  };
  chart: { date?: string; hour?: string; orders: number; volume: number }[];
  period: string;
  hourly: boolean;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ user: LoginResponse["user"] }>("/api/auth/me"),

  transactions: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<TransactionsResponse>(`/api/transactions?${qs}`);
  },

  stats: (
    period: string = "30d",
    dateFrom?: string,
    dateTo?: string,
    userId?: number,
  ) => {
    const params = new URLSearchParams({ period });
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (userId !== undefined) params.set("user_id", String(userId));
    return request<StatsResponse>(`/api/stats?${params}`);
  },

  cartpandaOrders: (
    params: {
      page?: string;
      status?: string;
      date_from?: string;
      date_to?: string;
      order_id?: string;
      user_id?: string;
    } = {},
  ) => {
    const qs = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    return request<CartpandaOrdersResponse>(`/api/cartpanda-orders?${qs}`);
  },

  cartpandaStats: (
    period: string = "30d",
    dateFrom?: string,
    dateTo?: string,
    userId?: string,
  ) => {
    const params = new URLSearchParams({ period });
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (userId) params.set("user_id", userId);
    return request<CartpandaStatsResponse>(`/api/cartpanda-stats?${params}`);
  },

  users: () => request<{ users: AdminUser[] }>("/api/auth/users"),

  adminUsers: (page = 1) =>
    request<AdminUsersResponse>(`/api/admin/users?page=${page}`),

  adminCreateUser: (payload: CreateUserPayload) =>
    request<{ user: AdminUser }>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  adminUpdateUser: (id: number, payload: UpdateUserPayload) =>
    request<{ user: AdminUser }>(`/api/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  adminDeleteUser: (id: number) =>
    request<{ success: boolean }>(`/api/admin/users/${id}`, {
      method: "DELETE",
    }),

  updateSettings: (data: {
    pushcut_url: string;
    pushcut_notify: "all" | "created" | "paid";
  }) =>
    request<{ user: LoginResponse["user"] }>("/api/auth/update", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
