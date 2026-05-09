import { useQuery } from '@tanstack/react-query';
import { fetchEvents, fetchEventsByFilter, fetchCategoryCounts, fetchCalendarDates, fetchAttendeesSummary } from '@/services/api';
import { groupEvents } from '@/data/events';
import type { CategorySlug } from '@/data/events';
import type { QuickFilter } from '@/components/Hero';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { getTelegramUser } from '@/lib/telegram';

const STALE_TIME = 5 * 60 * 1000;

export function useEvents(params: {
  quickFilter: QuickFilter;
  category?: CategorySlug | null;
  search?: string;
  calendarDate?: Date | null;
}) {
  const { quickFilter, category, search, calendarDate } = params;
  const tgUser = getTelegramUser();

  // Fetch ALL raw events (per_page=500)
  const query = useQuery({
    queryKey: ['events-all', search ? `search:${search}` : quickFilter, category, calendarDate?.toISOString(), tgUser?.id],
    queryFn: async () => {
      // При поиске — ищем по всем будущим событиям (как в боте: title + details + place)
      let response;
      if (search && search.trim().length >= 2) {
        response = await fetchEvents({
          category: category || undefined,
          search: search.trim(),
          page: 1,
          per_page: 500,
        });
      } else if (calendarDate) {
        response = await fetchEvents({
          date: format(calendarDate, 'yyyy-MM-dd'),
          category: category || undefined,
          page: 1,
          per_page: 500,
        });
      } else {
        response = await fetchEventsByFilter(quickFilter, {
          category: category || undefined,
          page: 1,
          per_page: 500,
        });
      }

      const grouped = groupEvents(response.events);
      const eventKeys = grouped.map((event) => event.key).filter(Boolean);
      if (eventKeys.length === 0) {
        return { grouped, total: grouped.length };
      }

      try {
        const summary = await fetchAttendeesSummary(eventKeys, tgUser?.id);
        const summaryByKey = new Map(summary.map((item) => [item.event_key, item]));
        const enriched = grouped.map((event) => {
          const row = summaryByKey.get(event.key);
          return {
            ...event,
            attendeeCount: row?.count ?? 0,
            currentUserAttending: row?.current_user_attending ?? false,
          };
        });
        return { grouped: enriched, total: enriched.length };
      } catch {
        return { grouped, total: grouped.length };
      }
    },
    staleTime: STALE_TIME,
    retry: 2,
  });

  const data = useMemo(() => query.data, [query.data]);

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
