import { categories, type CategorySlug } from '@/data/events';
import { useCategoryCounts } from '@/hooks/use-events';
import { CategorySkeletons } from './SkeletonCard';

interface CategoryGridProps {
  activeCategory: CategorySlug | null;
  onCategoryClick: (slug: CategorySlug | null) => void;
}

const CategoryGrid = ({ activeCategory, onCategoryClick }: CategoryGridProps) => {
  const { data: counts, isLoading } = useCategoryCounts();

  return (
    <section className="container mx-auto px-4 py-12">
      <h3 className="text-2xl font-display font-bold mb-8 opacity-0 animate-fade-up animate-stagger-3">
        Категории
      </h3>
      {isLoading ? (
        <CategorySkeletons />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const count = counts?.[cat.slug] ?? 0;
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => onCategoryClick(isActive ? null : cat.slug)}
                className={`opacity-0 animate-fade-up animate-stagger-${i + 1} glass-card-hover p-5 text-left group cursor-pointer ${
                  isActive ? 'ring-2 ring-primary border-primary/50' : ''
                }`}
              >
                <span className="text-4xl block mb-3">{cat.emoji}</span>
                <span className="text-foreground font-body font-semibold text-sm block">
                  {cat.name}
                </span>
                <span className="amber-pill mt-2 text-[11px]">{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CategoryGrid;
