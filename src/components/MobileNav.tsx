import { useState } from 'react';
import { Home, CalendarDays, Search, Grid3X3 } from 'lucide-react';
import { haptic } from '@/lib/telegram';
import { categories } from '@/data/events';
import type { CategorySlug } from '@/data/events';
import CategoryIcon from '@/components/CategoryIcon';

interface MobileNavProps {
  activeTab: 'home' | 'calendar' | 'search' | 'categories';
  onTabChange: (tab: 'home' | 'calendar' | 'search' | 'categories') => void;
  activeCategory: CategorySlug | null;
  onCategorySelect: (slug: CategorySlug | null) => void;
}

const tabs = [
  { key: 'home' as const, icon: Home, label: 'Главная' },
  { key: 'categories' as const, icon: Grid3X3, label: 'Категории' },
  { key: 'calendar' as const, icon: CalendarDays, label: 'Календарь' },
  { key: 'search' as const, icon: Search, label: 'Поиск' },
];

const MobileNav = ({ activeTab, onTabChange, activeCategory, onCategorySelect }: MobileNavProps) => {
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const handleTabChange = (key: typeof tabs[number]['key']) => {
    haptic('light');
    if (key === 'categories') {
      setCategoriesOpen(prev => !prev);
    } else {
      setCategoriesOpen(false);
      onTabChange(key);
    }
  };

  const handleCategoryClick = (slug: CategorySlug) => {
    haptic('medium');
    onCategorySelect(activeCategory === slug ? null : slug);
    setCategoriesOpen(false);
  };

  return (
    <>
      {/* Category bottom sheet */}
      {categoriesOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden animate-in fade-in duration-200"
            onClick={() => setCategoriesOpen(false)}
          />
          {/* Sheet */}
          <div 
            className="fixed bottom-[60px] left-0 right-0 z-50 sm:hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
            style={{ paddingBottom: 'var(--tg-safe-bottom)' }}
          >
            <div 
              className="mx-2 rounded-xl border border-border/50 p-4"
              style={{
                background: 'hsla(var(--glass-bg))',
                borderColor: 'hsla(var(--glass-border))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-display font-bold text-foreground">Категории</h3>
                {activeCategory && (
                  <button 
                    onClick={() => { onCategorySelect(null); setCategoriesOpen(false); }}
                    className="text-xs text-primary hover:underline font-body"
                  >
                    Сбросить
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
                      activeCategory === cat.slug
                        ? 'bg-primary/20 ring-1 ring-primary'
                        : 'hover:bg-secondary/50'
                    }`}
                  >
                    <CategoryIcon slug={cat.slug} size="sm" />
                    <span className="text-[10px] font-body text-foreground truncate w-full text-center">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-card border-t border-border/50 sm:hidden">
        <div className="flex items-center justify-around py-2" style={{ paddingBottom: 'max(0.5rem, var(--tg-safe-bottom))' }}>
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                key === 'categories' && categoriesOpen
                  ? 'text-primary'
                  : activeTab === key
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-body font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
