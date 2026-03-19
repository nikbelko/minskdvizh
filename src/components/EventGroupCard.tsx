import { type GroupedEvent, getCategoryBySlug } from '@/data/events';
import { ArrowRight, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import { toast } from 'sonner';
import { haptic, openLink, showMainButton, hideMainButton } from '@/lib/telegram';
import { useState } from 'react';

interface EventGroupCardProps {
  group: GroupedEvent;
}

const EventGroupCard = ({ group }: EventGroupCardProps) => {
  const cat = getCategoryBySlug(group.category);
  const cinemaCount = group.cinemaShowtimes?.length ?? 0;
  const [showTimes, setShowTimes] = useState(cinemaCount <= 1);

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '');
  };

  const handleShare = async () => {
    haptic('medium');
    const emoji = cat.emoji;
    const lines: string[] = [];
    lines.push(`${emoji} ${group.title}`);
    if (group.category === 'cinema' && group.cinemaDate) {
      const dateStr = new Date(group.cinemaDate + 'T00:00:00')
        .toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
      lines.push(`📅 ${dateStr}`);
      group.cinemaShowtimes?.forEach(st => {
        lines.push(`📍 ${st.venue}: ${st.times.join(', ')}`);
      });
    } else {
      if (group.dateTimeGroups?.[0]?.dateRanges?.length) {
        lines.push(`📅 ${group.dateTimeGroups[0].dateRanges.join(', ')}`);
      }
      if (group.dateTimeGroups?.[0]?.time) lines.push(`⏰ ${group.dateTimeGroups[0].time}`);
      if (group.venue) lines.push(`🏢 ${group.venue}`);
    }
    if (group.price) lines.push(`💰 ${group.price}`);
    if (group.sourceUrl) lines.push(`🔗 ${group.sourceUrl}`);
    lines.push(`\nАфиша Минска @MinskDvizhBot`);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast.success('Скопировано ✓');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const handleSourceClick = (e: React.MouseEvent) => {
    if (group.sourceUrl) { e.preventDefault(); haptic('medium'); openLink(group.sourceUrl); }
  };
  const handleSourceHover = () => {
    if (group.sourceUrl) showMainButton('🔗 Открыть на сайте', () => openLink(group.sourceUrl!));
  };
  const handleSourceLeave = () => { hideMainButton(); };

  return (
    <div className={`glass-card border-l-4 ${cat.borderClass} p-4 hover:border-l-primary transition-all duration-300 group/card`}>

      {/* Title row: full width, icon+share top-right */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="text-foreground font-body font-bold text-base group-hover/card:text-primary transition-colors flex-1 min-w-0 pr-1">
          {group.title}
        </h4>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={handleShare}
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover/card:opacity-100"
            title="Поделиться">
            <Share2 className="h-4 w-4" />
          </button>
          <CategoryIcon slug={group.category} size="sm" />
        </div>
      </div>

      {/* Cinema — full width for showtimes */}
      {group.category === 'cinema' && group.cinemaDate && (
        <div className="space-y-2">
          <span className="amber-pill text-xs font-bold">📅 {formatDateShort(group.cinemaDate)}</span>
          {cinemaCount > 1 && (
            <button onClick={() => { haptic('light'); setShowTimes(p => !p); }}
              className="flex items-center gap-1.5 text-xs text-primary font-body font-medium mt-1 hover:opacity-80 transition-opacity">
              {showTimes ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showTimes ? 'Скрыть сеансы' : `Сеансы (${cinemaCount} ${cinemaCount <= 4 ? 'кинотеатра' : 'кинотеатров'})`}
            </button>
          )}
          {showTimes && (
            <div className="space-y-1 mt-1 pl-2 border-l-2 border-primary/30">
              {group.cinemaShowtimes?.map((st) => (
                <div key={st.venue} className="text-sm font-body leading-snug">
                  <span className="text-foreground/80">📍 {st.venue}:</span>
                  <span className="text-accent ml-1">{st.times.join(', ')}</span>
                </div>
              ))}
            </div>
          )}
          {group.price && <p className="text-sm text-muted-foreground font-body">💰 {group.price}</p>}
        </div>
      )}

      {/* Other categories */}
      {group.category !== 'cinema' && (
        <div className="space-y-1.5">
          {group.venue && <p className="text-sm text-muted-foreground font-body">🏢 {group.venue}</p>}
          {group.price && <p className="text-sm text-muted-foreground font-body">💰 {group.price}</p>}
          {group.dateTimeGroups && group.dateTimeGroups.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {group.dateTimeGroups.map((dtg, i) => (
                <div key={i} className="flex flex-wrap items-center gap-1.5 text-sm">
                  {dtg.dateRanges?.length ? (
                    dtg.dateRanges.map((range, j) => (
                      <span key={j} className="amber-pill text-xs font-bold">📅 {range}</span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">📅 Дата уточняется</span>
                  )}
                  {dtg.time && <span className="text-muted-foreground">⏰ {dtg.time}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Source link */}
      {group.sourceUrl && (
        <div className="flex justify-end mt-2">
          <a href={group.sourceUrl} target="_blank" rel="noopener noreferrer"
            onClick={handleSourceClick} onMouseEnter={handleSourceHover} onMouseLeave={handleSourceLeave}
            className="flex items-center gap-1 text-xs text-primary font-body font-medium opacity-0 group-hover/card:opacity-100 transition-opacity">
            Подробнее <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      )}

    </div>
  );
};

export default EventGroupCard;
