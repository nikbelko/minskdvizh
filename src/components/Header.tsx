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

/* ── Inline SVG logo: cat + pulse ── */
const LogoIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Cat ears */}
    <path d="M6 14 L10 7 L14 14" fill="hsl(293 80% 52%)" opacity="0.9"/>
    <path d="M22 14 L26 7 L30 14" fill="hsl(293 80% 52%)" opacity="0.9"/>
    {/* Inner ear highlight */}
    <path d="M7.5 13 L10 8.5 L12.5 13" fill="hsl(316 100% 60%)" opacity="0.6"/>
    <path d="M23.5 13 L26 8.5 L28.5 13" fill="hsl(316 100% 60%)" opacity="0.6"/>
    {/* Head */}
    <ellipse cx="18" cy="20" rx="10" ry="9" fill="hsl(228 18% 14%)"/>
    <ellipse cx="18" cy="20" rx="10" ry="9" stroke="hsl(293 80% 52%)" strokeWidth="1" opacity="0.8"/>
    {/* VR/Goggles */}
    <rect x="9" y="16" width="18" height="7" rx="3.5" fill="hsl(185 100% 50% / 0.15)" stroke="hsl(185 100% 50%)" strokeWidth="1"/>
    {/* Goggle lenses */}
    <rect x="10.5" y="17" width="6" height="5" rx="2" fill="hsl(185 100% 50% / 0.25)" stroke="hsl(185 100% 50% / 0.6)" strokeWidth="0.5"/>
    <rect x="19.5" y="17" width="6" height="5" rx="2" fill="hsl(185 100% 50% / 0.25)" stroke="hsl(185 100% 50% / 0.6)" strokeWidth="0.5"/>
    {/* Pulse waveform on goggles */}
    <polyline points="11,19.5 12,19.5 12.5,18 13,21 13.5,18.5 14.5,19.5 15.5,19.5" stroke="hsl(185 100% 60%)" strokeWidth="0.7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="20.5,19.5 21.5,19.5 22,18 22.5,21 23,18.5 24,19.5 25,19.5" stroke="hsl(185 100% 60%)" strokeWidth="0.7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Nose */}
    <ellipse cx="18" cy="24" rx="1.2" ry="0.8" fill="hsl(316 100% 70%)"/>
    {/* Whiskers */}
    <line x1="9" y1="23" x2="15" y2="23.5" stroke="hsl(228 10% 70%)" strokeWidth="0.5" opacity="0.6"/>
    <line x1="9" y1="24.5" x2="15" y2="24.5" stroke="hsl(228 10% 70%)" strokeWidth="0.5" opacity="0.6"/>
    <line x1="21" y1="23.5" x2="27" y2="23" stroke="hsl(228 10% 70%)" strokeWidth="0.5" opacity="0.6"/>
    <line x1="21" y1="24.5" x2="27" y2="24.5" stroke="hsl(228 10% 70%)" strokeWidth="0.5" opacity="0.6"/>
  </svg>
);

/* ── SVG Pulse line for logo ── */
const PulseLine = () => (
  <svg viewBox="0 0 80 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-3">
    <polyline
      points="0,7 12,7 16,2 20,12 24,4 28,10 32,7 46,7 50,1 54,13 58,5 62,9 66,7 80,7"
      stroke="url(#pulseGrad)"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        strokeDasharray: 200,
        strokeDashoffset: 0,
        filter: 'drop-shadow(0 0 3px hsl(185 100% 50% / 0.8))',
      }}
    />
    <defs>
      <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="hsl(293 80% 52%)" stopOpacity="0.4"/>
        <stop offset="40%" stopColor="hsl(293 80% 52%)"/>
        <stop offset="60%" stopColor="hsl(185 100% 50%)"/>
        <stop offset="100%" stopColor="hsl(185 100% 50%)" stopOpacity="0.4"/>
      </linearGradient>
    </defs>
  </svg>
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
    background: 'hsla(228, 18%, 7%, 0.92)',
    borderColor: 'hsl(293 80% 52% / 0.2)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };

  return (
    <>
      <header
        ref={headerRef}
        className="sm:sticky sm:top-0 z-40 relative"
        style={{
          background: 'linear-gradient(180deg, hsl(228 20% 5% / 0.98) 0%, hsl(228 20% 4% / 0.95) 100%)',
          borderBottom: '1px solid hsl(293 80% 52% / 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Top neon accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, hsl(293 80% 52%) 30%, hsl(185 100% 50%) 60%, hsl(293 80% 52%) 80%, transparent 100%)',
            opacity: 0.6,
          }}
        />

        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 relative z-10">
          {/* ── Logo ── */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Cat icon */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-md animate-glow-pulse"
                style={{ background: 'hsl(293 80% 52% / 0.3)', transform: 'scale(1.3)' }}
              />
              <LogoIcon className="relative w-9 h-9 z-10" />
            </div>

            {/* Wordmark + pulse */}
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline gap-0">
                <span
                  className="text-xl font-display font-800 tracking-tight"
                  style={{
                    color: 'hsl(293 80% 72%)',
                    textShadow: '0 0 12px hsl(293 80% 52% / 0.7), 0 0 32px hsl(293 80% 52% / 0.3)',
                    fontWeight: 800,
                  }}
                >
                  Minsk
                </span>
                <span
                  className="text-xl font-display font-800 tracking-tight"
                  style={{
                    color: 'hsl(185 100% 65%)',
                    textShadow: '0 0 12px hsl(185 100% 50% / 0.7), 0 0 32px hsl(185 100% 50% / 0.3)',
                    fontWeight: 800,
                  }}
                >
                  Dvizh
                </span>
              </div>
              <PulseLine />
            </div>

            {/* Greeting - desktop only */}
            {tgUser && (
              <span className="hidden md:inline text-xs text-muted-foreground font-body ml-2 opacity-70">
                Привет, {tgUser.first_name} 👾
              </span>
            )}
          </div>

          {/* Desktop search */}
          <div className="relative max-w-md w-full hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск событий..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full rounded-lg py-2 pl-10 pr-10 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
              style={{
                background: 'hsl(228 18% 10% / 0.8)',
                border: '1px solid hsl(293 80% 52% / 0.2)',
              }}
              onFocus={e => {
                e.currentTarget.style.border = '1px solid hsl(185 100% 50% / 0.5)';
                e.currentTarget.style.boxShadow = '0 0 12px hsl(185 100% 50% / 0.15)';
              }}
              onBlur={e => {
                e.currentTarget.style.border = '1px solid hsl(293 80% 52% / 0.2)';
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

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile: subscriptions */}
            <button
              aria-label="subscriptions"
              onClick={e => { e.stopPropagation(); setSubsOpen(p => !p); setAddMode(false); }}
              className="sm:hidden relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-label font-semibold tracking-wide transition-all"
              style={{
                background: subsOpen
                  ? 'linear-gradient(135deg, hsl(293 80% 52%), hsl(270 90% 50%))'
                  : 'hsl(293 80% 52% / 0.15)',
                border: '1px solid hsl(293 80% 52% / 0.5)',
                color: subsOpen ? 'white' : 'hsl(293 80% 72%)',
                boxShadow: subsOpen ? '0 0 12px hsl(293 80% 52% / 0.4)' : '0 0 8px hsl(293 80% 52% / 0.15)',
              }}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Подписки</span>
              {subs.length > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: 'hsl(185 100% 45%)', boxShadow: '0 0 6px hsl(185 100% 50% / 0.6)' }}
                >
                  {subs.length}
                </span>
              )}
            </button>

            {/* Desktop: calendar */}
            <button
              onClick={onCalendarToggle}
              className="hidden sm:flex p-2.5 rounded-lg transition-all items-center gap-2 text-sm font-label font-semibold tracking-wide"
              style={calendarOpen ? {
                background: 'hsl(185 100% 50% / 0.15)',
                border: '1px solid hsl(185 100% 50% / 0.5)',
                color: 'hsl(185 100% 60%)',
                boxShadow: '0 0 10px hsl(185 100% 50% / 0.2)',
              } : {
                background: 'transparent',
                border: '1px solid hsl(228 20% 20%)',
                color: 'hsl(228 10% 60%)',
              }}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden md:inline">Календарь</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Subscriptions portal ── */}
      {subsOpen && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/50 sm:hidden animate-in fade-in duration-150"
            style={{ zIndex: 999999998 }}
            onClick={closePanel}
          />
          <div
            ref={panelRef}
            className="fixed left-0 right-0 top-[57px] sm:hidden animate-in slide-in-from-top-2 fade-in duration-200"
            style={{ zIndex: 999999999, maxHeight: 'calc(100vh - 57px)', overflowY: 'hidden', pointerEvents: 'none' }}
          >
            <div
              className="mx-3 overflow-y-auto rounded-xl"
              style={{
                ...glassStyle,
                border: '1px solid hsl(293 80% 52% / 0.3)',
                boxShadow: '0 8px 32px hsl(293 80% 52% / 0.15)',
                pointerEvents: 'auto',
                maxHeight: 'calc(100vh - 70px)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-3">
                {!addMode ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-display font-bold" style={{ color: 'hsl(185 100% 60%)', textShadow: '0 0 8px hsl(185 100% 50% / 0.4)' }}>
                        🔔 Мои подписки
                      </h3>
                      <button
                        onClick={() => setAddMode(true)}
                        className="text-xs font-label font-semibold tracking-wide transition-colors"
                        style={{ color: 'hsl(293 80% 72%)' }}
                      >
                        + Добавить
                      </button>
                    </div>
                    {loading ? (
                      <div className="text-center py-4">
                        <div
                          className="inline-block h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
                          style={{ borderColor: 'hsl(293 80% 52% / 0.3)', borderTopColor: 'hsl(293 80% 52%)' }}
                        />
                      </div>
                    ) : subs.length === 0 ? (
                      <div className="text-center py-2">
                        <p className="text-xs text-muted-foreground font-body mb-2">Нет активных подписок</p>
                        <button
                          onClick={() => setAddMode(true)}
                          className="px-3 py-1.5 rounded-lg text-xs font-label font-semibold tracking-wide text-white"
                          style={{ background: 'linear-gradient(135deg, hsl(293 80% 52%), hsl(270 90% 50%))', boxShadow: '0 0 10px hsl(293 80% 52% / 0.3)' }}
                        >
                          Подписаться
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-[152px] overflow-y-auto pr-1 scrollbar-thin">
                        {subs.map(sub => (
                          <div
                            key={sub.slug}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
                            style={{ background: 'hsl(293 80% 52% / 0.08)', border: '1px solid hsl(293 80% 52% / 0.15)' }}
                          >
                            <div className="flex items-center gap-1.5">
                              <CategoryIcon slug={sub.slug as any} size="sm" />
                              <span className="text-xs font-body text-foreground">{sub.name}</span>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); handleUnsubscribe(sub.slug, sub.name); }}
                              className="flex items-center gap-1 text-[10px] font-body shrink-0 ml-2 transition-colors hover:opacity-80"
                              style={{ color: 'hsl(228 10% 50%)' }}
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
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-display font-bold" style={{ color: 'hsl(185 100% 60%)' }}>
                        Выберите категорию
                      </h3>
                      <button
                        onClick={() => setAddMode(false)}
                        className="text-xs text-muted-foreground hover:text-foreground font-body"
                      >
                        ← Назад
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {categories.map(cat => {
                        const isSubscribed = subs.some(s => s.slug === cat.slug);
                        return (
                          <button
                            key={cat.slug}
                            onClick={() => handleSubscribe(cat.slug, cat.name)}
                            disabled={loading}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-all shrink-0 min-w-[64px]"
                            style={isSubscribed ? {
                              background: 'hsl(293 80% 52% / 0.15)',
                              border: '1px solid hsl(293 80% 52% / 0.5)',
                              opacity: 0.7,
                            } : {
                              background: 'hsl(228 18% 10% / 0.6)',
                              border: '1px solid hsl(228 20% 20%)',
                            }}
                          >
                            <CategoryIcon slug={cat.slug as any} size="sm" />
                            <span className="text-[10px] font-body text-foreground text-center leading-tight w-full">{cat.name}</span>
                            {isSubscribed && (
                              <span className="text-[9px] font-label font-bold" style={{ color: 'hsl(185 100% 50%)' }}>✓ подписан</span>
                            )}
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
