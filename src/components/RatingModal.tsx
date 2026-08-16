import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchRatingSummary, upsertEventRating, type EventRatingSummaryItem } from '@/services/api';
import { getTelegramUser, haptic } from '@/lib/telegram';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  eventKey: string;
  eventTitle: string;
  averageScore: number;
  votes: number;
  currentUserRating?: number | null;
  onStateChange: (next: {
    averageScore: number;
    votes: number;
    currentUserRating: number | null;
  }) => void;
}

const RATINGS = [1, 2, 3, 4, 5] as const;

export default function RatingModal({
  open,
  onOpenChange,
  eventId,
  eventKey,
  eventTitle,
  averageScore,
  votes,
  currentUserRating,
  onStateChange,
}: RatingModalProps) {
  const tgUser = getTelegramUser();
  const [selected, setSelected] = useState<number | null>(currentUserRating ?? null);
  const [busy, setBusy] = useState(false);
  const [localData, setLocalData] = useState<EventRatingSummaryItem | null>(null);

  useEffect(() => {
    setSelected(currentUserRating ?? null);
  }, [currentUserRating, open]);

  useEffect(() => {
    if (!open || !eventKey) return;
    let active = true;
    fetchRatingSummary([eventKey], tgUser?.id)
      .then((items) => {
        if (!active) return;
        const item = items[0];
        if (item) {
          setLocalData(item);
          setSelected(item.current_user_score ?? currentUserRating ?? null);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [open, eventKey, tgUser?.id, currentUserRating]);

  const data = useMemo(() => {
    if (localData) {
      return {
        average_score: localData.average_score,
        votes: localData.votes,
        current_user_score: localData.current_user_score ?? currentUserRating ?? null,
      };
    }
    return {
      average_score: averageScore,
      votes,
      current_user_score: currentUserRating ?? null,
    };
  }, [averageScore, currentUserRating, localData, votes]);

  const sync = (next: { event_key: string; average_score: number; votes: number; current_user_score?: number | null }) => {
    setLocalData({
      event_key: next.event_key,
      average_score: next.average_score,
      votes: next.votes,
      current_user_score: next.current_user_score ?? null,
    });
    onStateChange({
      averageScore: next.average_score,
      votes: next.votes,
      currentUserRating: next.current_user_score ?? null,
    });
  };

  const submitRating = async (score: number) => {
    if (!tgUser?.id) {
      toast.error('Функция доступна только в Telegram Mini App');
      return;
    }
    setBusy(true);
    haptic('selection');
    try {
      const next = await upsertEventRating(eventId, {
        eventKey,
        userId: tgUser.id,
        score,
        username: tgUser.username,
        firstName: tgUser.first_name,
      });
      setSelected(next.current_user_score ?? score);
      sync(next);
      toast.success(`Оценка сохранена: ${score}/5`);
    } catch {
      toast.error('Не удалось сохранить оценку');
    } finally {
      setBusy(false);
    }
  };

  const scoreText = data.votes > 0
    ? `${data.average_score.toFixed(1)} ★ • ${data.votes} оцен${data.votes % 10 === 1 && data.votes % 100 !== 11 ? 'ка' : data.votes % 10 >= 2 && data.votes % 10 <= 4 && !(data.votes % 100 >= 12 && data.votes % 100 <= 14) ? 'ки' : 'ок'}`
    : 'Пока нет оценок';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Оценка события
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{eventTitle}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-2 text-sm text-muted-foreground">
          {scoreText}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/40 p-3">
            {RATINGS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => submitRating(value)}
                disabled={busy}
                className={`rounded-lg p-2 text-2xl transition-all active:scale-95 ${
                  (selected ?? 0) >= value
                    ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                    : 'text-muted-foreground/50 hover:text-amber-300'
                }`}
                aria-label={`Оценить на ${value} из 5`}
              >
                <Star className="h-7 w-7 fill-current" />
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-dashed border-border/60 bg-secondary/10 px-3 py-2 text-xs text-muted-foreground">
            {selected
              ? `Ваша оценка: ${selected}/5`
              : 'Нажмите на звёзды, чтобы оценить событие'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
