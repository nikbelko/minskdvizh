import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { type GroupedEvent, getCategoryBySlug } from '@/data/events';
import { ArrowRight, Share2 } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import { toast } from 'sonner';
import { haptic, openLink, showMainButton, hideMainButton } from '@/lib/telegram';

interface EventGroupCardProps {
  group: GroupedEvent;
}

const EventGroupCard = ({ group }: EventGroupCardProps) => {
  const cat = getCategoryBySlug(group.category);

  const formatDate = (dateStr: string) => {
    const d = parseISO(dateStr);
    return format(d, 'dd MMM', { locale: ru }).toUpperCase().replace('.', '');
  };

  const handleShare = async () => {
    haptic('medium');
    const date = group.cinemaDate
      ? formatDate(group.cinemaDate)
      : group.dateTimes?.[0]
      ? formatDate(group.dateTimes[0].date)
      : '';
    const venue = group.venue || group.cinemaShowtimes?.[0]?.venue || '';
    const price = group.price || '';

    let text = `${group.title}`;
    if (date) text += ` — ${date}`;
    if (venue) text += `, ${venue}`;
    if (price) text += `, ${price}`;
    if (group.sourceUrl) text += `\nПодробнее: ${group.sourceUrl}`;
    text += `\n\nАфиша Минска: https://minskdvizh-web.up.railway.app`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Скопировано ✓');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const handleSourceClick = (e: React.MouseEvent) => {
    if (group.sourceUrl) {
      e.preventDefault();
      haptic('medium');
      openLink(group.sourceUrl);
    }
  };

  const handleSourceHover = () => {
    if (group.sourceUrl) {
      showMainButton('🔗 Открыть на сайте', () => openLink(group.sourceUrl!));
    }
  };

  const handleSourceLeave = () => {
    hideMainButton();
  };

  return (
    <div className={`glass-card border-l-4 ${cat.borderClass} p-5 hover:border-l-primary transition-all duration-300 group/card`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-foreground font-body font-bold text-base mb-3 group-hover/card:text-primary transition-colors">
            {group.title}
          </h4>

          {group.category === 'cinema' && group.cinemaDate && (
            <div className="space-y-2">
              <span className="amber-pill text-xs font-bold">
                📅 {formatDate(group.cinemaDate)}
              </span>
              <div className="space-y-1.5 mt-2">
                {group.cinemaShowtimes?.map((st) => (
                  <div key={st.venue} className="text-sm text-muted-foreground font-body">
                    <span className="text-foreground/80">📍 {st.venue}:</span>{' '}
                    <span className="text-accent">{st.times.join(', ')}</span>
                  </div>
                ))}
              </div>
              {group.price && (
                <p className="text-sm text-muted-foreground mt-2 font-body">💰 {group.price}</p>
              )}
            </div>
          )}

          {group.category !== 'cinema' && (
            <div className="space-y-2">
              {group.venue && (
                <p className="text-sm text-muted-foreground font-body">🏢 {group.venue}</p>
              )}
              {group.price && (
                <p className="text-sm text-muted-foreground font-body">💰 {group.price}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-1">
                {group.dateTimes?.map((dt, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm">
                    <span className="amber-pill text-xs font-bold">📅 {formatDate(dt.date)}</span>
                    {dt.time && <span className="text-muted-foreground">⏰ {dt.time}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover/card:opacity-100"
              title="Поделиться"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <CategoryIcon slug={group.category} size="sm" />
          </div>
          {group.sourceUrl && (
            <a
              href={group.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSourceClick}
              onMouseEnter={handleSourceHover}
              onMouseLeave={handleSourceLeave}
              className="flex items-center gap-1 text-xs text-primary font-body font-medium opacity-0 group-hover/card:opacity-100 transition-opacity"
            >
              Подробнее <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventGroupCard;
