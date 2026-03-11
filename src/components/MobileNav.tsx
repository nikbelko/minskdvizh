import { useState, useEffect } from 'react';
import { Home, CalendarDays, Search, Grid3X3, X } from 'lucide-react';
import { haptic } from '@/lib/telegram';
import { categories } from '@/data/events';
import type { CategorySlug } from '@/data/events';
import CategoryIcon from '@/components/CategoryIcon';
import CalendarView from '@/components/CalendarView';

interface MobileNavProps {
  activeTab: 'home' | 'calendar' | 'search' | 'categories';
  onTabChange: (tab: 'home' | 'calendar' | 'search' | 'categories') => void;
  activeCategory: CategorySlug | null;
  onCategorySelect: (slug: CategorySlug | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  calendarDate: Date | null;
  onCalendarDate: (date: Date | null) => void;
}

const tabs = [
  { key: 'home' as const, icon: Home, label: 'Главная' },
  { key: 'categories' as const, icon: Grid3X3, label: 'Категории' },
  { key: 'calendar' as const, icon: CalendarDays, label: 'Календарь' },
  { key: 'search' as const, icon: Search, label: 'Поиск' },
];

const glassStyle = {
  background: 'hsla(var(--glass-bg))',
  borderColor: 'hsla(var(--glass-border))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

const MobileNav = ({ activeTab, onTabChange, activeCategory, onCategorySelect, searchQuery, onSearchChange, calendarDate, onCalendarDate }: MobileNavProps) => {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const closeAll = () => { setCategoriesOpen(false); setSearchOpen(false); setCalendarOpen(false); };

  const handleTabChange = (key: typeof tabs[number]['key']) => {
    haptic('light');
    if (key === 'categories') {
      setSearchOpen(false); setCalendarOpen(false);
      setCategoriesOpen(prev => !prev);
    } else if (key === 'calendar') {
      setCategoriesOpen(false); setSearchOpen(false);
      setCalendarOpen(prev => !prev);
    } else if (key === 'search') {
      setCategoriesOpen(false); setCalendarOpen(false);
      setSearchOpen(prev => !prev);
    } else {
      closeAll();
      onTabChange(key);
    }
  };

  const handleCategoryClick = (slug: CategorySlug) => {
    haptic('medium');
    onCategorySelect(activeCategory === slug ? null : slug);
    setCategoriesOpen(false);
  };

  const anyOpen = categoriesOpen || searchOpen || calendarOpen;

  // Блокируем скролл фона когда открыта любая панель
  useEffect(() => {
    if (anyOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        const top = document.body.style.top;
        document.body.style.top = '';
        window.scrollTo(0, -parseInt(top || '0'));
      };
    }
  }, [anyOpen]);

  const isActive = (key: string) => {
    if (key === 'categories') return categoriesOpen;
    if (key === 'calendar') return calendarOpen;
    if (key === 'search') return searchOpen;
    return activeTab === key;
  };

  return (
    <>
      {/* Backdrop */}
      {anyOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden animate-in fade-in duration-200 touch-none"
          onClick={closeAll}
        />
      )}

      {/* Category sheet */}
      {categoriesOpen && (
        <div className="fixed bottom-[60px] left-0 right-0 z-50 sm:hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="mx-2 rounded-xl border border-border/50 p-4" style={glassStyle}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-display font-bold text-foreground">Категории</h3>
              {activeCategory && (
                <button onClick={() => { onCategorySelect(null); setCategoriesOpen(false); }} className="text-xs text-primary hover:underline font-body">Сбросить</button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
                    activeCategory === cat.slug ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-secondary/50'
                  }`}
                >
                  <CategoryIcon slug={cat.slug} size="sm" />
                  <span className="text-[10px] font-body text-foreground truncate w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calendar sheet */}
      {calendarOpen && (
        <div className="fixed bottom-[60px] left-0 right-0 z-50 sm:hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="mx-2 rounded-xl border border-border/50 p-4" style={glassStyle}>
            <CalendarView selectedDate={calendarDate} onSelectDate={onCalendarDate} embedded />
          </div>
        </div>
      )}

      {/* Search sheet */}
      {searchOpen && (
        <div className="fixed bottom-[60px] left-0 right-0 z-50 sm:hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="mx-2 rounded-xl border border-border/50 p-4" style={glassStyle}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-display font-bold text-foreground">Поиск событий</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Концерт, театр, выставка..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-body"
              />
              {searchQuery && (
                <button
                  onClick={() => { onSearchChange(''); haptic('selection'); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-card border-t border-border/50 sm:hidden">
        <div className="flex items-center justify-around py-2" style={{ paddingBottom: 'max(0.5rem, var(--tg-safe-bottom))' }}>
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-90 ${
                isActive(key)
                  ? 'text-primary scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive(key) ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-body font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
