import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday as isDateToday, isSameMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getEventDates } from '@/data/events';

interface CalendarViewProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const CalendarView = ({ selectedDate, onSelectDate }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const eventDates = useMemo(() => getEventDates(), []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Monday = 0, adjust from getDay (Sunday=0)
  const startDayOfWeek = (getDay(monthStart) + 6) % 7;

  const hasEvent = (day: Date) => {
    return eventDates.has(format(day, 'yyyy-MM-dd'));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="glass-card p-6 max-w-2xl mx-auto">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-display font-bold capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: ru })}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-body text-muted-foreground py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map((day) => {
            const isToday = isDateToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const hasEvents = hasEvent(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDate(isSelected ? null : day)}
                className={`relative flex flex-col items-center justify-center py-2.5 rounded-lg text-sm font-body transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isToday
                    ? 'ring-2 ring-accent text-accent font-bold'
                    : 'text-foreground hover:bg-secondary/50'
                }`}
              >
                {format(day, 'd')}
                {hasEvents && (
                  <span
                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-primary-foreground' : 'bg-accent'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground font-body text-center">
              Показаны события за{' '}
              <span className="text-accent font-semibold">
                {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
              </span>
              <button
                onClick={() => onSelectDate(null)}
                className="ml-2 text-primary hover:underline"
              >
                Сбросить
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
