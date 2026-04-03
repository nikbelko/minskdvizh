import { Info, Heart, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLastUpdated, fetchCategoryCounts } from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { haptic } from '@/lib/telegram';
import { categories } from '@/data/events';
import CategoryIcon from './CategoryIcon';

const AboutDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { data: counts } = useQuery({
    queryKey: ['categoryCounts'],
    queryFn: () => fetchCategoryCounts(),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const totalEvents = counts ? Object.values(counts).reduce((s, n) => s + n, 0) : null;

  return (
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

          {/* Категории с иконками */}
          {counts && (
            <div>
              <p className="text-foreground font-medium mb-2">
                Событий в базе{totalEvents ? `: ${totalEvents}` : ''}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {categories.filter(cat => (counts[cat.slug] ?? 0) > 0).map(cat => (
                  <div key={cat.slug} className="flex items-center gap-2">
                    <CategoryIcon slug={cat.slug} size="sm" />
                    <span className="text-xs">
                      <span className="text-foreground">{cat.name}</span>
                      <span className="text-muted-foreground/60 ml-1">{counts[cat.slug]}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-foreground font-medium mb-1">Источники</p>
            <ul className="space-y-0.5 text-xs">
              <li>· relax.by</li>
              <li>· ticketpro.by</li>
              <li>· bezkassira.by</li>
              <li>· bycard.by</li>
            </ul>
          </div>
          <div className="pt-2 border-t border-border/50 space-y-2">
            <p className="text-foreground font-medium">Связь и поддержка</p>
            <p className="text-xs">
              Нашли ошибку или хотите добавить источник? Напишите нам в бот.
            </p>
            <p className="text-xs">
              Для сотрудничества:{' '}
              <a
                href="https://t.me/i354444"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @i354444
              </a>
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
              href="https://t.me/MinskDvizh_bot?start=support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #c026d3, #7c3aed)' }}
            >
              <Heart className="h-3 w-3" />
              Поддержать
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
            <span className="text-xs text-muted-foreground/60 font-body flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Обновлено {lastUpdated || 'ежедневно в 06:00'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { haptic('light'); setAboutOpen(true); }}
              className="flex items-center gap-1.5 text-sm font-body font-medium transition-colors hover:opacity-80"
              style={{ color: '#c026d3' }}
            >
              <Info className="h-4 w-4" />
              О проекте
            </button>
          </div>
        </div>
      </footer>
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
};

export default Footer;
