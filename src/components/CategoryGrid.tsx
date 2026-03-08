import { categories, type CategorySlug } from '@/data/events';
import { useCategoryCounts } from '@/hooks/use-events';
import { CategorySkeletons } from './SkeletonCard';
import { haptic } from '@/lib/telegram';
import CategoryIcon from './CategoryIcon';

interface CategoryGridProps {
  activeCategory: CategorySlug | null;
  onCategoryClick: (slug: CategorySlug | null) => void;
}

const CategoryGrid = ({ activeCategory, onCategoryClick }: CategoryGridProps) => {
  const { data: counts, isLoading } = useCategoryCounts();

  const handleClick = (slug: CategorySlug, isActive: boolean) => {
    haptic('light');
    onCategoryClick(isActive ? null : slug);
  };

  return (
    <section className="container mx-auto px-4 py-12 hidden sm:block">
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
                onClick={() => handleClick(cat.slug, isActive)}
                className={`opacity-0 animate-fade-up animate-stagger-${i + 1} glass-card-hover p-5 text-left group cursor-pointer ${
                  isActive ? 'ring-2 ring-primary border-primary/50' : ''
                }`}
              >
                <CategoryIcon slug={cat.slug} size="lg" />
                <span className="text-foreground font-body font-semibold text-sm block mt-3">
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
