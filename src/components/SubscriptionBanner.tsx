import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { isTelegram } from '@/lib/telegram';

const DISMISSED_KEY = 'minskdvizh_banner_dismissed';

const SubscriptionBanner = () => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isTelegram()) {
      setDismissed(true);
      return;
    }
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="container mx-auto px-4 pt-6 hidden sm:block">
      <div className="glass-card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl shrink-0">🔔</span>
          <p className="text-sm font-body text-foreground/90 truncate">
            Получайте афишу каждое утро в Telegram
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://t.me/MinskDvizhBot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-body font-medium hover:bg-primary/90 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            Подписаться
          </a>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionBanner;
