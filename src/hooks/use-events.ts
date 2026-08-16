import { useQuery } from '@tanstack/react-query';
import { fetchEvents, fetchEventsByFilter, fetchCategoryCounts, fetchCalendarDates, fetchAttendeesSummary, fetchTicketSummary, fetchRatingSummary } from '@/services/api';
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
      const eventKeys = grouped.map((event) => event.ratingKey ?? event.key).filter(Boolean);
      if (eventKeys.length === 0) {
        return { grouped, total: grouped.length };
      }

      try {
        const [attendanceSummary, ticketSummary, ratingSummary] = await Promise.all([
          fetchAttendeesSummary(eventKeys, tgUser?.id),
          fetchTicketSummary(eventKeys, tgUser?.id),
          fetchRatingSummary(eventKeys, tgUser?.id),
        ]);
        const attendanceByKey = new Map(attendanceSummary.map((item) => [item.event_key, item]));
        const ticketByKey = new Map(ticketSummary.map((item) => [item.event_key, item]));
        const ratingByKey = new Map(ratingSummary.map((item) => [item.event_key, item]));
        const enriched = grouped.map((event) => {
          const sharedKey = event.ratingKey ?? event.key;
          const attendance = attendanceByKey.get(event.key);
          const ticket = ticketByKey.get(event.key);
          const rating = ratingByKey.get(sharedKey);
          return {
            ...event,
            attendeeCount: attendance?.count ?? 0,
            currentUserAttending: attendance?.current_user_attending ?? false,
            ratingAverage: rating?.average_score ?? 0,
            ratingVotes: rating?.votes ?? 0,
            currentUserRating: rating?.current_user_score ?? null,
            ticketSellCount: ticket?.sell_count ?? 0,
            ticketBuyCount: ticket?.buy_count ?? 0,
            ticketTotalCount: ticket?.total_count ?? 0,
            currentUserSelling: ticket?.current_user_sell ?? false,
            currentUserBuying: ticket?.current_user_buy ?? false,
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
