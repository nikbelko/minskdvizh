import { type GroupedEvent, getCategoryBySlug } from '@/data/events';
import { ArrowRight, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import { toast } from 'sonner';
import { haptic, openLink, showMainButton, hideMainButton } from '@/lib/telegram';
import { useState } from 'react';

interface EventGroupCardProps {
  group: GroupedEvent;
}

/* Map category slug → neon left-border color */
const CATEGORY_NEON: Record<string, string> = {
  cinema:      'hsl(210 100% 60%)',
  concert:     'hsl(293 80% 60%)',
  theater:     'hsl(340 90% 60%)',
  exhibition:  'hsl(185 100% 50%)',
  kids:        'hsl(30 100% 60%)',
  sport:       'hsl(140 70% 50%)',
  party:       'hsl(270 90% 65%)',
  free:        'hsl(100 70% 50%)',
  excursion:   'hsl(200 80% 55%)',
  market:      'hsl(316 90% 60%)',
  masterclass: 'hsl(45 90% 55%)',
  boardgames:  'hsl(250 80% 65%)',
  broadcast:   'hsl(210 100% 55%)',
  education:   'hsl(270 70% 60%)',
  other:       'hsl(228 30% 55%)',
};

const EventGroupCard = ({ group }: EventGroupCardProps) => {
  const cat = getCategoryBySlug(group.category);
  const cinemaCount = group.cinemaShowtimes?.length ?? 0;
  const [showTimes, setShowTimes] = useState(cinemaCount <= 1);

  const neonColor = CATEGORY_NEON[group.category] || CATEGORY_NEON.other;

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '');
  };

  const handleShare = async () => {
    haptic('medium');
    const emoji = cat.emoji;
    const lines: string[] = [`${emoji} ${group.title}`];
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
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const handleSourceClick = (e: React.MouseEvent) => {
    if (group.sourceUrl) { e.preventDefault(); haptic('medium'); openLink(group.sourceUrl); }
  };

  return (
    <div
      className="group/card relative overflow-hidden rounded-xl transition-all duration-300 cursor-default"
      style={{
        background: 'hsla(228, 18%, 8%, 0.75)',
        borderLeft: `3px solid ${neonColor}`,
        border: `1px solid hsl(228 20% 14%)`,
        borderLeftColor: neonColor,
        borderLeftWidth: '3px',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.borderColor = `${neonColor}`;
        el.style.borderLeftColor = neonColor;
        el.style.boxShadow = `
          -3px 0 18px ${neonColor}55,
          0 4px 32px ${neonColor}18,
          inset 0 0 24px ${neonColor}08
        `;
        el.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.borderColor = 'hsl(228 20% 14%)';
        el.style.borderLeftColor = neonColor;
        el.style.boxShadow = '';
        el.style.transform = '';
      }}
    >
      {/* Subtle gradient on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
        style={{ background: `linear-gradient(135deg, ${neonColor}06 0%, transparent 50%)` }}
      />

      <div className="relative p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h4
            className="text-foreground font-display font-bold text-base flex-1 min-w-0 pr-1 transition-all duration-200 group-hover/card:translate-x-0.5"
            style={{ lineHeight: 1.3 }}
          >
            {group.title}
          </h4>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-md transition-all opacity-0 group-hover/card:opacity-100 hover:scale-110"
              style={{ color: 'hsl(228 10% 50%)', background: 'hsl(228 18% 14%)', border: '1px solid hsl(228 20% 20%)' }}
              title="Поделиться"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <CategoryIcon slug={group.category} size="sm" />
          </div>
        </div>

        {/* Cinema */}
        {group.category === 'cinema' && group.cinemaDate && (
          <div className="space-y-2">
            <span className="amber-pill text-xs font-label">📅 {formatDateShort(group.cinemaDate)}</span>
            {cinemaCount > 1 && (
              <button
                onClick={() => { haptic('light'); setShowTimes(p => !p); }}
                className="flex items-center gap-1.5 text-xs font-label font-semibold tracking-wide mt-1 transition-opacity hover:opacity-80"
                style={{ color: 'hsl(185 100% 55%)' }}
              >
                {showTimes ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showTimes ? 'Скрыть сеансы' : `Сеансы (${cinemaCount} ${cinemaCount <= 4 ? 'кинотеатра' : 'кинотеатров'})`}
              </button>
            )}
            {showTimes && (
              <div
                className="space-y-1 mt-1 pl-2"
                style={{ borderLeft: '2px solid hsl(185 100% 50% / 0.3)' }}
              >
                {group.cinemaShowtimes?.map(st => (
                  <div key={st.venue} className="text-sm font-body leading-snug">
                    <span className="text-muted-foreground">📍 {st.venue}:</span>
                    <span className="ml-1 font-label font-semibold" style={{ color: 'hsl(185 100% 55%)' }}>
                      {st.times.join(', ')}
                    </span>
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
            {group.venue && (
              <p className="text-sm font-body flex items-center gap-1" style={{ color: 'hsl(228 10% 60%)' }}>
                🏢 {group.venue}
              </p>
            )}
            {group.price && (
              <p className="text-sm font-body" style={{ color: 'hsl(228 10% 60%)' }}>💰 {group.price}</p>
            )}
            {group.dateTimeGroups && group.dateTimeGroups.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {group.dateTimeGroups.map((dtg, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-1.5 text-sm">
                    {dtg.dateRanges?.length ? (
                      dtg.dateRanges.map((range, j) => (
                        <span key={j} className="amber-pill text-xs font-label">📅 {range}</span>
                      ))
                    ) : (
                      <span className="text-xs" style={{ color: 'hsl(228 10% 45%)' }}>📅 Дата уточняется</span>
                    )}
                    {dtg.time && (
                      <span className="text-xs font-label font-semibold" style={{ color: 'hsl(228 10% 55%)' }}>⏰ {dtg.time}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Source link */}
        {group.sourceUrl && (
          <div className="flex justify-end mt-2.5">
            <a
              href={group.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSourceClick}
              className="flex items-center gap-1 text-xs font-label font-semibold tracking-wide opacity-0 group-hover/card:opacity-100 transition-all hover:gap-1.5"
              style={{ color: neonColor }}
            >
              Подробнее <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventGroupCard;
