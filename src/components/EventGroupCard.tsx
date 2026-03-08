import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { type GroupedEvent, getCategoryBySlug } from '@/data/events';
import { ArrowRight } from 'lucide-react';

interface EventGroupCardProps {
  group: GroupedEvent;
}

const EventGroupCard = ({ group }: EventGroupCardProps) => {
  const cat = getCategoryBySlug(group.category);

  const formatDate = (dateStr: string) => {
    const d = parseISO(dateStr);
    return format(d, 'dd MMM', { locale: ru }).toUpperCase().replace('.', '');
  };

  return (
    <div className={`glass-card border-l-4 ${cat.borderClass} p-5 hover:border-l-primary transition-all duration-300 group`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-foreground font-body font-bold text-base mb-3 group-hover:text-primary transition-colors">
            {group.title}
          </h4>

          {/* Cinema layout */}
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
                <p className="text-sm text-muted-foreground mt-2 font-body">
                  💰 {group.price}
                </p>
              )}
            </div>
          )}

          {/* Non-cinema layout */}
          {group.category !== 'cinema' && (
            <div className="space-y-2">
              {group.venue && (
                <p className="text-sm text-muted-foreground font-body">
                  🏢 {group.venue}
                </p>
              )}
              {group.price && (
                <p className="text-sm text-muted-foreground font-body">
                  💰 {group.price}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-1">
                {group.dateTimes?.map((dt, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm">
                    <span className="amber-pill text-xs font-bold">
                      📅 {formatDate(dt.date)}
                    </span>
                    {dt.time && (
                      <span className="text-muted-foreground">⏰ {dt.time}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-2xl">{cat.emoji}</span>
          <button className="flex items-center gap-1 text-xs text-primary font-body font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Подробнее <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventGroupCard;
