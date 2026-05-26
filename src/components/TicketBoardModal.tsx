import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  fetchTicketPosts,
  removeTicketPost,
  upsertTicketPost,
  type EventTicketsResponse,
  type TicketPost,
} from '@/services/api';
import { getTelegramUser, haptic, openLink } from '@/lib/telegram';
import { MessageCircle, Ticket } from 'lucide-react';
import { toast } from 'sonner';

interface TicketBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  eventKey: string;
  eventTitle: string;
  sellCount: number;
  buyCount: number;
  currentUserSelling: boolean;
  currentUserBuying: boolean;
  onStateChange: (next: {
    sellCount: number;
    buyCount: number;
    totalCount: number;
    currentUserSelling: boolean;
    currentUserBuying: boolean;
  }) => void;
}

type PostType = 'sell' | 'buy';

export default function TicketBoardModal({
  open,
  onOpenChange,
  eventId,
  eventKey,
  eventTitle,
  sellCount,
  buyCount,
  currentUserSelling,
  currentUserBuying,
  onStateChange,
}: TicketBoardModalProps) {
  const tgUser = getTelegramUser();
  const [postType, setPostType] = useState<PostType>('sell');
  const [qty, setQty] = useState(1);
  const [priceText, setPriceText] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [localData, setLocalData] = useState<EventTicketsResponse | null>(null);

  const query = useQuery({
    queryKey: ['event-tickets', eventKey, tgUser?.id],
    queryFn: () => fetchTicketPosts(eventId, eventKey, tgUser?.id),
    enabled: open,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!query.data) return;
    setLocalData(query.data);
  }, [query.data]);

  const data = localData ?? query.data ?? {
    event_key: eventKey,
    sell_count: sellCount,
    buy_count: buyCount,
    total_count: sellCount + buyCount,
    current_user_sell: currentUserSelling,
    current_user_buy: currentUserBuying,
    sell_posts: [],
    buy_posts: [],
  };

  const myPost = useMemo(() => {
    const source = postType === 'sell' ? data.sell_posts : data.buy_posts;
    return source.find((item) => item.user_id === tgUser?.id) ?? null;
  }, [data.buy_posts, data.sell_posts, postType, tgUser?.id]);

  useEffect(() => {
    if (!myPost) {
      setQty(1);
      setPriceText('');
      setNote('');
      return;
    }
    setQty(myPost.qty);
    setPriceText(myPost.price_text || '');
    setNote(myPost.note || '');
  }, [myPost]);

  const sync = (next: EventTicketsResponse) => {
    setLocalData(next);
    onStateChange({
      sellCount: next.sell_count,
      buyCount: next.buy_count,
      totalCount: next.total_count,
      currentUserSelling: next.current_user_sell,
      currentUserBuying: next.current_user_buy,
    });
  };

  const handleSave = async () => {
    if (!tgUser?.id) {
      toast.error('Функция доступна только в Telegram Mini App');
      return;
    }
    setBusy(true);
    haptic('medium');
    try {
      const response = await upsertTicketPost(eventId, {
        eventKey,
        userId: tgUser.id,
        postType,
        qty,
        priceText,
        note,
        username: tgUser.username,
        firstName: tgUser.first_name,
      });
      sync(response);
      toast.success(postType === 'sell' ? 'Объявление о продаже сохранено' : 'Объявление о поиске сохранено');
    } catch {
      toast.error('Не удалось сохранить объявление');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!tgUser?.id) return;
    setBusy(true);
    haptic('light');
    try {
      const response = await removeTicketPost(eventId, {
        eventKey,
        userId: tgUser.id,
        postType,
        username: tgUser.username,
        firstName: tgUser.first_name,
      });
      sync(response);
      toast.success('Объявление снято');
    } catch {
      toast.error('Не удалось снять объявление');
    } finally {
      setBusy(false);
    }
  };

  const openChat = (username: string) => {
    if (!username) return;
    haptic('light');
    openLink(`https://t.me/${username}`);
  };

  const renderPosts = (title: string, posts: TicketPost[], empty: string) => (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {posts.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-secondary/10 px-3 py-3 text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span>{post.first_name || post.telegram_username || `ID ${post.user_id}`}</span>
                {post.user_id === tgUser?.id && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">Вы</span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {post.post_type === 'sell' ? 'Продаю' : 'Ищу'} {post.qty} {post.qty === 1 ? 'билет' : post.qty < 5 ? 'билета' : 'билетов'}
                {post.price_text ? ` · ${post.price_text}` : ''}
              </div>
              {post.note && <div className="mt-0.5 text-xs text-muted-foreground truncate">{post.note}</div>}
            </div>
            <button
              onClick={() => openChat(post.telegram_username)}
              disabled={!post.telegram_username || post.user_id === tgUser?.id}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:text-muted-foreground disabled:hover:bg-transparent"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Написать
            </button>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl font-body">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Ticket className="h-5 w-5 text-amber-500" />
            Билеты и инвайты
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{eventTitle}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-2 text-sm text-muted-foreground">
          Продают: <span className="text-foreground font-semibold">{data.sell_count}</span>
          <span className="mx-2">•</span>
          Ищут: <span className="text-foreground font-semibold">{data.buy_count}</span>
        </div>

        <div className="space-y-3 rounded-xl border border-border/50 bg-background/50 p-3">
          <div className="flex gap-2">
            {(['sell', 'buy'] as PostType[]).map((type) => (
              <button
                key={type}
                onClick={() => setPostType(type)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                  postType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                }`}
              >
                {type === 'sell' ? 'Продаю' : 'Ищу'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <input
              type="number"
              min={1}
              max={4}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(4, Number(e.target.value) || 1)))}
              className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              type="text"
              value={priceText}
              onChange={(e) => setPriceText(e.target.value)}
              placeholder={postType === 'sell' ? 'Цена или "по номиналу"' : 'Ваш бюджет'}
              className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <textarea
            rows={2}
            maxLength={160}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Комментарий: сектор, ряд, обмен, срочно..."
            className="w-full resize-none rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={busy}
              className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60"
            >
              {busy ? '...' : myPost ? 'Обновить' : 'Опубликовать'}
            </button>
            {myPost && (
              <button
                onClick={handleRemove}
                disabled={busy}
                className="rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary/80 disabled:opacity-60"
              >
                Снять
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[320px] space-y-4 overflow-y-auto pr-1">
          {renderPosts('Продают', data.sell_posts, 'Пока никто не продаёт билеты')}
          {renderPosts('Ищут', data.buy_posts, 'Пока никто не ищет билеты')}
        </div>
      </DialogContent>
    </Dialog>
  );
}
