import { type GroupedEvent, getCategoryBySlug } from '@/data/events';
import { ArrowRight, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import { toast } from 'sonner';
import { haptic, openLink, showMainButton, hideMainButton } from '@/lib/telegram';
import { useState } from 'react';

interface EventGroupCardProps {
  group: GroupedEvent;
}

/* Per-category neon colour for left border + hover glow */
const CATEGORY_NEON: Record<string, string> = {
  cinema:      '210,100%,60%',
  concert:     '293,69%,49%',
  theater:     '340,80%,58%',
  exhibition:  '185,100%,50%',
  kids:        '30,95%,58%',
  sport:       '140,65%,46%',
  party:       '270,85%,62%',
  free:        '100,65%,50%',
  excursion:   '198,80%,54%',
  market:      '315,85%,58%',
  masterclass: '44,90%,54%',
  boardgames:  '250,75%,62%',
  broadcast:   '208,95%,56%',
  education:   '268,68%,58%',
  other:       '228,25%,52%',
};

const EventGroupCard = ({ group }: EventGroupCardProps) => {
  const cat = getCategoryBySlug(group.category);
  const cinemaCount = group.cinemaShowtimes?.length ?? 0;
  const [showTimes, setShowTimes] = useState(cinemaCount <= 1);
  const [hovered, setHovered] = useState(false);

  const neon = CATEGORY_NEON[group.category] || CATEGORY_NEON.other;

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
      const dateStr = new Date(group.cinemaDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
      lines.push(`📅 ${dateStr}`);
      group.cinemaShowtimes?.forEach(st => lines.push(`📍 ${st.venue}: ${st.times.join(', ')}`));
    } else {
      if (group.dateTimeGroups?.[0]?.dateRanges?.length) lines.push(`📅 ${group.dateTimeGroups[0].dateRanges.join(', ')}`);
      if (group.dateTimeGroups?.[0]?.time) lines.push(`⏰ ${group.dateTimeGroups[0].time}`);
      if (group.venue) lines.push(`🏢 ${group.venue}`);
    }
    if (group.price) lines.push(`💰 ${group.price}`);
    if (group.sourceUrl) lines.push(`🔗 ${group.sourceUrl}`);
    lines.push(`\nАфиша Минска @MinskDvizhBot`);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast.success('Скопировано ✓');
    } catch { toast.error('Не удалось скопировать'); }
  };

  const handleSourceClick = (e: React.MouseEvent) => {
    if (group.sourceUrl) { e.preventDefault(); haptic('medium'); openLink(group.sourceUrl); }
  };
  const handleSourceHover = () => {
    if (group.sourceUrl) showMainButton('🔗 Открыть на сайте', () => openLink(group.sourceUrl!));
  };
  const handleSourceLeave = () => { hideMainButton(); };

  return (
    <div
      className={`glass-card border-l-4 ${cat.borderClass} p-5 transition-all duration-300 group`}
      style={hovered ? {
        boxShadow: `
          -4px 0 18px hsl(${neon}/0.45),
          0 4px 28px hsl(${neon}/0.12),
          inset 0 0 24px hsl(${neon}/0.05)
        `,
        borderLeftColor: `hsl(${neon})`,
        transform: 'translateX(1px)',
      } : {}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4
            className="text-foreground font-body font-bold text-base mb-3 group-hover:text-primary transition-colors"
          >
            {group.title}
          </h4>

          {/* Cinema */}
          {group.category === 'cinema' && group.cinemaDate && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-body">
                <span className="amber-pill text-xs font-bold">📅 {formatDateShort(group.cinemaDate)}</span>
              </div>
              {cinemaCount > 1 && (
                <button
                  onClick={() => { haptic('light'); setShowTimes(p => !p); }}
                  className="flex items-center gap-1.5 text-xs text-primary font-body font-medium"
                >
                  {showTimes ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {showTimes ? 'Скрыть сеансы' : `Сеансы (${cinemaCount} ${cinemaCount <= 4 ? 'кинотеатра' : 'кинотеатров'})`}
                </button>
              )}
              {showTimes && (
                <div className="space-y-1 mt-1 pl-2 border-l-2 border-primary/30">
                  {group.cinemaShowtimes?.map(st => (
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
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-body">
              {group.dateTimeGroups && group.dateTimeGroups.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
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
              {group.venue && <span className="truncate">🏢 {group.venue}</span>}
              {group.price && <p className="text-sm text-muted-foreground font-body w-full">💰 {group.price}</p>}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-2xl">{cat.emoji}</span>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-xs text-muted-foreground font-body font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
            >
              <Share2 className="h-3 w-3" />
            </button>
            {group.sourceUrl && (
              <a
                href={group.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleSourceClick}
                onMouseEnter={handleSourceHover}
                onMouseLeave={handleSourceLeave}
                className="flex items-center gap-1 text-xs font-body font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: `hsl(${neon})` }}
              >
                Подробнее <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventGroupCard;