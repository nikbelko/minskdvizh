import { Search, X, Bell, BellOff, Zap, UserRound, Plus, Users, BarChart3 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getTelegramUser, haptic } from '@/lib/telegram';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { categories } from '@/data/events';
import CategoryIcon from './CategoryIcon';
import {
  fetchFlashSubscriptions,
  fetchUserAttendingEvents,
  addFlashSubscription,
  removeFlashSubscription,
  type FlashSubscription,
  type UserAttendingEvent,
} from '@/services/api';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  } catch (error) {
    console.error('Ошибка загрузки подписок:', error);
    return [];
  }
}

async function addSubscriptionToAPI(userId: number, category: string, dateType: string = 'upcoming'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/subscriptions/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, category, date_type: dateType }),
    });
    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('Ошибка добавления подписки:', error);
    return false;
  }
}

async function removeSubscriptionFromAPI(userId: number, category: string, dateType: string = 'upcoming'): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/subscriptions/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, category, date_type: dateType }),
    });
    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('Ошибка удаления подписки:', error);
    return false;
  }
}

const NeonLogo = () => (
  <svg
    width="210" height="55"
    viewBox="0 0 480 130"
    xmlns="http://www.w3.org/2000/svg"
    style={{ overflow: 'visible' }}
  >
    <defs>
      <filter id="logo-gp" x="-25%" y="-80%" width="150%" height="360%">
        <feGaussianBlur stdDeviation="3.5" result="b1"/>
        <feGaussianBlur stdDeviation="8" result="b2"/>
        <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="logo-gc" x="-25%" y="-80%" width="150%" height="360%">
        <feGaussianBlur stdDeviation="3.5" result="b1"/>
        <feGaussianBlur stdDeviation="8" result="b2"/>
        <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="logo-pg" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#c026d3" stopOpacity="0.1"/>
        <stop offset="20%"  stopColor="#c026d3" stopOpacity="1"/>
        <stop offset="52%"  stopColor="#00e5ff" stopOpacity="1"/>
        <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.1"/>
      </linearGradient>
      <filter id="logo-gl" x="-5%" y="-600%" width="110%" height="1400%">
        <feGaussianBlur stdDeviation="2.5" result="b1"/>
        <feGaussianBlur stdDeviation="6" result="b2"/>
        <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <text x="34" y="72"
      fontSize="70" fontWeight="700" letterSpacing="-2"
      fontFamily="'Trebuchet MS', Arial, sans-serif"
      fill="none" stroke="#c026d3" strokeWidth="2.2"
      filter="url(#logo-gp)">Minsk</text>
    <text x="218" y="72"
      fontSize="70" fontWeight="700" letterSpacing="-2"
      fontFamily="'Trebuchet MS', Arial, sans-serif"
      fill="none" stroke="#00e5ff" strokeWidth="2.2"
      filter="url(#logo-gc)">Dvizh</text>
    <g filter="url(#logo-gl)">
      <polyline
        points="34,97 198,97 204,90 211,97 215,41 221,97 227,122 233,97 259,97 264,72 269,97 274,107 279,97 464,97"
        fill="none"
        stroke="url(#logo-pg)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

const Header = ({ searchQuery, onSearchChange, onCalendarToggle, calendarOpen }: HeaderProps) => {
  const navigate = useNavigate();
  const [subsOpen, setSubsOpen] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [subs, setSubs] = useState<SubItem[]>([]);
  const [flashSubs, setFlashSubs] = useState<FlashSubscription[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<UserAttendingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const tgUser = getTelegramUser();
  const userId = tgUser?.id;
  const isAdmin = tgUser?.id === 502917728;
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Scroll lock when panel open
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

  // Load subscriptions when panel opens
  useEffect(() => {
    if (subsOpen && userId) {
      setLoading(true);
      Promise.allSettled([
        fetchSubscriptions(userId),
        fetchFlashSubscriptions(userId),
        fetchUserAttendingEvents(userId),
      ]).then(([regularSubs, flashSubsData, attendingData]) => {
        setSubs(regularSubs.status === 'fulfilled' ? regularSubs.value : []);
        setFlashSubs(flashSubsData.status === 'fulfilled' ? flashSubsData.value : []);
        setAttendingEvents(attendingData.status === 'fulfilled' ? attendingData.value : []);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [subsOpen, userId]);

  useEffect(() => {
    const handleHeaderClick = (e: MouseEvent) => {
      if (headerRef.current && headerRef.current.contains(e.target as Node) && subsOpen) {
        const target = e.target as HTMLElement;
        if (!target.closest('button[aria-label="subscriptions"]')) {
          closePanel();
        }
      }
    };
    document.addEventListener('click', handleHeaderClick);
    return () => document.removeEventListener('click', handleHeaderClick);
  }, [subsOpen]);

  const handleClearSearch = () => {
    onSearchChange('');
    haptic('selection');
  };

  const handleSubscribe = async (slug: string, name: string) => {
    if (!userId) { toast.error('Не удалось определить пользователя'); return; }
    if (subs.find(s => s.slug === slug)) { toast.info(`Вы уже подписаны на «${name}»`); return; }
    const success = await addSubscriptionToAPI(userId, slug);
    if (success) {
      setSubs(prev => [...prev, { slug, name }]);
      toast.success(`Подписка на «${name}» оформлена ✓`, { duration: 2000 });
      setAddMode(false);
    } else {
      toast.error('Ошибка при оформлении подписки');
    }
  };

  const handleUnsubscribe = async (slug: string, name: string) => {
    if (!userId) { toast.error('Не удалось определить пользователя'); return; }
    const success = await removeSubscriptionFromAPI(userId, slug);
    if (success) {
      setSubs(prev => prev.filter(s => s.slug !== slug));
      toast.success(`Отписались от «${name}»`, { duration: 2000 });
    } else {
      toast.error('Ошибка при отписке');
    }
  };

  const handleFlashUnsubscribe = async (flashId: number, query: string) => {
    if (!userId) { toast.error('Не удалось определить пользователя'); return; }
    try {
      await removeFlashSubscription(userId, flashId);
      setFlashSubs(prev => prev.filter(f => f.id !== flashId));
      toast.success(`Флеш-подписка «${query}» отменена`, { duration: 2000 });
    } catch {
      toast.error('Ошибка при отписке');
    }
  };

  const handleOpenSubmit = () => {
    closePanel();
    haptic('selection');
    window.dispatchEvent(new CustomEvent('open-submit-event-modal'));
  };

  const handleOpenAdmin = () => {
    closePanel();
    haptic('selection');
    navigate('/admin');
  };

  const closePanel = () => { setSubsOpen(false); setAddMode(false); };

  const totalSubsCount = subs.length + flashSubs.length + attendingEvents.length;

  const glassStyle = {
    background: 'hsla(var(--glass-bg))',
    borderColor: 'hsla(var(--glass-border))',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };

  return (
    <>
      <header ref={headerRef} className="sm:fixed sm:top-0 sm:left-0 sm:right-0 z-40 sm:glass-card sm:border-b sm:border-border/50" style={{ overflow: 'visible' }}>
        <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-0 pb-1 relative" style={{ zIndex: 10, overflow: 'visible' }}>

          {/* Logo */}
          <div className="flex items-center shrink-0" style={{ overflow: 'visible', position: 'relative', zIndex: 2 }}>
            <NeonLogo />
          </div>

          {/* Desktop search */}
          <div className="relative max-w-md w-full hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск событий..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => searchQuery && onSearchChange('')}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}

              className="w-full rounded-lg border border-border bg-secondary/50 py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-body"
            />
            {searchQuery && (
              <button onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Profile button */}
          <button
            aria-label="subscriptions"
            onClick={(e) => {
              e.stopPropagation();
              setSubsOpen(prev => !prev);
              setAddMode(false);
            }}
            className="sm:hidden glass-card flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-medium transition-colors relative flex-shrink-0 text-foreground hover:border-primary/30"
          >
            <UserRound className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <span className="hidden xs:inline">Профиль</span>
            {totalSubsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {totalSubsCount}
              </span>
            )}
          </button>
        </div>

        {/* Gradient underline */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(192,38,211,0) 0%, rgba(192,38,211,0.8) 30%, rgba(0,229,255,0.8) 70%, rgba(0,229,255,0) 100%)', position: 'relative', zIndex: 1 }} />
      </header>

      {/* Subscriptions portal */}
      {subsOpen && createPortal(
        <>
          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideDown { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
          `}</style>
          <div
            className="fixed inset-0 bg-black/40 sm:hidden"
            style={{ zIndex: 999999998, animation: 'fadeIn 0.15s ease-out' }}
            onClick={closePanel}
          />
          <div
            ref={panelRef}
            className="fixed left-0 right-0 top-[50px] sm:hidden"
            style={{ zIndex: 999999999, maxHeight: 'calc(100vh - 50px)', overflowY: 'hidden', pointerEvents: 'none', animation: 'slideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div
              className="mx-3 overflow-y-auto rounded-xl border border-border/50"
              style={{ ...glassStyle, pointerEvents: 'auto', maxHeight: 'calc(100vh - 70px)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3">
                {!addMode ? (
                  <>
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <p className="text-xs text-muted-foreground mt-1">Загрузка...</p>
                      </div>
                    ) : (
                      <>
                        {/* Regular subscriptions */}
                        <div className="space-y-1 mb-2">
                          <div className="flex items-center justify-between gap-2 px-1 mb-1">
                            <div className="flex items-center gap-1.5">
                              <Bell className="h-3 w-3 text-amber-400" />
                              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wide">Мои подписки</p>
                            </div>
                            <button onClick={() => setAddMode(true)} className="text-[10px] text-primary font-body font-medium hover:underline">+ Добавить</button>
                          </div>
                          {subs.length > 0 ? (
                            <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
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
                                    <BellOff className="h-3 w-3" />
                                    <span>Отписаться</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-2.5 py-1.5 rounded-lg bg-secondary/20 text-[10px] text-muted-foreground">
                              Нет активных подписок
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 mb-2">
                          <div className="flex items-center gap-1.5 px-1 mb-1">
                            <Users className="h-3 w-3 text-amber-400" />
                            <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wide">Я иду</p>
                          </div>
                          {attendingEvents.length > 0 ? (
                            <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                              {attendingEvents.map((event) => (
                                <div key={event.event_key} className="px-2.5 py-1.5 rounded-lg bg-secondary/30">
                                  <div className="text-xs font-body text-foreground truncate">{event.title}</div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    {event.event_date}{event.show_time ? ` · ${event.show_time}` : ''}{event.place ? ` · ${event.place}` : ''}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-2.5 py-1.5 rounded-lg bg-secondary/20 text-[10px] text-muted-foreground">
                              Пока нет отмеченных событий
                            </div>
                          )}
                        </div>

                        {/* Flash subscriptions */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 px-1 mb-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-help">
                                  <Zap className="h-3 w-3 text-amber-400" />
                                  <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wide">Флеш-подписки</p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[220px] text-[11px] leading-snug">
                                Уведомление придёт в бот при появлении новых событий
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          {flashSubs.length > 0 ? (
                            <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                              {flashSubs.map(f => (
                                <div
                                  key={f.id}
                                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
                                  style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)' }}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Zap className="h-3 w-3 text-amber-400 shrink-0" />
                                    <span className="text-xs font-body text-foreground truncate">«{f.query}»</span>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleFlashUnsubscribe(f.id, f.query); }}
                                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-400 transition-colors font-body shrink-0 ml-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-2.5 py-1.5 rounded-lg bg-secondary/20 text-[10px] text-muted-foreground">
                              Нет активных флеш-подписок
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 mb-2">
                          <div className="flex items-center justify-between gap-2 px-1 mb-1">
                            <div className="flex items-center gap-1.5">
                              <Plus className="h-3 w-3 text-amber-400" />
                              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wide">Мои события</p>
                            </div>
                            <button onClick={handleOpenSubmit} className="text-[10px] text-primary font-body font-medium hover:underline">+ Добавить</button>
                          </div>
                          <div className="px-2.5 py-1.5 rounded-lg bg-secondary/20 text-[10px] text-muted-foreground">
                            Добавьте своё событие через форму модерации
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 px-1 mb-1">
                              <BarChart3 className="h-3 w-3 text-amber-400" />
                              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wide">Admin</p>
                            </div>
                            <button
                              onClick={handleOpenAdmin}
                              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-secondary/30 text-xs font-body text-foreground hover:bg-secondary/50 transition-colors"
                            >
                              <span>Открыть панель</span>
                              <BarChart3 className="h-3.5 w-3.5 text-primary" />
                            </button>
                          </div>
                        )}

                        {(subs.length > 4 || flashSubs.length > 4 || attendingEvents.length > 4) && (
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
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
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
