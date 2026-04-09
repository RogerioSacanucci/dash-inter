const HUB_URL = import.meta.env.VITE_HUB_URL ?? "https://hub.exemplo.com";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Accept": "application/json",
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
    role?: string;
    internacional_param?: string | null;
  };
}

export interface AdminCartpandaShop {
  id: number;
  shop_slug: string;
  name: string;
}

export interface AdminUser {
  id: number;
  email: string;
  payer_email: string;
  payer_name: string;
  role: string;
  cartpanda_param: string | null;
  facebook_pixel_id: string | null;
  facebook_has_token: boolean;
  active: boolean;
  created_at: string;
  shops: AdminCartpandaShop[];
  balance_pending: string;
  balance_released: string;
}

export interface Balance {
  balance_pending: string;
  balance_reserve: string;
  balance_released: string;
  currency: string;
}

export interface ShopBalance {
  shop_id: number;
  shop_name: string;
  gross_volume: number;
  balance_pending: number;
  balance_released: number;
  balance_reserve: number;
}

export interface UserShopBalance {
  account_index: number;
  shop_id: number;
  balance_pending: number;
  balance_released: number;
  balance_reserve: number;
}

export interface UserShopBalancesResponse {
  shop_balances: UserShopBalance[];
}

export interface PayoutLog {
  id: number;
  amount: string;
  type: 'withdrawal' | 'adjustment';
  note: string | null;
  account_index: number | null;
  created_at: string;
}

export interface UserBalanceResponse {
  balance: Balance;
  shop_balances: ShopBalance[];
  payout_logs: {
    data: PayoutLog[];
    meta: { total: number; page: number; per_page: number; pages: number };
  };
}

export interface UserPayoutsResponse {
  totals: { total_withdrawals: string; total_adjustments: string };
  balance: {
    balance_pending: string;
    balance_reserve: string;
    balance_released: string;
    currency: string;
  };
  payout_logs: {
    data: PayoutLog[];
    meta: { total: number; page: number; per_page: number; pages: number };
  };
}

export interface AdminPayoutLogEntry {
  id: number;
  amount: string;
  type: 'withdrawal' | 'adjustment';
  note: string | null;
  shop_name: string | null;
  admin_email: string;
  created_at: string;
  user: { id: number; name: string; email: string };
}

export interface AdminPayoutsResponse {
  totals: { total_withdrawals: string; total_adjustments: string };
  data: AdminPayoutLogEntry[];
  meta: { total: number; page: number; per_page: number; pages: number };
}

export interface AdminPayoutsFilters {
  user_id?: number;
  shop_id?: number;
  type?: 'withdrawal' | 'adjustment';
  date_from?: string;
  date_to?: string;
  page?: number;
}

export interface PayoutPayload {
  amount: number;
  type: 'withdrawal' | 'adjustment';
  note?: string;
  shop_id?: number;
}

export interface WebhookLog {
  id: number;
  event: string | null;
  cartpanda_order_id: string | null;
  shop_slug: string | null;
  status: 'processed' | 'ignored' | 'failed';
  status_reason: string | null;
  payload: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface WebhookLogsResponse {
  data: WebhookLog[];
  meta: { total: number; page: number; per_page: number; pages: number };
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
  facebook_pixel_id?: string | null;
  facebook_access_token?: string | null;
  success_url?: string;
  failed_url?: string;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'password'> & { active: boolean }>;

export interface UserPushcutUrl {
  id: number;
  url: string;
  notify: 'all' | 'created' | 'paid';
  label: string | null;
  created_at: string;
}
export interface UserPushcutUrlsResponse { data: UserPushcutUrl[]; }
export interface CreatePushcutUrlPayload {
  url: string;
  notify: 'all' | 'created' | 'paid';
  label?: string;
}
export type UpdatePushcutUrlPayload = Partial<CreatePushcutUrlPayload>;

// User-facing
export interface UserLink {
  id: number;
  label: string;
  external_url: string;
  file_path: string | null;
}
export interface UserLinksResponse { data: UserLink[]; }

// Admin — aaPanel configs
export interface AdminAaPanelConfig {
  id: number; user_id: number; user_email: string;
  label: string; panel_url: string; api_key_masked: string; created_at: string;
}
export interface AdminAaPanelConfigsResponse { data: AdminAaPanelConfig[]; }
export interface CreateAaPanelConfigPayload { user_id: number; label: string; panel_url: string; api_key: string; }
export type UpdateAaPanelConfigPayload = Partial<Omit<CreateAaPanelConfigPayload, 'user_id'>>;

// Admin — user links
export interface AdminUserLink {
  id: number; user_id: number; user_email: string;
  aapanel_config_id: number | null; aapanel_config_label: string | null;
  label: string; external_url: string; file_path: string | null; created_at: string;
}
export interface AdminUserLinksResponse { data: AdminUserLink[]; }
export interface CreateUserLinkPayload {
  user_id: number; aapanel_config_id?: number | null;
  label: string; external_url: string; file_path?: string | null;
}
export type UpdateUserLinkPayload = Partial<Pick<CreateUserLinkPayload, 'label' | 'external_url' | 'file_path'>>;

// Email Service
export interface EmailServiceInstance {
  id: number;
  name: string;
  url: string;
  active: boolean;
  created_at: string;
}

export interface EmailServiceInstancesResponse {
  data: EmailServiceInstance[];
}

export interface EmailLog {
  id: number;
  recipient_email: string;
  recipient_name: string | null;
  original_email: string | null;
  subject: string | null;
  smtp_account: string;
  smtp_account_index: number;
  status: 'success' | 'failed';
  error_message: string | null;
  order_id: string | null;
  product_name: string | null;
  source: string;
  instance_name: string;
  created_at: string;
}

export interface EmailLogsResponse {
  data: EmailLog[];
  meta: { total: number; page: number; per_page: number; pages: number };
}

export interface EmailStats {
  total: number;
  failures: number;
  success_rate: number;
  corrections: number;
  chart: { date: string; sent: number; failed: number; corrections: number }[];
}

export interface WalletUser {
  id: number;
  email: string;
  name: string | null;
  product_name: string | null;
  created_at: string;
  status: 'active' | 'inactive';
  first_login_at: string | null;
  doc_status: 'pending' | 'under_review' | 'rejected';
}

export interface WalletUsersResponse {
  data: WalletUser[];
  meta: { total: number; page: number; per_page: number; pages: number };
}

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
    net_volume: number;
    refunded_volume: number;
    chargeback_volume: number;
    balance_pending: string;
    balance_reserve: string;
    balance_released: string;
  };
  chart: { date?: string; hour?: string; orders: number; volume: number }[];
  period: string;
  hourly: boolean;
}

export interface AdminCartpandaShopWithStats extends AdminCartpandaShop {
  users_count: number;
  orders_count: number;
  completed: number;
  total_volume: number;
}

export interface AdminCartpandaShopsResponse {
  data: AdminCartpandaShopWithStats[];
  period: string;
}

export interface AdminCartpandaShopUser {
  id: number;
  email: string;
  payer_name: string | null;
  orders_count: number;
  completed: number;
  total_volume: number;
  balance_pending: string;
  balance_released: string;
}

export interface AdminCartpandaShopDetailResponse {
  shop: AdminCartpandaShop;
  aggregate: {
    total_orders: number;
    completed: number;
    pending: number;
    failed: number;
    declined: number;
    refunded: number;
    total_volume: number;
  };
  chart: { date?: string; hour?: string; orders: number; volume: number }[];
  users: AdminCartpandaShopUser[];
  period: string;
  hourly: boolean;
}

export interface MilestoneItem {
  id: number;
  value: number;
  achieved: boolean;
}

export interface AdminMilestone {
  id: number;
  value: number;
  order: number;
}

export interface MilestoneProgressResponse {
  total: number;
  next_milestone: { id: number; value: number; progress_pct: number } | null;
  achieved: { id: number; value: number; achieved_at: string }[];
  all_milestones: MilestoneItem[];
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
    utcOffset?: number,
  ) => {
    const params = new URLSearchParams({ period });
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (userId !== undefined) params.set("user_id", String(userId));
    if (utcOffset !== undefined) params.set("utc_offset", String(utcOffset));
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
      utc_offset?: string;
    } = {},
  ) => {
    const qs = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    return request<CartpandaOrdersResponse>(`/api/internacional-orders?${qs}`);
  },

  cartpandaStats: (
    period: string = "30d",
    dateFrom?: string,
    dateTo?: string,
    userId?: string,
    utcOffset?: number,
  ) => {
    const params = new URLSearchParams({ period });
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (userId) params.set("user_id", userId);
    if (utcOffset !== undefined) params.set("utc_offset", String(utcOffset));
    return request<CartpandaStatsResponse>(`/api/internacional-stats?${params}`);
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

  // Pushcut URLs
  pushcutUrls: () =>
    request<UserPushcutUrlsResponse>('/api/pushcut-urls'),

  createPushcutUrl: (data: CreatePushcutUrlPayload) =>
    request<{ data: UserPushcutUrl }>('/api/pushcut-urls', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePushcutUrl: (id: number, data: UpdatePushcutUrlPayload) =>
    request<{ data: UserPushcutUrl }>(`/api/pushcut-urls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePushcutUrl: (id: number) =>
    request<{ ok: boolean }>(`/api/pushcut-urls/${id}`, {
      method: 'DELETE',
    }),

  // User-facing — links
  links: () => request<UserLinksResponse>('/api/links'),
  getLinkContent: (id: number) => request<{ content: string }>(`/api/links/${id}/content`),
  saveLinkContent: (id: number, content: string) =>
    request<{ message: string }>(`/api/links/${id}/content`, {
      method: 'PUT', body: JSON.stringify({ content }),
    }),

  // Admin — aaPanel configs
  adminAaPanelConfigs: () => request<AdminAaPanelConfigsResponse>('/api/admin/aapanel-configs'),
  adminCreateAaPanelConfig: (payload: CreateAaPanelConfigPayload) =>
    request<AdminAaPanelConfig>('/api/admin/aapanel-configs', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdateAaPanelConfig: (id: number, payload: UpdateAaPanelConfigPayload) =>
    request<AdminAaPanelConfig>(`/api/admin/aapanel-configs/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  adminDeleteAaPanelConfig: (id: number) =>
    request<{ message: string }>(`/api/admin/aapanel-configs/${id}`, { method: 'DELETE' }),

  // Admin — user links
  adminUserLinks: () => request<AdminUserLinksResponse>('/api/admin/user-links'),
  adminCreateUserLink: (payload: CreateUserLinkPayload) =>
    request<AdminUserLink>('/api/admin/user-links', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdateUserLink: (id: number, payload: UpdateUserLinkPayload) =>
    request<AdminUserLink>(`/api/admin/user-links/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  adminDeleteUserLink: (id: number) =>
    request<{ message: string }>(`/api/admin/user-links/${id}`, { method: 'DELETE' }),

  // Admin — CartPanda shops
  adminCartpandaShops: (period: string = '30d', dateFrom?: string, dateTo?: string, utcOffset?: number) => {
    const params = new URLSearchParams({ period });
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (utcOffset !== undefined) params.set('utc_offset', String(utcOffset));
    return request<AdminCartpandaShopsResponse>(`/api/admin/internacional-shops?${params}`);
  },

  adminCartpandaShopDetail: (id: number, period: string = '30d', dateFrom?: string, dateTo?: string, utcOffset?: number) => {
    const params = new URLSearchParams({ period });
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (utcOffset !== undefined) params.set('utc_offset', String(utcOffset));
    return request<AdminCartpandaShopDetailResponse>(`/api/admin/internacional-shops/${id}?${params}`);
  },

  adminAttachUserShop: (userId: number, shopId: number) =>
    request<{ message: string }>(`/api/admin/users/${userId}/shops`, {
      method: 'POST',
      body: JSON.stringify({ shop_id: shopId }),
    }),

  adminDetachUserShop: (userId: number, shopId: number) =>
    request<{ message: string }>(`/api/admin/users/${userId}/shops/${shopId}`, {
      method: 'DELETE',
    }),

  // Balance
  getOwnBalance: () =>
    request<Balance>('/api/balance'),

  getOwnShopBalances: () =>
    request<UserShopBalancesResponse>('/api/balance/shops'),

  adminGetUserBalance: (userId: number, page = 1) =>
    request<UserBalanceResponse>(`/api/admin/users/${userId}/balance?page=${page}`),

  adminPayout: (userId: number, payload: PayoutPayload) =>
    request<Balance>(`/api/admin/users/${userId}/payout`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPayouts: (page = 1) =>
    request<UserPayoutsResponse>(`/api/payouts?page=${page}`),

  adminGetAllPayouts: (filters: AdminPayoutsFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.user_id)   params.set('user_id', String(filters.user_id));
    if (filters.shop_id)   params.set('shop_id', String(filters.shop_id));
    if (filters.type)      params.set('type', filters.type);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to)   params.set('date_to', filters.date_to);
    if (filters.page)      params.set('page', String(filters.page));
    return request<AdminPayoutsResponse>(`/api/admin/payouts?${params.toString()}`);
  },

  // Admin — Email Service (Instances CRUD)
  adminEmailInstances: () =>
    request<EmailServiceInstancesResponse>('/api/admin/email-instances'),

  adminCreateEmailInstance: (payload: { name: string; url: string; api_key: string }) =>
    request<{ data: EmailServiceInstance }>('/api/admin/email-instances', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminUpdateEmailInstance: (id: number, payload: Partial<{ name: string; url: string; api_key: string; active: boolean }>) =>
    request<{ data: EmailServiceInstance }>(`/api/admin/email-instances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  adminDeleteEmailInstance: (id: number) =>
    request<{ message: string }>(`/api/admin/email-instances/${id}`, { method: 'DELETE' }),

  // Admin — Email Service (Proxy)
  adminEmailLogs: (params: { instance_id?: number; status?: string; date_from?: string; date_to?: string; email?: string; page?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return request<EmailLogsResponse>(`/api/admin/email-service/logs?${qs}`);
  },

  adminEmailStats: (params: { instance_id?: number; date_from?: string; date_to?: string } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return request<{ data: EmailStats }>(`/api/admin/email-service/stats?${qs}`);
  },

  adminWalletUsers: (params: { instance_id: number; status?: string; email?: string; page?: number }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return request<WalletUsersResponse>(`/api/admin/email-service/users?${qs}`);
  },

  // Milestones
  getMilestoneProgress: () =>
    request<MilestoneProgressResponse>('/api/milestones/progress'),

  // Admin — Milestones CRUD
  adminGetMilestones: () =>
    request<{ milestones: AdminMilestone[] }>('/api/admin/milestones'),

  adminCreateMilestone: (data: { value: number; order: number }) =>
    request<{ milestone: AdminMilestone }>('/api/admin/milestones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminUpdateMilestone: (id: number, data: { value?: number; order?: number }) =>
    request<{ milestone: AdminMilestone }>(`/api/admin/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  adminDeleteMilestone: (id: number) =>
    request<{ ok: boolean }>(`/api/admin/milestones/${id}`, { method: 'DELETE' }),

  // Admin — Webhook logs
  adminWebhookLogs: (params: { event?: string; status?: string; shop_slug?: string; date_from?: string; date_to?: string; page?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.event) q.set('event', params.event);
    if (params.status) q.set('status', params.status);
    if (params.shop_slug) q.set('shop_slug', params.shop_slug);
    if (params.date_from) q.set('date_from', params.date_from);
    if (params.date_to) q.set('date_to', params.date_to);
    if (params.page) q.set('page', String(params.page));
    return request<WebhookLogsResponse>(`/api/admin/webhook-logs?${q}`);
  },
};
