import { categories, type CategorySlug } from '@/data/events';
import type { CategoryCounts } from '@/services/api';
import CategoryIcon from './CategoryIcon';

interface CategoryTabsProps {
  activeCategory: CategorySlug | null;
  onCategoryChange: (slug: CategorySlug | null) => void;
  counts?: CategoryCounts;
  totalFiltered: number;
}

const CategoryTabs = ({ activeCategory, onCategoryChange, counts, totalFiltered }: CategoryTabsProps) => {
  return (
    <div className="hidden sm:block container mx-auto px-4 mb-6">
      <div
        className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button
          onClick={() => onCategoryChange(null)}
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all whitespace-nowrap ${
            activeCategory === null
              ? 'bg-primary/15 text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          }`}
        >
          Все ({Object.values(counts ?? {}).reduce((s: number, n: number) => s + n, 0)})
        </button>
        {categories.map((cat) => {
          const count = counts?.[cat.slug] ?? 0;
          if (count === 0) return null; // скрываем пустые категории
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
              <span className="inline-flex items-center gap-1.5">
                <CategoryIcon slug={cat.slug} size="sm" />
                {cat.name} ({count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;
