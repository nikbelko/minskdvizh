import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { X } from 'lucide-react';
import { haptic, isTelegram } from '@/lib/telegram';
import { categories, type CategorySlug } from '@/data/events';
import type { CategoryCounts } from '@/services/api';
import CategoryIcon from './CategoryIcon';

type QuickFilter = 'today' | 'tomorrow' | 'weekend' | 'upcoming';

interface HeroProps {
  activeFilter: QuickFilter;
  onFilterChange: (filter: QuickFilter) => void;
  activeCategory?: CategorySlug | null;
  onCategoryChange?: (slug: CategorySlug | null) => void;
  categoryCounts?: CategoryCounts;
  totalFiltered?: number;
}

const pills: { key: QuickFilter; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'tomorrow', label: 'Завтра' },
  { key: 'weekend', label: 'Выходные' },
  { key: 'upcoming', label: 'Ближайшие' },
];

const TG_BANNER_KEY = 'minskdvizh_tg_banner_dismissed';

const Hero = ({ activeFilter, onFilterChange }: HeroProps) => {
  const today = new Date();
  const dateStr = format(today, "d MMMM yyyy, EEEE", { locale: ru });
  const inTelegram = isTelegram();
  const [tgBannerDismissed, setTgBannerDismissed] = useState(() => {
    try { return sessionStorage.getItem(TG_BANNER_KEY) === 'true'; } catch { return false; }
  });

  const handleFilterClick = (key: QuickFilter) => {
    haptic('light');
    onFilterChange(key);
  };

  const dismissTgBanner = () => {
    setTgBannerDismissed(true);
    try { sessionStorage.setItem(TG_BANNER_KEY, 'true'); } catch {}
  };

  return (
    <section className="relative py-6 pb-2 sm:py-20 md:py-28 overflow-hidden city-grid">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-glow-pulse pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="opacity-0 animate-fade-up hidden sm:block">
          <p className="text-accent font-body font-medium text-sm tracking-widest uppercase mb-4">
            {dateStr}
          </p>
        </div>

        {/* Mobile: just filter pills */}
        <div className="sm:hidden opacity-0 animate-fade-up">
          <div className="flex gap-2">
            {pills.map((pill) => (
              <button
                key={pill.key}
                onClick={() => handleFilterClick(pill.key)}
                className={`flex-1 py-2 rounded-full text-xs font-body font-medium whitespace-nowrap transition-all duration-300 text-center ${
                  activeFilter === pill.key
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'glass-card text-foreground'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: original layout */}
        <h2 className="hidden sm:block opacity-0 animate-fade-up animate-stagger-1 text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.1] mb-8">
          <span className="text-foreground">Что сегодня</span>
          <br />
          <span className="text-primary">в Минске?</span>
        </h2>

        <div className="hidden sm:flex opacity-0 animate-fade-up animate-stagger-2 flex-wrap gap-3">
          {pills.map((pill) => (
            <button
              key={pill.key}
              onClick={() => handleFilterClick(pill.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-300 ${
                activeFilter === pill.key
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'glass-card text-foreground hover:border-primary/40'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Telegram environment banner */}
        {!inTelegram && !tgBannerDismissed && (
          <div className="hidden sm:block opacity-0 animate-fade-up animate-stagger-3 mt-6">
            <div className="glass-card p-3 flex items-center justify-between gap-3 max-w-lg">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg shrink-0">🤖</span>
                <p className="text-sm font-body text-foreground/80 truncate">
                  Также доступно в Telegram
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href="https://t.me/MinskDvizhBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-body font-medium hover:bg-primary/90 transition-colors"
                >
                  Открыть
                </a>
                <button
                  onClick={dismissTgBanner}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
export type { QuickFilter };
