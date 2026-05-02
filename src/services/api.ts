import { type CategorySlug, type EventItem, categories } from '@/data/events';

const API_BASE = 'https://minskdvizh.up.railway.app';

export interface ApiEventsResponse {
  total: number;
  page: number;
  per_page: number;
  events: ApiEvent[];
}

export interface ApiEvent {
  id: number;
  title: string;
  details?: string;
  event_date: string;
  show_time?: string;
  end_time?: string;
  place: string;
  location?: string;
  price?: string;
  category: CategorySlug;
  source_url?: string;
  source_name?: string;
}

export type CategoryCounts = Record<CategorySlug, number>;

// ── Flash subscriptions ────────────────────────────────────────────────────

export interface FlashSubscription {
  id: number;
  query: string;
  created_at: string;
}

export interface AdminOverview {
  total_users: number;
  days_alive: number;
  total_actions: number;
  actions_today: number;
  dau: number;
  wau: number;
  mau: number;
  new_today: number;
  new_7d: number;
  new_30d: number;
  webapp_total: number;
  webapp_dau: number;
  webapp_wau: number;
  webapp_mau: number;
  events_count: number;
  subscribers_count: number;
  subscriptions_total: number;
  flash_total: number;
  flash_users: number;
  flash_new_today: number;
  flash_new_30d: number;
  flash_notified_users_30d: number;
  pending_count: number;
  approved_total: number;
  rejected_total: number;
  submitted_period: number;
  submitted_period_no_admin: number;
}

export interface AdminDailyPoint {
  day: string;
  actions: number;
  users: number;
  dau: number;
  new_users: number;
  webapp_users: number;
  submissions: number;
  submissions_no_admin: number;
}

export interface AdminMonthlyPoint {
  month: string;
  actions: number;
  users: number;
  mau: number;
  new_users: number;
  webapp_users: number;
}

export interface CountRow {
  count: number;
  [key: string]: string | number;
}

export interface AdminDashboard {
  generated_at: string;
  period_days: number;
  today_summary: {
    total_users: number;
    total_users_delta: number;
    unique_users_today: number;
    unique_users_delta: number;
    actions_today: number;
    actions_delta: number;
  };
  overview: AdminOverview;
  daily_chart: AdminDailyPoint[];
  monthly_chart: AdminMonthlyPoint[];
  top_actions: { action: string; count: number }[];
  events_by_source: { source_name: string; count: number }[];
  events_by_category: { category: string; count: number }[];
  subscriptions_by_category: { category: string; count: number }[];
  funnel: Record<string, number>;
}

export async function fetchFlashSubscriptions(userId: number): Promise<FlashSubscription[]> {
  const url = new URL('/api/flash-subscriptions', API_BASE);
  url.searchParams.set('user_id', String(userId));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.flash_subscriptions ?? [];
}

export async function addFlashSubscription(userId: number, query: string): Promise<{ ok: boolean; alreadyExists: boolean }> {
  const res = await fetch(`${API_BASE}/api/flash-subscriptions/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, query }),
  });
  if (res.status === 409) return { ok: false, alreadyExists: true };
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return { ok: true, alreadyExists: false };
}

export async function removeFlashSubscription(userId: number, flashId: number): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/flash-subscriptions/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, flash_id: flashId }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return true;
}

// ── Events ─────────────────────────────────────────────────────────────────

function toEventItem(e: ApiEvent): EventItem {
  return {
    id: String(e.id),
    title: e.title || '',
    date: e.event_date || '',
    time: e.show_time || undefined,
    end_time: e.end_time || undefined,
    venue: e.place || '',
    location: e.location || undefined,
    price: e.price || undefined,
    category: e.category,
    description: e.details || undefined,
    sourceUrl: e.source_url || undefined,
    sourceName: e.source_name || undefined,
  };
}

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, API_BASE);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchEvents(params: {
  category?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<{ events: EventItem[]; total: number }> {
  const queryParams: Record<string, string> = {};
  if (params.category) queryParams.category = params.category;
  if (params.date) queryParams.date = params.date;
  if (params.date_from) queryParams.date_from = params.date_from;
  if (params.date_to) queryParams.date_to = params.date_to;
  if (params.search) queryParams.search = params.search;
  if (params.page) queryParams.page = String(params.page);
  if (params.per_page) queryParams.per_page = String(params.per_page);

  const data = await apiFetch<ApiEventsResponse>('/api/events', queryParams);
  return {
    events: data.events.map(toEventItem),
    total: data.total,
  };
}

export async function fetchEventsByFilter(filter: 'today' | 'tomorrow' | 'weekend' | 'upcoming', params?: {
  category?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<{ events: EventItem[]; total: number }> {
  const queryParams: Record<string, string> = {};
  if (params?.category) queryParams.category = params.category;
  if (params?.search) queryParams.search = params.search;
  if (params?.page) queryParams.page = String(params.page);
  if (params?.per_page) queryParams.per_page = String(params.per_page);

  const data = await apiFetch<ApiEventsResponse>(`/api/events/${filter}`, queryParams);
  return {
    events: data.events.map(toEventItem),
    total: data.total,
  };
}

export async function fetchCategoryCounts(filter?: 'today' | 'tomorrow' | 'weekend' | 'upcoming', calendarDate?: string): Promise<CategoryCounts> {
  if (!filter && !calendarDate) {
    return apiFetch<CategoryCounts>('/api/categories/counts');
  }

  const slugs = categories.map(c => c.slug);
  const results = await Promise.all(
    slugs.map(slug => {
      const queryParams: Record<string, string> = { per_page: '1', category: slug };
      if (calendarDate) queryParams.date = calendarDate;
      const path = calendarDate ? '/api/events' : `/api/events/${filter}`;
      return apiFetch<ApiEventsResponse>(path, queryParams)
        .then(data => ({ slug, total: data.total }))
        .catch(() => ({ slug, total: 0 }));
    })
  );

  const counts = {} as CategoryCounts;
  for (const r of results) {
    counts[r.slug] = r.total;
  }
  return counts;
}

export async function fetchCalendarDates(): Promise<string[]> {
  const data = await apiFetch<{ dates: string[] } | string[]>('/api/calendar/dates');
  return Array.isArray(data) ? data : data.dates ?? [];
}

export async function fetchLastUpdated(): Promise<string> {
  try {
    const data = await apiFetch<{ last_updated?: string }>('/api/last-updated');
    return data.last_updated || 'ежедневно в 06:00';
  } catch {
    return 'ежедневно в 06:00';
  }
}

export async function fetchAdminDashboard(userId: number, days = 30, excludeAdmin = true): Promise<AdminDashboard> {
  return apiFetch<AdminDashboard>('/api/admin/dashboard', {
    user_id: String(userId),
    days: String(days),
    exclude_admin: excludeAdmin ? 'true' : 'false',
  });
}
