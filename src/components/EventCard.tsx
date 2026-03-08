import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { type EventItem, getCategoryBySlug } from '@/data/events';
import { ArrowRight } from 'lucide-react';

interface EventCardProps {
  event: EventItem;
}

const EventCard = ({ event }: EventCardProps) => {
  const cat = getCategoryBySlug(event.category);
  const dateObj = parseISO(event.date);
  const day = format(dateObj, 'dd', { locale: ru });
  const month = format(dateObj, 'MMM', { locale: ru }).toUpperCase().replace('.', '');

  return (
    <div className={`glass-card border-l-4 ${cat.borderClass} p-5 hover:border-l-primary transition-all duration-300 group`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-foreground font-body font-bold text-base mb-3 group-hover:text-primary transition-colors">
            {event.title}
          </h4>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-body">
            <span className="amber-pill text-xs font-bold">
              {day} {month}
            </span>
            {event.time && (
              <span>⏰ {event.time}</span>
            )}
            <span className="truncate">🏢 {event.venue}</span>
          </div>
          {event.price && (
            <p className="text-sm text-muted-foreground mt-2 font-body">
              💰 {event.price}
            </p>
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

export default EventCard;
