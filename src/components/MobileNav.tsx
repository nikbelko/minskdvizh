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
  categoryCounts?: Record<string, number>;
}

const tabs = [
  { key: 'home' as const,       icon: Home,        label: 'Главная' },
  { key: 'categories' as const, icon: Grid3X3,     label: 'Категории' },
  { key: 'calendar' as const,   icon: CalendarDays, label: 'Календарь' },
  { key: 'search' as const,     icon: Search,      label: 'Поиск' },
];

const MobileNav = ({
  activeTab, onTabChange, activeCategory, onCategorySelect,
  searchQuery, onSearchChange, calendarDate, onCalendarDate, categoryCounts,
}: MobileNavProps) => {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const closeAll = () => { setCategoriesOpen(false); setSearchOpen(false); setCalendarOpen(false); };

  const handleTabChange = (key: typeof tabs[number]['key']) => {
    haptic('light');
    if      (key === 'categories') { setSearchOpen(false); setCalendarOpen(false); setCategoriesOpen(p => !p); }
    else if (key === 'calendar')   { setCategoriesOpen(false); setSearchOpen(false); setCalendarOpen(p => !p); }
    else if (key === 'search')     { setCategoriesOpen(false); setCalendarOpen(false); setSearchOpen(p => !p); }
    else                           { closeAll(); onTabChange(key); }
  };

  const handleCategoryClick = (slug: CategorySlug) => {
    haptic('medium');
    onCategorySelect(activeCategory === slug ? null : slug);
    setCategoriesOpen(false);
  };

  const anyOpen = categoriesOpen || searchOpen || calendarOpen;

  useEffect(() => {
    if (anyOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow  = 'hidden';
      document.body.style.position  = 'fixed';
      document.body.style.top       = `-${scrollY}px`;
      document.body.style.width     = '100%';
      return () => {
        document.body.style.overflow  = '';
        document.body.style.position  = '';
        document.body.style.width     = '';
        const top = document.body.style.top;
        document.body.style.top       = '';
        window.scrollTo(0, -parseInt(top || '0'));
      };
    }
  }, [anyOpen]);

  const isActive = (key: string) => {
    if (key === 'categories') return categoriesOpen;
    if (key === 'calendar')   return calendarOpen;
    if (key === 'search')     return searchOpen;
    return activeTab === key;
  };

  const sheetStyle = {
    background: 'hsla(228, 18%, 7%, 0.96)',
    border: '1px solid hsl(293 80% 52% / 0.25)',
    boxShadow: '0 -4px 40px hsl(293 80% 52% / 0.15)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
  };

  return (
    <>
      {/* Backdrop */}
      {anyOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 sm:hidden animate-in fade-in duration-200 touch-none"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={closeAll}
        />
      )}

      {/* Category sheet */}
      {categoriesOpen && (
        <div className="fixed bottom-[60px] left-0 right-0 z-50 sm:hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="mx-2 rounded-xl p-4" style={sheetStyle}>
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-display font-bold"
                style={{ color: 'hsl(185 100% 60%)', textShadow: '0 0 8px hsl(185 100% 50% / 0.4)' }}
              >
                Категории
              </h3>
              {activeCategory && (
                <button
                  onClick={() => { onCategorySelect(null); setCategoriesOpen(false); }}
                  className="text-xs font-label font-semibold tracking-wide"
                  style={{ color: 'hsl(293 80% 72%)' }}
                >
                  Сбросить
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {categories
                .filter(cat => !categoryCounts || (categoryCounts[cat.slug] ?? 0) > 0)
                .map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all"
                    style={activeCategory === cat.slug ? {
                      background: 'hsl(293 80% 52% / 0.15)',
                      border: '1px solid hsl(293 80% 52% / 0.5)',
                      boxShadow: '0 0 10px hsl(293 80% 52% / 0.2)',
                    } : {
                      background: 'hsl(228 18% 11%)',
                      border: '1px solid hsl(228 20% 16%)',
                    }}
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
          <div className="mx-2 rounded-xl p-4" style={sheetStyle}>
            <CalendarView selectedDate={calendarDate} onSelectDate={onCalendarDate} embedded />
          </div>
        </div>
      )}

      {/* Search sheet */}
      {searchOpen && (
        <div className="fixed bottom-[60px] left-0 right-0 z-50 sm:hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="mx-2 rounded-xl p-4" style={sheetStyle}>
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-display font-bold"
                style={{ color: 'hsl(185 100% 60%)' }}
              >
                Поиск событий
              </h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Концерт, театр, выставка..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                autoFocus
                className="w-full rounded-lg py-2.5 pl-10 pr-10 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                style={{
                  background: 'hsl(228 18% 11%)',
                  border: '1px solid hsl(293 80% 52% / 0.3)',
                }}
                onFocus={e => {
                  e.currentTarget.style.border = '1px solid hsl(185 100% 50% / 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 12px hsl(185 100% 50% / 0.15)';
                }}
                onBlur={e => {
                  e.currentTarget.style.border = '1px solid hsl(293 80% 52% / 0.3)';
                  e.currentTarget.style.boxShadow = '';
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => { onSearchChange(''); haptic('selection'); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom nav bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 sm:hidden"
        style={{
          background: 'hsl(228 20% 5% / 0.97)',
          borderTop: '1px solid hsl(293 80% 52% / 0.2)',
          boxShadow: '0 -4px 32px hsl(293 80% 52% / 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Top neon line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(293 80% 52% / 0.5), hsl(185 100% 50% / 0.5), hsl(293 80% 52% / 0.5), transparent)',
          }}
        />

        <div
          className="flex items-center justify-around py-2"
          style={{ paddingBottom: 'max(0.5rem, var(--tg-safe-bottom))' }}
        >
          {tabs.map(({ key, icon: Icon, label }) => {
            const active = isActive(key);
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-90 relative"
                style={active ? {
                  background: 'hsl(293 80% 52% / 0.1)',
                  border: '1px solid hsl(293 80% 52% / 0.25)',
                } : { border: '1px solid transparent' }}
              >
                {/* Glow dot for active */}
                {active && (
                  <span
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, hsl(293 80% 52%), hsl(185 100% 50%))',
                      boxShadow: '0 0 6px hsl(293 80% 52% / 0.7)',
                    }}
                  />
                )}
                <Icon
                  className="h-5 w-5 transition-all duration-200"
                  style={active ? {
                    color: 'hsl(293 80% 72%)',
                    filter: 'drop-shadow(0 0 4px hsl(293 80% 52% / 0.6))',
                    transform: 'scale(1.1)',
                  } : { color: 'hsl(228 10% 45%)' }}
                />
                <span
                  className="text-[10px] font-label font-semibold tracking-wide transition-colors"
                  style={active ? { color: 'hsl(293 80% 72%)' } : { color: 'hsl(228 10% 40%)' }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
