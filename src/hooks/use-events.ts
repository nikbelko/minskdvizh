import { useQuery } from '@tanstack/react-query';
import { fetchEvents, fetchEventsByFilter, fetchCategoryCounts, fetchCalendarDates } from '@/services/api';
import type { CategorySlug } from '@/data/events';
import type { QuickFilter } from '@/components/Hero';
import { format } from 'date-fns';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useEvents(params: {
  quickFilter: QuickFilter;
  category?: CategorySlug | null;
  search?: string;
  calendarDate?: Date | null;
  page?: number;
  perPage?: number;
}) {
  const { quickFilter, category, search, calendarDate, page = 1, perPage = 10 } = params;

  return useQuery({
    queryKey: ['events', quickFilter, category, search, calendarDate?.toISOString(), page],
    queryFn: () => {
      // Calendar date takes priority
      if (calendarDate) {
        return fetchEvents({
          date: format(calendarDate, 'yyyy-MM-dd'),
          category: category || undefined,
          search: search || undefined,
          page,
          per_page: perPage,
        });
      }

      return fetchEventsByFilter(quickFilter, {
        category: category || undefined,
        search: search || undefined,
        page,
        per_page: perPage,
      });
    },
    staleTime: STALE_TIME,
    retry: 2,
  });
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
