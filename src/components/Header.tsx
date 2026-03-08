import { Search, X, CalendarDays, Send } from 'lucide-react';
import { useState } from 'react';
import { getTelegramUser } from '@/lib/telegram';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCalendarToggle: () => void;
  calendarOpen: boolean;
}

const Header = ({ searchQuery, onSearchChange, onCalendarToggle, calendarOpen }: HeaderProps) => {
  const tgUser = getTelegramUser();

  const handleClearSearch = () => {
    onSearchChange('');
    try {
      const { haptic } = require('@/lib/telegram');
      haptic('selection');
    } catch {}
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 glass-card">
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
          <a
            href="https://t.me/MinskDvizhBot"
            target="_blank"
            rel="noopener noreferrer"
            className="sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-body font-medium hover:bg-primary/90 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Подписаться</span>
          </a>
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
  );
};

export default Header;
