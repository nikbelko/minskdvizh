import { type GroupedEvent, getCategoryBySlug } from '@/data/events';
import { ArrowRight, Share2, ChevronDown, ChevronUp, MapPin, Clock, Banknote, CalendarDays, CalendarPlus, Users } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import { toast } from 'sonner';
import { getTelegramUser, haptic, openLink } from '@/lib/telegram';
import { useEffect, useState } from 'react';
import AttendModal from './AttendModal';

interface EventGroupCardProps {
  group: GroupedEvent;
}

const EventGroupCard = ({ group }: EventGroupCardProps) => {
  const cat = getCategoryBySlug(group.category);
  const cinemaCount = group.cinemaShowtimes?.length ?? 0;
  const [showTimes, setShowTimes] = useState(cinemaCount <= 1);
  const [attendeesOpen, setAttendeesOpen] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(group.attendeeCount ?? 0);
  const [currentUserAttending, setCurrentUserAttending] = useState(group.currentUserAttending ?? false);

  useEffect(() => setAttendeeCount(group.attendeeCount ?? 0), [group.attendeeCount]);
  useEffect(() => setCurrentUserAttending(group.currentUserAttending ?? false), [group.currentUserAttending]);

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleCalendarExport = () => {
    haptic('light');

    let date = '';
    let time: string | undefined;
    let end_time: string | undefined;

    if (group.category === 'cinema' && group.cinemaDate) {
      date = group.cinemaDate.replace(/-/g, '');
      const firstTime = group.cinemaShowtimes?.[0]?.times?.[0];
      if (firstTime) time = firstTime;
    } else {
      const isoDate = group._sort;
      if (isoDate && isoDate !== '9999') {
        date = isoDate.replace(/-/g, '');
        const dtg = group.dateTimeGroups?.[0];
        if (dtg?.time) {
          time = dtg.time;
          if (dtg.end_time) end_time = dtg.end_time;
        }
      }
    }

    if (!date) {
      toast.error('Дата недоступна');
      return;
    }

    const params = new URLSearchParams({ title: group.title, date });
    if (time) params.set('time', time);
    if (end_time) params.set('end_time', end_time);
    if (group.venue) params.set('venue', group.venue);
    if (group.sourceUrl) params.set('url', group.sourceUrl);
    if (group.description) params.set('description', group.description);

    openLink(`https://minskdvizh.up.railway.app/api/ical?${params.toString()}`);
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
      if (group.venue) lines.push(`📍 ${group.venue}`);
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
    if (group.sourceUrl) {
      e.preventDefault();
      haptic('medium');
      openLink(group.sourceUrl);
    }
  };

  const handleAttendOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tgUser = getTelegramUser();
    if (!tgUser?.id) {
      toast.error('Функция доступна только в Telegram Mini App');
      return;
    }
    haptic('selection');
    setAttendeesOpen(true);
  };

  return (
    <>
    <div
      className={`glass-card border-l-4 ${cat.borderClass} p-4 hover:border-l-primary transition-all duration-300 group/card relative ${cinemaCount > 1 ? 'cursor-pointer' : ''}`}
      onClick={cinemaCount > 1 && !showTimes ? () => { haptic('light'); setShowTimes(true); } : undefined}
    >

      {/* Icons — absolutely positioned. Категория сверху, кнопки в ряд под ней */}
      <div className="absolute top-4 right-4 flex flex-col items-center gap-0.5">
        <CategoryIcon slug={group.category} size="card" />
        <button onClick={(e) => { e.stopPropagation(); handleCalendarExport(); }}
          className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover/card:opacity-100"
          title="Добавить в календарь">
          <CalendarPlus className="h-3.5 w-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover/card:opacity-100"
          title="Поделиться">
          <Share2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Весь контент с отступом справа — не перекрывается с absolute иконками */}
      <div className="pr-10">

      <h4 className="text-foreground font-body font-bold text-base group-hover/card:text-primary transition-colors mb-0.5">
        {group.title}
      </h4>

      {/* Description — compact, 2 lines max */}
      {group.description && (
        <p className="text-xs text-muted-foreground font-body leading-snug mb-1.5 line-clamp-2">
          {group.description}
        </p>
      )}

      {/* Cinema */}
      {group.category === 'cinema' && group.cinemaDate && (
        <div className="space-y-1.5 mt-1">
          <span className="amber-pill inline-flex items-center gap-1 text-xs font-bold">
            <CalendarDays className="h-3 w-3 shrink-0" />
            {formatDateShort(group.cinemaDate)}
          </span>
          {cinemaCount > 1 && (
            <button onClick={(e) => { e.stopPropagation(); haptic('light'); setShowTimes(p => !p); }}
              className="flex items-center gap-1.5 text-xs text-primary font-body font-medium mt-0.5 hover:opacity-80 transition-opacity">
              {showTimes ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showTimes ? 'Скрыть сеансы' : `Сеансы (${cinemaCount} ${cinemaCount <= 4 ? 'кинотеатра' : 'кинотеатров'})`}
            </button>
          )}
          {showTimes && (
            <div className="space-y-1 mt-1 pl-2 border-l-2 border-primary/30">
              {group.cinemaShowtimes?.map((st) => (
                <div key={st.venue} className="flex items-baseline gap-1.5 text-sm font-body leading-snug">
                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                  <span>
                    <span className="text-foreground/80">{st.venue}: </span>
                    <span className="text-accent">{st.times.join(', ')}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          {group.price && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-body mt-0.5">
              <Banknote className="h-3.5 w-3.5 shrink-0" />
              <span>{group.price}</span>
            </div>
          )}
        </div>
      )}

      {/* Other categories */}
      {group.category !== 'cinema' && (
        <div className="space-y-1 mt-1">
          {/* Venue + location */}
          {group.venue && (
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground font-body">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span>{group.venue}</span>
                {group.location && group.location !== 'Минск' && (
                  <span className="text-xs text-muted-foreground/70 ml-1">· {group.location}</span>
                )}
              </div>
            </div>
          )}

          {/* Dates + times */}
          {group.dateTimeGroups && group.dateTimeGroups.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
              {group.category === 'kids' ? (() => {
                const byDate = new Map<string, string[]>();
                group.dateTimeGroups!.forEach(dtg => {
                  const date = dtg.dateRanges?.[0] ?? 'Дата уточняется';
                  if (!byDate.has(date)) byDate.set(date, []);
                  if (dtg.time) byDate.get(date)!.push(dtg.time);
                });
                return Array.from(byDate.entries()).map(([date, times]) => (
                  <div key={date} className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="amber-pill inline-flex items-center gap-1 text-xs font-bold">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      {date}
                    </span>
                    {times.length > 0 && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="text-xs">{times.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ));
              })() : group.dateTimeGroups.map((dtg, i) => (
                <div key={i} className="flex flex-wrap items-center gap-1.5 text-sm">
                  {dtg.dateRanges?.length ? (
                    dtg.dateRanges.map((range, j) => (
                      <span key={j} className="amber-pill inline-flex items-center gap-1 text-xs font-bold">
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        {range}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      Дата уточняется
                    </span>
                  )}
                  {dtg.time && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="text-xs">{dtg.end_time ? `${dtg.time}–${dtg.end_time}` : dtg.time}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {group.price && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-body">
              <Banknote className="h-3.5 w-3.5 shrink-0" />
              <span>{group.price}</span>
            </div>
          )}
        </div>
      )}

      </div>{/* /pr-10 */}

      <div className="mt-3 pr-10">
        <button
          onClick={handleAttendOpen}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all ${
            currentUserAttending
              ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30 hover:bg-amber-500/25'
              : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
          title={currentUserAttending ? 'Вы отметили это событие' : 'Посмотреть, кто идет'}
        >
          <Users className="h-3.5 w-3.5" />
          {attendeeCount > 0 && (
            <span className="text-[11px] leading-none">
              {attendeeCount}
            </span>
          )}
        </button>
      </div>

      {/* Подробнее — absolute, по правому краю под иконками */}
      {group.sourceUrl && (
        <a href={group.sourceUrl} target="_blank" rel="noopener noreferrer"
          onClick={handleSourceClick}
          className="absolute bottom-3 right-4 flex items-center gap-1 text-xs text-primary font-body font-medium opacity-0 group-hover/card:opacity-100 transition-opacity">
          Подробнее <ArrowRight className="h-3 w-3" />
        </a>
      )}
    </div>
    <AttendModal
      open={attendeesOpen}
      onOpenChange={setAttendeesOpen}
      eventId={group.primaryEventId}
      eventTitle={group.title}
      attendeeCount={attendeeCount}
      currentUserAttending={currentUserAttending}
      onStateChange={({ attendeeCount: nextCount, currentUserAttending: nextAttending }) => {
        setAttendeeCount(nextCount);
        setCurrentUserAttending(nextAttending);
      }}
    />
    </>
  );
};

export default EventGroupCard;
