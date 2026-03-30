import { Send, Info, Heart } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLastUpdated } from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { haptic } from '@/lib/telegram';

const AboutDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-sm rounded-2xl font-body">
      <DialogHeader>
        <DialogTitle className="font-display text-lg">О проекте</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          <span className="text-foreground font-semibold">MinskDvizh</span> — агрегатор событий Минска.
          Собираем концерты, театр, кино, выставки и всё остальное в одном месте.
        </p>
        <div>
          <p className="text-foreground font-medium mb-1">Источники</p>
          <ul className="space-y-0.5 text-xs">
            <li>· relax.by</li>
            <li>· ticketpro.by</li>
            <li>· bezkassira.by</li>
            <li>· bycard.by</li>
          </ul>
        </div>
        <div>
          <p className="text-foreground font-medium mb-1">База обновляется</p>
          <p className="text-xs">Каждую ночь в 06:00 по Минску</p>
        </div>
        <div className="pt-2 border-t border-border/50 space-y-2">
          <p className="text-foreground font-medium">Связь и поддержка</p>
          <a
            href="https://t.me/MinskDvizh_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline text-xs"
          >
            <Send className="h-3.5 w-3.5" />
            @MinskDvizh_bot — Telegram бот
          </a>
          <p className="text-xs">
            Нашли ошибку или хотите добавить источник? Напишите нам в бот.
          </p>
        </div>
        <div className="pt-2 border-t border-border/50">
          <p className="text-foreground font-medium mb-1 flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-red-400" />
            Поддержать проект
          </p>
          <p className="text-xs mb-2">
            Проект некоммерческий. Если хотите помочь с развитием — буду рад.
          </p>
          <a
            href="https://t.me/MinskDvizh_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-black transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
          >
            <Heart className="h-3 w-3" />
            Поддержать
          </a>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

const Footer = () => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const { data: lastUpdated } = useQuery({
    queryKey: ['lastUpdated'],
    queryFn: fetchLastUpdated,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <>
      <footer className="border-t border-border/50 py-8 pb-20 sm:pb-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-sm text-muted-foreground font-body">
              © 2026 <span className="text-primary font-semibold">MinskDvizh</span> — Афиша Минска
            </p>
            <span className="text-xs text-muted-foreground/60 font-body">
              🔄 Обновлено {lastUpdated || 'ежедневно в 06:00'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { haptic('light'); setAboutOpen(true); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground font-body hover:text-foreground transition-colors"
            >
              <Info className="h-4 w-4" />
              О проекте
            </button>
            <a
              href="https://t.me/MinskDvizh_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary font-body font-medium hover:text-accent transition-colors"
            >
              <Send className="h-4 w-4" />
              @MinskDvizh_bot
            </a>
          </div>
        </div>
      </footer>
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
};

export default Footer;
