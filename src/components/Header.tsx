import { Search, X, CalendarDays, Bell, BellOff } from 'lucide-react';
import { useState, useEffect } from 'react';
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

const STORAGE_KEY = 'minskdvizh_subscriptions';
type SubItem = { slug: string; name: string };

function loadSubs(): SubItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveSubs(subs: SubItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
}

const Header = ({ searchQuery, onSearchChange, onCalendarToggle, calendarOpen }: HeaderProps) => {
  const [subsOpen, setSubsOpen] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [subs, setSubs] = useState<SubItem[]>(loadSubs);
  const tgUser = getTelegramUser();

  useEffect(() => { saveSubs(subs); }, [subs]);

  const handleClearSearch = () => {
    onSearchChange('');
    try { const { haptic } = require('@/lib/telegram'); haptic('selection'); } catch {}
  };

  const handleSubscribe = (slug: string, name: string) => {
    if (subs.find(s => s.slug === slug)) {
      toast.info(`Вы уже подписаны на «${name}»`); return;
    }
    setSubs(prev => [...prev, { slug, name }]);
    toast.success(`Подписка на «${name}» оформлена ✓`, { duration: 2000 });
  };

  const handleUnsubscribe = (slug: string, name: string) => {
    setSubs(prev => prev.filter(s => s.slug !== slug));
    toast.success(`Отписались от «${name}»`, { duration: 2000 });
  };

  const closePanel = () => { setSubsOpen(false); setAddMode(false); };

  const glassStyle = {
    background: 'hsla(var(--glass-bg))',
    borderColor: 'hsla(var(--glass-border))',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };

  return (
    <>
      <header className="sm:sticky sm:top-0 z-40 sm:glass-card sm:border-b sm:border-border/50">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 relative z-10">
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
              <button onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile: subscriptions button */}
            <button
              onClick={() => { setSubsOpen(prev => !prev); setAddMode(false); }}
              className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-medium transition-colors relative ${
                subsOpen ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Подписки</span>
              {subs.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {subs.length}
                </span>
              )}
            </button>
            {/* Desktop: calendar */}
            <button
              onClick={onCalendarToggle}
              className={`hidden sm:flex p-2 rounded-lg transition-all font-body text-sm items-center gap-2 ${
                calendarOpen ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <CalendarDays className="h-5 w-5" />
              <span className="hidden md:inline">Календарь</span>
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {subsOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 sm:hidden animate-in fade-in duration-150 touch-none" onClick={closePanel} />
      )}

      {/* Subscriptions panel */}
      {subsOpen && (
        <div className="fixed top-[57px] left-0 right-0 z-30 px-3 pt-2 sm:hidden animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="rounded-xl border border-border/50 p-3" style={glassStyle}>

            {!addMode ? (
              <>
                {/* Мои подписки */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-display font-bold text-foreground">🔔 Мои подписки</h3>
                  <button onClick={() => setAddMode(true)} className="text-xs text-primary font-body font-medium hover:underline">
                    + Добавить
                  </button>
                </div>

                {subs.length === 0 ? (
                  <div className="text-center py-2">
                    <p className="text-xs text-muted-foreground font-body mb-2">Нет активных подписок</p>
                    <button
                      onClick={() => setAddMode(true)}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-body font-medium"
                    >
                      Подписаться на категорию
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {subs.map(sub => (
                      <div
                        key={sub.slug}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-secondary/30"
                      >
                        <div className="flex items-center gap-1.5">
                          <CategoryIcon slug={sub.slug as any} size="sm" />
                          <span className="text-xs font-body text-foreground">{sub.name}</span>
                        </div>
                        <button
                          onClick={() => handleUnsubscribe(sub.slug, sub.name)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-400 transition-colors font-body shrink-0 ml-2"
                        >
                          <BellOff className="h-3 w-3" />
                          <span>Отписаться</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Добавить подписку */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-display font-bold text-foreground">Выберите категорию</h3>
                  <button onClick={() => setAddMode(false)} className="text-xs text-muted-foreground hover:text-foreground font-body">
                    ← Назад
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {categories.map((cat) => {
                    const isSubscribed = subs.some(s => s.slug === cat.slug);
                    return (
                      <button
                        key={cat.slug}
                        onClick={() => { handleSubscribe(cat.slug, cat.name); setAddMode(false); }}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-all shrink-0 min-w-[64px] ${
                          isSubscribed ? 'bg-primary/20 ring-1 ring-primary opacity-70' : 'hover:bg-secondary/50'
                        }`}
                      >
                        <CategoryIcon slug={cat.slug as any} size="sm" />
                        <span className="text-[10px] font-body text-foreground text-center leading-tight w-full">{cat.name}</span>
                        {isSubscribed && <span className="text-[9px] text-primary font-bold">✓ подписан</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
