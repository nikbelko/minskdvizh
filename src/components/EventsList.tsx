import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { mockEvents, categories, type CategorySlug, groupEvents, type GroupedEvent } from '@/data/events';
import EventGroupCard from './EventGroupCard';
import CategoryTabs from './CategoryTabs';
import { isToday, isTomorrow, isWeekend, parseISO, isAfter, startOfToday, addDays, isSameDay, format } from 'date-fns';
import type { QuickFilter } from './Hero';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EventsListProps {
  activeCategory: CategorySlug | null;
  onCategoryChange: (slug: CategorySlug | null) => void;
  quickFilter: QuickFilter;
  searchQuery: string;
  debouncedSearch: string;
  calendarDate: Date | null;
}

const EVENTS_PER_PAGE = 10;

const EventsList = ({ activeCategory, onCategoryChange, quickFilter, searchQuery, debouncedSearch, calendarDate }: EventsListProps) => {
  const [page, setPage] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter raw events first
  const filtered = useMemo(() => {
    let events = [...mockEvents];
    const today = startOfToday();

    // Calendar date overrides quick filter
    if (calendarDate) {
      events = events.filter(e => isSameDay(parseISO(e.date), calendarDate));
    } else {
      if (quickFilter === 'today') {
        events = events.filter(e => isToday(parseISO(e.date)));
      } else if (quickFilter === 'tomorrow') {
        events = events.filter(e => isTomorrow(parseISO(e.date)));
      } else if (quickFilter === 'weekend') {
        events = events.filter(e => {
          const d = parseISO(e.date);
          return isWeekend(d) && (isAfter(d, today) || isSameDay(d, today));
        });
      } else {
        const limit = addDays(today, 30);
        events = events.filter(e => {
          const d = parseISO(e.date);
          return (isAfter(d, today) || isSameDay(d, today)) && !isAfter(d, limit);
        });
      }
    }

    // Search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (activeCategory) {
      events = events.filter(e => e.category === activeCategory);
    }

    // Sort
    events.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    return events;
  }, [quickFilter, debouncedSearch, activeCategory, calendarDate]);

  // Category counts for tabs (without category filter applied)
  const categoryCounts = useMemo(() => {
    let events = [...mockEvents];
    const today = startOfToday();

    if (calendarDate) {
      events = events.filter(e => isSameDay(parseISO(e.date), calendarDate));
    } else {
      if (quickFilter === 'today') {
        events = events.filter(e => isToday(parseISO(e.date)));
      } else if (quickFilter === 'tomorrow') {
        events = events.filter(e => isTomorrow(parseISO(e.date)));
      } else if (quickFilter === 'weekend') {
        events = events.filter(e => {
          const d = parseISO(e.date);
          return isWeekend(d) && (isAfter(d, today) || isSameDay(d, today));
        });
      } else {
        const limit = addDays(today, 30);
        events = events.filter(e => {
          const d = parseISO(e.date);
          return (isAfter(d, today) || isSameDay(d, today)) && !isAfter(d, limit);
        });
      }
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q)
      );
    }

    return categories.map(cat => ({
      slug: cat.slug,
      count: events.filter(e => e.category === cat.slug).length,
    }));
  }, [quickFilter, debouncedSearch, calendarDate]);

  // Group events
  const grouped = useMemo(() => groupEvents(filtered), [filtered]);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [activeCategory, quickFilter, debouncedSearch, calendarDate]);

  const totalPages = Math.ceil(grouped.length / EVENTS_PER_PAGE);
  const paged = grouped.slice(page * EVENTS_PER_PAGE, (page + 1) * EVENTS_PER_PAGE);

  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div ref={listRef}>
      {/* Category tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        filteredEvents={categoryCounts}
      />

      <section className="container mx-auto px-4 pb-24 sm:pb-12">
        {/* Header with count and search indicator */}
        <div className="flex flex-col gap-2 mb-6">
          {debouncedSearch.trim() && (
            <p className="text-sm text-muted-foreground font-body">
              Результаты по запросу: <span className="text-accent font-semibold">«{debouncedSearch}»</span>
            </p>
          )}
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-display font-bold">
              События
            </h3>
            <span className="text-sm text-muted-foreground font-body">
              Найдено: {grouped.length} событий
            </span>
          </div>
        </div>

        {/* Empty state */}
        {paged.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-4xl mb-4">😕</p>
            {debouncedSearch.trim() ? (
              <div>
                <p className="text-foreground font-body font-semibold mb-2">
                  По запросу «{debouncedSearch}» ничего не найдено
                </p>
                <p className="text-muted-foreground font-body text-sm">
                  Попробуйте другие ключевые слова или выберите другую категорию
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground font-body">Событий не найдено</p>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {paged.map((group, i) => (
              <div key={group.key} className="opacity-0 animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <EventGroupCard group={group} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => changePage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg glass-card text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/40 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-body text-muted-foreground">
              <span className="text-foreground font-semibold">{page + 1}</span> / {totalPages}
            </span>
            <button
              onClick={() => changePage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg glass-card text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/40 transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default EventsList;
