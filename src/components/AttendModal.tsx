import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { addAttendee, fetchAttendees, removeAttendee, type EventAttendee } from '@/services/api';
import { getTelegramUser, haptic, openLink } from '@/lib/telegram';
import { MessageCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

interface AttendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  eventKey: string;
  eventTitle: string;
  attendeeCount: number;
  currentUserAttending: boolean;
  onStateChange: (next: { attendeeCount: number; currentUserAttending: boolean }) => void;
}

export default function AttendModal({
  open,
  onOpenChange,
  eventId,
  eventKey,
  eventTitle,
  attendeeCount,
  currentUserAttending,
  onStateChange,
}: AttendModalProps) {
  const tgUser = getTelegramUser();
  const [busy, setBusy] = useState(false);
  const [localCount, setLocalCount] = useState(attendeeCount);
  const [localAttending, setLocalAttending] = useState(currentUserAttending);
  const [localAttendees, setLocalAttendees] = useState<EventAttendee[] | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ clientX: 0, dragX: 0 });

  function getSliderMax() {
    const width = sliderRef.current?.getBoundingClientRect().width ?? 0;
    return Math.max(0, width - 92);
  }

  function getRestingX() {
    return localAttending ? getSliderMax() : 0;
  }

  useEffect(() => setLocalCount(attendeeCount), [attendeeCount]);
  useEffect(() => setLocalAttending(currentUserAttending), [currentUserAttending]);
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => setDragX(localAttending ? getSliderMax() : 0));
  }, [localAttending, open]);

  const query = useQuery({
    queryKey: ['event-attendees', eventKey, tgUser?.id],
    queryFn: () => fetchAttendees(eventId, eventKey, tgUser?.id),
    enabled: open,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!query.data) return;
    setLocalCount(query.data.count);
    setLocalAttending(query.data.current_user_attending);
    setLocalAttendees(query.data.attendees);
  }, [query.data]);

  const attendees = useMemo(() => localAttendees ?? query.data?.attendees ?? [], [localAttendees, query.data]);

  const syncState = (count: number, attending: boolean, attendeesNext: EventAttendee[]) => {
    setLocalCount(count);
    setLocalAttending(attending);
    setLocalAttendees(attendeesNext);
    onStateChange({ attendeeCount: count, currentUserAttending: attending });
  };

  const handleToggle = async () => {
    if (!tgUser?.id) {
      toast.error('Отметка доступна только в Telegram Mini App');
      return;
    }
    setBusy(true);
    haptic('medium');
    try {
      const response = localAttending
        ? await removeAttendee(eventId, {
            eventKey,
            userId: tgUser.id,
            username: tgUser.username,
            firstName: tgUser.first_name,
          })
        : await addAttendee(eventId, {
            eventKey,
            userId: tgUser.id,
            username: tgUser.username,
            firstName: tgUser.first_name,
          });

      syncState(response.count, response.current_user_attending, response.attendees);
      toast.success(localAttending ? 'Отметка отменена' : 'Вы отмечены как идущий');
    } catch {
      toast.error('Не удалось обновить отметку');
    } finally {
      setBusy(false);
    }
  };

  const updateDrag = (clientX: number) => {
    const next = Math.max(0, Math.min(
      getSliderMax(),
      dragStartRef.current.dragX + clientX - dragStartRef.current.clientX,
    ));
    setDragX(next);
  };

  const handleSliderPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (busy) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    const restingX = getRestingX();
    setDragX(restingX);
    dragStartRef.current = { clientX: event.clientX, dragX: restingX };
    haptic('light');
  };

  const handleSliderPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || busy) return;
    updateDrag(event.clientX);
  };

  const handleSliderPointerUp = async () => {
    if (!dragging || busy) return;
    const max = getSliderMax();
    const completed = max > 0 && (
      localAttending ? dragX <= max * 0.22 : dragX >= max * 0.78
    );
    setDragging(false);
    if (completed) {
      await handleToggle();
    } else {
      setDragX(getRestingX());
    }
  };

  const openChat = (username: string) => {
    if (!username) return;
    haptic('light');
    openLink(`https://t.me/${username}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            Кто идет
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            {eventTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/20 px-3 py-3">
          <div className="text-sm text-muted-foreground">
            {localCount} {localCount === 1 ? 'человек' : localCount < 5 ? 'человека' : 'человек'}
          </div>
          <div
            ref={sliderRef}
            role="button"
            aria-label={localAttending ? 'Свайпните, чтобы отменить отметку' : 'Свайпните, чтобы отметить Я иду'}
            aria-disabled={busy}
            onPointerDown={handleSliderPointerDown}
            onPointerMove={handleSliderPointerMove}
            onPointerUp={handleSliderPointerUp}
            onPointerCancel={() => {
              setDragging(false);
              setDragX(getRestingX());
            }}
            className={`relative h-12 select-none overflow-hidden rounded-xl border border-primary/35 bg-primary/10 touch-none ${
              busy ? 'opacity-60' : 'active:scale-[0.99]'
            } transition-transform`}
          >
            <div
              className={`absolute inset-y-0 rounded-xl bg-primary/25 ${
                dragging ? '' : 'transition-all duration-200 ease-out'
              }`}
              style={localAttending
                ? { left: `${dragX + 4}px`, right: '4px' }
                : { left: '4px', width: `${Math.max(88, dragX + 88)}px` }}
            />
            <div className="absolute inset-0 flex items-center justify-center px-24 text-center text-sm font-semibold text-primary/90">
              {busy ? 'Обновляем...' : localAttending ? 'Я не иду' : 'Я иду'}
            </div>
            <div
              className={`absolute left-1 top-1 flex h-10 w-[88px] items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30 ${
                dragging ? '' : 'transition-transform duration-200 ease-out'
              }`}
              style={{ transform: `translateX(${dragging ? dragX : getRestingX()}px)` }}
            >
              <Users className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
          {query.isLoading && attendees.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Загружаем список...</div>
          ) : attendees.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Пока никто не отметил это событие
            </div>
          ) : (
            attendees.map((attendee) => (
              <div
                key={attendee.user_id}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {attendee.first_name || attendee.telegram_username || `ID ${attendee.user_id}`}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {attendee.telegram_username ? `@${attendee.telegram_username}` : 'username не указан'}
                  </div>
                </div>
                <button
                  onClick={() => openChat(attendee.telegram_username)}
                  disabled={!attendee.telegram_username}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary transition-all active:scale-95 active:bg-primary/10 disabled:text-muted-foreground disabled:active:bg-transparent sm:hover:bg-primary/10"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Написать
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
