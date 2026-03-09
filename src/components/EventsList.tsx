import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { type CategorySlug, categories, getCategoryBySlug } from '@/data/events';
import EventGroupCard from './EventGroupCard';
import CategoryTabs from './CategoryTabs';
import { EventSkeletons } from './SkeletonCard';
import type { QuickFilter } from './Hero';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useEvents, useCategoryCounts } from '@/hooks/use-events';
import { haptic, showBackButton, hideBackButton } from '@/lib/telegram';

interface EventsListProps {
  activeCategory: CategorySlug | null;
  onCategoryChange: (slug: CategorySlug | null) => void;
  quickFilter: QuickFilter;
  searchQuery: string;
  debouncedSearch: string;
  calendarDate: Date | null;
  onTotalChange?: (total: number) => void;
}

const EVENTS_PER_PAGE = 10;

const EventsList = ({ activeCategory, onCategoryChange, quickFilter, debouncedSearch, calendarDate, onTotalChange }: EventsListProps) => {
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: counts } = useCategoryCounts(quickFilter, calendarDate);

  const { data, isLoading, isError, refetch } = useEvents({
    quickFilter,
    category: activeCategory,
    search: debouncedSearch || undefined,
    calendarDate,
    page,
    perPage: EVENTS_PER_PAGE,
  });

  // Reset page on filter change & create animation key
  const animationKey = useMemo(() => `${activeCategory}-${quickFilter}-${debouncedSearch}-${calendarDate?.toISOString()}-${page}`, [activeCategory, quickFilter, debouncedSearch, calendarDate, page]);
  useEffect(() => { setPage(1); }, [activeCategory, quickFilter, debouncedSearch, calendarDate]);

  // Telegram back button for filters
  useEffect(() => {
    if (activeCategory || debouncedSearch.trim() || calendarDate) {
      showBackButton(() => {
        onCategoryChange(null);
      });
    } else {
      hideBackButton();
    }
    return () => { hideBackButton(); };
  }, [activeCategory, debouncedSearch, calendarDate, onCategoryChange]);

  const changePage = useCallback((newPage: number) => {
    haptic('soft');
    setPage(newPage);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const grouped = data?.grouped ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  useEffect(() => {
    onTotalChange?.(total);
  }, [total, onTotalChange]);

  const getEmptyState = () => {
    if (debouncedSearch.trim()) {
      return (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-foreground font-body font-semibold mb-2">
            Ничего не нашли по «{debouncedSearch}»
          </p>
          <p className="text-muted-foreground font-body text-sm">
            Попробуйте: концерт, выставка, спектакль
          </p>
        </div>
      );
    }

    if (quickFilter === 'today') {
      return (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-4">😴</p>
          <p className="text-foreground font-body font-semibold mb-2">
            Сегодня тихо. Зато завтра...
          </p>
          <p className="text-muted-foreground font-body text-sm">
            Переключитесь на «Завтра» или «Ближайшие»
          </p>
        </div>
      );
    }

    if (activeCategory) {
      const cat = getCategoryBySlug(activeCategory);
      return (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-4">{cat.emoji}</p>
          <p className="text-foreground font-body font-semibold mb-2">
            Пока нет событий в этой категории
          </p>
          <p className="text-muted-foreground font-body text-sm">
            Попробуйте другой период или категорию
          </p>
        </div>
      );
    }

    return (
      <div className="glass-card p-12 text-center">
        <p className="text-4xl mb-4">📭</p>
        <p className="text-muted-foreground font-body">Событий не найдено</p>
      </div>
    );
  };

  return (
    <div ref={listRef}>
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        counts={counts}
        totalFiltered={total}
      />

      <section className="container mx-auto px-4 pb-24 sm:pb-12">
        <div className="flex flex-col gap-2 mb-6">
          {debouncedSearch.trim() && (
            <p className="text-sm text-muted-foreground font-body">
              Результаты по запросу: <span className="text-accent font-semibold">«{debouncedSearch}»</span>
            </p>
          )}
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-display font-bold">События</h3>
            <span className="text-sm text-muted-foreground font-body">
              Найдено: {total} событий
            </span>
          </div>
        </div>

        {isLoading && <EventSkeletons count={3} />}

        {isError && !isLoading && (
          <div className="glass-card p-12 text-center">
            <p className="text-4xl mb-4">😕</p>
            <p className="text-foreground font-body font-semibold mb-3">
              Не удалось загрузить события
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-body font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Попробовать снова
            </button>
          </div>
        )}

        {!isLoading && !isError && grouped.length === 0 && getEmptyState()}

        {!isLoading && !isError && grouped.length > 0 && (
          <div className="grid gap-4" key={animationKey}>
            {grouped.map((group, i) => (
              <div
                key={group.key}
                className="opacity-0 animate-fade-up"
                style={{
                  animationDelay: `${i * 0.12}s`,
                  animationDuration: '0.5s',
                  animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  animationFillMode: 'forwards',
                }}
              >
                <EventGroupCard group={group} />
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => changePage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg glass-card text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/40 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-body text-muted-foreground">
              <span className="text-foreground font-semibold">{page}</span> / {totalPages}
            </span>
            <button
              onClick={() => changePage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
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
