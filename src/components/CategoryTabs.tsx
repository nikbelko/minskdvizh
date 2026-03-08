import { categories, type CategorySlug, mockEvents } from '@/data/events';
import { useRef, useEffect } from 'react';

interface CategoryTabsProps {
  activeCategory: CategorySlug | null;
  onCategoryChange: (slug: CategorySlug | null) => void;
  /** Pass filtered event count per category based on current filters */
  filteredEvents: { category: CategorySlug; count: number }[];
}

const CategoryTabs = ({ activeCategory, onCategoryChange, filteredEvents }: CategoryTabsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalCount = filteredEvents.reduce((s, c) => s + c.count, 0);


  return (
    <div className="container mx-auto px-4 mb-6">
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* All tab */}
        <button
          onClick={() => onCategoryChange(null)}
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all whitespace-nowrap ${
            activeCategory === null
              ? 'bg-primary/15 text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          }`}
        >
          Все ({totalCount})
        </button>

        {categories.map((cat) => {
          const count = filteredEvents.find(f => f.slug === cat.slug)?.count ?? 0;
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => onCategoryChange(isActive ? null : cat.slug)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary/15 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {cat.emoji} {cat.name} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;
