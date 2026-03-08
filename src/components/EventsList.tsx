import { useMemo, useState } from 'react';
import { mockEvents, categories, type CategorySlug } from '@/data/events';
import EventCard from './EventCard';
import { isToday, isTomorrow, isWeekend, parseISO, isAfter, startOfToday } from 'date-fns';
import type { QuickFilter } from './Hero';

interface EventsListProps {
  activeCategory: CategorySlug | null;
  quickFilter: QuickFilter;
  searchQuery: string;
}

const EVENTS_PER_PAGE = 10;

const EventsList = ({ activeCategory, quickFilter, searchQuery }: EventsListProps) => {
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let events = [...mockEvents];

    // Category filter
    if (activeCategory) {
      events = events.filter(e => e.category === activeCategory);
    }

    // Quick filter
    const today = startOfToday();
    if (quickFilter === 'today') {
      events = events.filter(e => isToday(parseISO(e.date)));
    } else if (quickFilter === 'tomorrow') {
      events = events.filter(e => isTomorrow(parseISO(e.date)));
    } else if (quickFilter === 'weekend') {
      events = events.filter(e => isWeekend(parseISO(e.date)) && isAfter(parseISO(e.date), today));
    } else {
      events = events.filter(e => isAfter(parseISO(e.date), today) || isToday(parseISO(e.date)));
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q)
      );
    }

    // Sort by date
    events.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    return events;
  }, [activeCategory, quickFilter, searchQuery]);

  // Reset page when filters change
  useMemo(() => setPage(0), [activeCategory, quickFilter, searchQuery]);

  const totalPages = Math.ceil(filtered.length / EVENTS_PER_PAGE);
  const paged = filtered.slice(page * EVENTS_PER_PAGE, (page + 1) * EVENTS_PER_PAGE);

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-display font-bold">
          События
          <span className="text-muted-foreground text-lg ml-2 font-body font-normal">
            ({filtered.length})
          </span>
        </h3>
      </div>

      {paged.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-muted-foreground font-body">Событий не найдено</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {paged.map((event, i) => (
            <div key={event.id} className="opacity-0 animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-10 h-10 rounded-lg text-sm font-body font-medium transition-all ${
                page === i
                  ? 'bg-primary text-primary-foreground'
                  : 'glass-card text-foreground hover:border-primary/40'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default EventsList;
