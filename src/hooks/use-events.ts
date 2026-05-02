import { useQuery } from '@tanstack/react-query';
import { fetchEvents, fetchEventsByFilter, fetchCategoryCounts, fetchCalendarDates } from '@/services/api';
import { groupEvents } from '@/data/events';
import type { CategorySlug } from '@/data/events';
import type { QuickFilter } from '@/components/Hero';
import { format } from 'date-fns';
import { useMemo } from 'react';

const STALE_TIME = 5 * 60 * 1000;

export function useEvents(params: {
  quickFilter: QuickFilter;
  category?: CategorySlug | null;
  search?: string;
  calendarDate?: Date | null;
}) {
  const { quickFilter, category, search, calendarDate } = params;

  // Fetch ALL raw events (per_page=500)
  const query = useQuery({
    queryKey: ['events-all', search ? `search:${search}` : quickFilter, category, calendarDate?.toISOString()],
    queryFn: () => {
      // При поиске — ищем по всем будущим событиям (как в боте: title + details + place)
      if (search && search.trim().length >= 2) {
        return fetchEvents({
          category: category || undefined,
          search: search.trim(),
          page: 1,
          per_page: 500,
        });
      }
      if (calendarDate) {
        return fetchEvents({
          date: format(calendarDate, 'yyyy-MM-dd'),
          category: category || undefined,
          page: 1,
          per_page: 500,
        });
      }
      return fetchEventsByFilter(quickFilter, {
        category: category || undefined,
        page: 1,
        per_page: 500,
      });
    },
    staleTime: STALE_TIME,
    retry: 2,
  });

  // Client-side grouping
  const data = useMemo(() => {
    if (!query.data) return undefined;
    const grouped = groupEvents(query.data.events);
    return {
      grouped,
      total: grouped.length,
    };
  }, [query.data]);

  return {
    ...query,
    data,
  };
}

export function useCategoryCounts(quickFilter?: QuickFilter, calendarDate?: Date | null) {
  const dateStr = calendarDate ? format(calendarDate, 'yyyy-MM-dd') : undefined;
  return useQuery({
    queryKey: ['categoryCounts', quickFilter, dateStr],
    queryFn: () => fetchCategoryCounts(
      calendarDate ? undefined : quickFilter,
      dateStr,
    ),
    staleTime: STALE_TIME,
  });
}

export function useCalendarDates() {
  return useQuery({
    queryKey: ['calendarDates'],
    queryFn: fetchCalendarDates,
    staleTime: STALE_TIME,
  });
}
