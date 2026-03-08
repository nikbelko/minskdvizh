import { Search, X, CalendarDays, Bell } from 'lucide-react';
import { useState } from 'react';
import { getTelegramUser } from '@/lib/telegram';
import { toast } from 'sonner';
import { categories } from '@/data/events';
import CategoryIcon from './CategoryIcon';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCalendarToggle: () => void;
  calendarOpen: boolean;
}

const Header = ({ searchQuery, onSearchChange, onCalendarToggle, calendarOpen }: HeaderProps) => {
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const tgUser = getTelegramUser();

  const handleClearSearch = () => {
    onSearchChange('');
    try {
      const { haptic } = require('@/lib/telegram');
      haptic('selection');
    } catch {}
  };

  const handleSubscribe = (categoryName: string) => {
    toast.success(`Подписка на «${categoryName}» оформлена ✓`, { duration: 2000 });
    setSubscribeOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 sm:glass-card sm:border-b sm:border-border/50 max-sm:border-b-0 max-sm:rounded-none max-sm:bg-[hsl(240_15%_5%/0.95)] max-sm:backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <h1 className="text-2xl font-display font-bold tracking-tight">
              <span className="text-primary">Minsk</span>
              <span className="text-foreground">Dvizh</span>
            </h1>
            <span className="hidden md:inline text-sm text-muted-foreground font-body">
              {tgUser ? `Привет, ${tgUser.first_name}! 👋` : 'Афиша Минска'}
            </span>
          </div>

          {/* Desktop search */}
          <div className="relative max-w-md w-full hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск событий..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary/50 py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-body"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile: subscribe button */}
            <button
              onClick={() => setSubscribeOpen(prev => !prev)}
              className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-medium transition-colors ${
                subscribeOpen
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Подписаться</span>
            </button>
            {/* Desktop: calendar button */}
            <button
              onClick={onCalendarToggle}
              className={`hidden sm:flex p-2 rounded-lg transition-all font-body text-sm items-center gap-2 ${
                calendarOpen
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <CalendarDays className="h-5 w-5" />
              <span className="hidden md:inline">Календарь</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile subscribe dropdown */}
      {subscribeOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40 sm:hidden animate-in fade-in duration-150"
            onClick={() => setSubscribeOpen(false)}
          />
          <div className="fixed top-[57px] left-0 right-0 z-30 px-3 pt-2 sm:hidden animate-in slide-in-from-top-2 fade-in duration-200">
            <div
              className="rounded-xl border border-border/50 p-4"
              style={{
                background: 'hsla(var(--glass-bg))',
                borderColor: 'hsla(var(--glass-border))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <h3 className="text-sm font-display font-bold text-foreground mb-3">Подписаться на рассылку</h3>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleSubscribe(cat.name)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all hover:bg-secondary/50"
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
    </>
  );
};

export default Header;
