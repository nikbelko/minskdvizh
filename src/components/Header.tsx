import { Search, X, CalendarDays, Bell, BellOff } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getTelegramUser, haptic } from '@/lib/telegram';
import { toast } from 'sonner';
import { categories } from '@/data/events';
import CategoryIcon from './CategoryIcon';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCalendarToggle: () => void;
  calendarOpen: boolean;
}

type SubItem = {
  slug: string;
  name: string;
  date_type?: string;
};

const API_BASE = 'https://minskdvizh.up.railway.app';

async function fetchSubscriptions(userId: number): Promise<SubItem[]> {
  try {
    const response = await fetch(`${API_BASE}/api/subscriptions?user_id=${userId}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    return data.subscriptions.map((s: any) => ({
      slug: s.category,
      name: categories.find(c => c.slug === s.category)?.name || s.category,
      date_type: s.date_type
    }));
  } catch { return []; }
}

async function addSubscriptionToAPI(userId: number, category: string, dateType = 'upcoming'): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/api/subscriptions/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, category, date_type: dateType }),
    });
    return (await r.json()).ok === true;
  } catch { return false; }
}

async function removeSubscriptionFromAPI(userId: number, category: string, dateType = 'upcoming'): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/api/subscriptions/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, category, date_type: dateType }),
    });
    return (await r.json()).ok === true;
  } catch { return false; }
}

/* ── Pulse SVG line under wordmark ── */
const PulseLine = () => (
  <svg
    viewBox="0 0 72 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: 72, height: 10, display: 'block' }}
  >
    <defs>
      <linearGradient id="plGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="hsl(293,69%,49%)" stopOpacity="0.25" />
        <stop offset="35%"  stopColor="hsl(293,69%,49%)" stopOpacity="1" />
        <stop offset="65%"  stopColor="hsl(185,100%,50%)" stopOpacity="1" />
        <stop offset="100%" stopColor="hsl(185,100%,50%)" stopOpacity="0.25" />
      </linearGradient>
    </defs>
    <polyline
      points="0,5 10,5 14,1.5 17,8.5 20,3 23,7 26,5 40,5 44,1 47,9 50,2.5 53,7.5 56,5 72,5"
      stroke="url(#plGrad)"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: 'drop-shadow(0 0 3px hsl(185,100%,50%,0.65))' }}
    />
  </svg>
);

/* ── Reusable neon gradient rule ── */
const NeonLine = ({ top, bottom, opacity = 0.5 }: { top?: number; bottom?: number; opacity?: number }) => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      left: 0, right: 0,
      top:    top    !== undefined ? top    : undefined,
      bottom: bottom !== undefined ? bottom : undefined,
      height: 1,
      background:
        'linear-gradient(90deg, transparent 0%, hsl(293,69%,49%) 25%, hsl(185,100%,50%) 55%, hsl(293,69%,49%) 80%, transparent 100%)',
      opacity,
      pointerEvents: 'none',
    }}
  />
);

const Header = ({ searchQuery, onSearchChange, onCalendarToggle, calendarOpen }: HeaderProps) => {
  const [subsOpen, setSubsOpen] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [subs, setSubs] = useState<SubItem[]>([]);
  const [loading, setLoading] = useState(false);
  const tgUser = getTelegramUser();
  const userId = tgUser?.id;
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (subsOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflowY = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflowY = '';
        document.body.style.touchAction = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [subsOpen]);

  useEffect(() => {
    if (subsOpen && userId) {
      setLoading(true);
      fetchSubscriptions(userId).then(data => { setSubs(data); setLoading(false); });
    }
  }, [subsOpen, userId]);

  useEffect(() => {
    const handleHeaderClick = (e: MouseEvent) => {
      if (headerRef.current && headerRef.current.contains(e.target as Node) && subsOpen) {
        const target = e.target as HTMLElement;
        if (!target.closest('button[aria-label="subscriptions"]')) closePanel();
      }
    };
    document.addEventListener('click', handleHeaderClick);
    return () => document.removeEventListener('click', handleHeaderClick);
  }, [subsOpen]);

  const handleClearSearch = () => { onSearchChange(''); haptic('selection'); };
  const closePanel = () => { setSubsOpen(false); setAddMode(false); };

  const handleSubscribe = async (slug: string, name: string) => {
    if (!userId) { toast.error('Не удалось определить пользователя'); return; }
    if (subs.find(s => s.slug === slug)) { toast.info(`Вы уже подписаны на «${name}»`); return; }
    const ok = await addSubscriptionToAPI(userId, slug);
    if (ok) { setSubs(prev => [...prev, { slug, name }]); toast.success(`Подписка на «${name}» оформлена ✓`, { duration: 2000 }); setAddMode(false); }
    else toast.error('Ошибка при оформлении подписки');
  };

  const handleUnsubscribe = async (slug: string, name: string) => {
    if (!userId) { toast.error('Не удалось определить пользователя'); return; }
    const ok = await removeSubscriptionFromAPI(userId, slug);
    if (ok) { setSubs(prev => prev.filter(s => s.slug !== slug)); toast.success(`Отписались от «${name}»`, { duration: 2000 }); }
    else toast.error('Ошибка при отписке');
  };

  const glassStyle = {
    background: 'hsla(var(--glass-bg))',
    borderColor: 'hsla(var(--glass-border))',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };

  return (
    <>
      <header
        ref={headerRef}
        className="sm:sticky sm:top-0 z-40 sm:glass-card sm:border-b sm:border-border/50 relative"
      >
        {/* Neon top line */}
        <NeonLine top={0} opacity={0.55} />

        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 relative z-10">

          {/* ── Logo ── */}
          <div className="flex items-center gap-2.5 shrink-0">

            {/* Cat avatar with purple glow halo */}
            <div className="relative shrink-0" style={{ width: 38, height: 38 }}>
              <div style={{
                position: 'absolute',
                inset: -4,
                borderRadius: '50%',
                background: 'radial-gradient(circle, hsl(293,69%,49%,0.3) 0%, transparent 70%)',
                filter: 'blur(4px)',
                pointerEvents: 'none',
              }} />
              <img
                src="/cat-logo.png"
                alt="MinskDvizh cat"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  objectPosition: 'center 15%',
                  border: '1.5px solid hsl(293,69%,49%,0.55)',
                  boxShadow: '0 0 8px hsl(293,69%,49%,0.35), 0 0 18px hsl(293,69%,49%,0.12)',
                  position: 'relative',
                  zIndex: 1,
                  display: 'block',
                }}
              />
            </div>

            {/* Wordmark + pulse line */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ lineHeight: 1 }}>
                <span className="text-xl font-display font-bold tracking-tight text-primary">Minsk</span>
                <span className="text-xl font-display font-bold tracking-tight text-foreground">Dvizh</span>
              </div>
              <PulseLine />
            </div>

            <span className="hidden md:inline text-sm text-muted-foreground font-body ml-1">
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

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              aria-label="subscriptions"
              onClick={(e) => { e.stopPropagation(); setSubsOpen(prev => !prev); setAddMode(false); }}
              className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-medium transition-colors relative ${
                subsOpen ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Подписки</span>
              {subs.length > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: 'hsl(185,100%,42%)', boxShadow: '0 0 6px hsl(185,100%,50%,0.55)' }}
                >
                  {subs.length}
                </span>
              )}
            </button>

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

        {/* Neon bottom line */}
        <NeonLine bottom={0} opacity={0.38} />
      </header>

      {/* ── Subscriptions portal ── */}
      {subsOpen && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/40 sm:hidden animate-in fade-in duration-150"
            style={{ zIndex: 999999998 }}
            onClick={closePanel}
          />
          <div
            ref={panelRef}
            className="fixed left-0 right-0 top-[57px] sm:hidden animate-in slide-in-from-top-2 fade-in duration-200"
            style={{ zIndex: 999999999, maxHeight: 'calc(100vh - 57px)', overflowY: 'hidden', pointerEvents: 'none' }}
          >
            <div
              className="mx-3 overflow-y-auto rounded-xl border border-border/50"
              style={{ ...glassStyle, pointerEvents: 'auto', maxHeight: 'calc(100vh - 70px)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3">
                {!addMode ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-display font-bold text-foreground">🔔 Мои подписки</h3>
                      <button onClick={() => setAddMode(true)} className="text-xs text-primary font-body font-medium hover:underline">+ Добавить</button>
                    </div>
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : subs.length === 0 ? (
                      <div className="text-center py-2">
                        <p className="text-xs text-muted-foreground font-body mb-2">Нет активных подписок</p>
                        <button onClick={() => setAddMode(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-body font-medium">
                          Подписаться на категорию
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1 max-h-[152px] overflow-y-auto pr-1 scrollbar-thin">
                          {subs.map(sub => (
                            <div key={sub.slug} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-secondary/30">
                              <div className="flex items-center gap-1.5">
                                <CategoryIcon slug={sub.slug as any} size="sm" />
                                <span className="text-xs font-body text-foreground">{sub.name}</span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUnsubscribe(sub.slug, sub.name); }}
                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-400 transition-colors font-body shrink-0 ml-2"
                              >
                                <BellOff className="h-3 w-3" /><span>Отписаться</span>
                              </button>
                            </div>
                          ))}
                        </div>
                        {subs.length > 4 && (
                          <div className="text-[10px] text-muted-foreground text-center mt-1.5 font-body border-t border-border/50 pt-1.5">↑ можно скроллить ↑</div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-display font-bold text-foreground">Выберите категорию</h3>
                      <button onClick={() => setAddMode(false)} className="text-xs text-muted-foreground hover:text-foreground font-body">← Назад</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {categories.map((cat) => {
                        const isSubscribed = subs.some(s => s.slug === cat.slug);
                        return (
                          <button
                            key={cat.slug}
                            onClick={() => handleSubscribe(cat.slug, cat.name)}
                            disabled={loading}
                            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-all shrink-0 min-w-[64px] ${
                              isSubscribed ? 'bg-primary/20 ring-1 ring-primary opacity-70' : 'hover:bg-secondary/50'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default Header;