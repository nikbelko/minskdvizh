import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday as isDateToday, isBefore, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendarDates } from '@/hooks/use-events';

interface CalendarViewProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const CalendarView = ({ selectedDate, onSelectDate }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: calendarDatesArr } = useCalendarDates();
  const eventDatesSet = useMemo(() => {
    const arr = Array.isArray(calendarDatesArr) ? calendarDatesArr : [];
    return new Set(arr);
  }, [calendarDatesArr]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (getDay(monthStart) + 6) % 7;

  const hasEvent = (day: Date) => eventDatesSet.has(format(day, 'yyyy-MM-dd'));
  const today = startOfDay(new Date());
  const isActive = (day: Date) => hasEvent(day) && !isBefore(day, today);

  return (
    <div className="absolute left-0 right-0 z-30 px-4 pt-2 pb-4 animate-in slide-in-from-top-2 fade-in duration-200">
      <div
        className="mx-auto max-w-2xl rounded-xl border border-border/50 p-5"
        style={{
          background: 'hsla(var(--glass-bg))',
          borderColor: 'hsla(var(--glass-border))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-base font-display font-bold capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: ru })}
          </h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-body text-muted-foreground py-1.5">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const isToday = isDateToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const hasEvents = hasEvent(day);
            const active = isActive(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => active ? onSelectDate(isSelected ? null : day) : undefined}
                disabled={!active}
                className={`relative flex flex-col items-center justify-center py-2 rounded-lg text-sm font-body transition-all ${
                  isSelected ? 'bg-primary text-primary-foreground'
                    : isToday && active ? 'ring-2 ring-accent text-accent font-bold'
                    : isToday ? 'ring-2 ring-accent/30 text-muted-foreground'
                    : active ? 'text-foreground hover:bg-secondary/50 cursor-pointer'
                    : 'text-muted-foreground/30 cursor-default'
                }`}
              >
                {format(day, 'd')}
                {hasEvents && (
                  <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-accent'}`} />
                )}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-sm text-muted-foreground font-body text-center">
              Показаны события за{' '}
              <span className="text-accent font-semibold">{format(selectedDate, 'd MMMM yyyy', { locale: ru })}</span>
              <button onClick={() => onSelectDate(null)} className="ml-2 text-primary hover:underline">Сбросить</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
