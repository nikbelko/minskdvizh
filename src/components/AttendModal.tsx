import { useEffect, useMemo, useState } from 'react';
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
  eventTitle: string;
  attendeeCount: number;
  currentUserAttending: boolean;
  onStateChange: (next: { attendeeCount: number; currentUserAttending: boolean }) => void;
}

export default function AttendModal({
  open,
  onOpenChange,
  eventId,
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

  useEffect(() => setLocalCount(attendeeCount), [attendeeCount]);
  useEffect(() => setLocalAttending(currentUserAttending), [currentUserAttending]);

  const query = useQuery({
    queryKey: ['event-attendees', eventId, tgUser?.id],
    queryFn: () => fetchAttendees(eventId, tgUser?.id),
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
            userId: tgUser.id,
            username: tgUser.username,
            firstName: tgUser.first_name,
          })
        : await addAttendee(eventId, {
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

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/20 px-3 py-2">
          <div className="text-sm text-muted-foreground">
            {localCount} {localCount === 1 ? 'человек' : localCount < 5 ? 'человека' : 'человек'}
          </div>
          <button
            onClick={handleToggle}
            disabled={busy}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              localAttending
                ? 'bg-secondary text-foreground hover:bg-secondary/80'
                : 'bg-amber-500 text-black hover:bg-amber-400'
            } disabled:opacity-60`}
          >
            {busy ? '...' : localAttending ? 'Я не иду' : '👥 Я иду'}
          </button>
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
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:text-muted-foreground disabled:hover:bg-transparent"
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
