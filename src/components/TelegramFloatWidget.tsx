import { useState } from 'react';
import { X } from 'lucide-react';

const TG_WIDGET_KEY = 'minskdvizh_tg_widget_dismissed';

const TelegramFloatWidget = () => {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(TG_WIDGET_KEY) === 'true'; } catch { return false; }
  });

  if (dismissed) return null;

  return (
    <div className="hidden sm:flex fixed bottom-8 left-8 z-50 items-center gap-2 glass-card px-3 py-2 rounded-xl shadow-lg shadow-black/20 animate-fade-up">
      <span className="text-base shrink-0">🤖</span>
      <p className="text-xs font-body text-foreground/80 whitespace-nowrap">Также в Telegram</p>
      <a
        href="https://t.me/MinskDvizh_bot"
        target="_blank"
        rel="noopener noreferrer"
        className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-body font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
      >
        Открыть
      </a>
      <button
        onClick={() => {
          setDismissed(true);
          try { sessionStorage.setItem(TG_WIDGET_KEY, 'true'); } catch {}
        }}
        className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

export default TelegramFloatWidget;
