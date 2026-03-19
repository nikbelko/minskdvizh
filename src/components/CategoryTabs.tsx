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
        {/* All tab */}
        <button
          onClick={() => onCategoryChange(null)}
          className="shrink-0 px-4 py-2 rounded-lg text-sm font-label font-semibold tracking-wide transition-all whitespace-nowrap"
          style={activeCategory === null ? {
            background: 'hsl(185 100% 50% / 0.1)',
            color: 'hsl(185 100% 60%)',
            border: '1px solid hsl(185 100% 50% / 0.35)',
            borderBottomWidth: '2px',
            borderBottomColor: 'hsl(185 100% 50%)',
            boxShadow: '0 0 10px hsl(185 100% 50% / 0.1)',
          } : {
            color: 'hsl(228 10% 55%)',
            border: '1px solid transparent',
          }}
        >
          Все ({Object.values(counts ?? {}).reduce((s: number, n: number) => s + n, 0)})
        </button>

        {categories.map(cat => {
          const count = counts?.[cat.slug] ?? 0;
          if (counts !== undefined && count === 0) return null;
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => onCategoryChange(isActive ? null : cat.slug)}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-label font-semibold tracking-wide transition-all whitespace-nowrap"
              style={isActive ? {
                background: 'hsl(293 80% 52% / 0.1)',
                color: 'hsl(293 80% 72%)',
                border: '1px solid hsl(293 80% 52% / 0.35)',
                borderBottomWidth: '2px',
                borderBottomColor: 'hsl(293 80% 52%)',
                boxShadow: '0 0 10px hsl(293 80% 52% / 0.1)',
              } : {
                color: 'hsl(228 10% 55%)',
                border: '1px solid transparent',
              }}
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
