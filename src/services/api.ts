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
  place: string;
  location?: string;
  price?: string;
  category: CategorySlug;
  source_url?: string;
  source_name?: string;
}

export type CategoryCounts = Record<CategorySlug, number>;

function toEventItem(e: ApiEvent): EventItem {
  return {
    id: String(e.id),
    title: e.title || '',
    date: e.event_date || '',
    time: e.show_time || undefined,
    venue: e.place || '',
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

  // Fetch total per category in parallel (per_page=1 to minimize payload)
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
