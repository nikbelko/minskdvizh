import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { getTelegramUser, isTelegram, haptic } from '@/lib/telegram';

interface Subscription {
  category: string;
  date_type: string;
}

interface CategoryInfo {
  categories: string[];
  date_types: string[];
  descriptions: Record<string, string>;
}

const CATEGORY_NAMES: Record<string, string> = {
  cinema: '🎬 Кино',
  concert: '🎵 Концерты',
  theater: '🎭 Театр',
  exhibition: '🖼️ Выставки',
  kids: '🧸 Детям',
  sport: '⚽ Спорт',
  party: '🎉 Вечеринки',
  free: '🆓 Бесплатно',
  excursion: '🗺️ Экскурсии',
  market: '🛍️ Маркеты',
  masterclass: '🎨 Мастер-классы',
  boardgames: '🎲 Настолки',
  broadcast: '📺 Трансляции',
  education: '📚 Обучение',
  other: '📌 Другое',
};

const DATE_TYPE_NAMES: Record<string, string> = {
  upcoming: '🔔 Все новые события',
  daily: '📅 Ежедневный дайджест',
  weekly: '📆 Дайджест на выходные',
};

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [available, setAvailable] = useState<CategoryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // Получаем user_id из Telegram WebApp
    if (isTelegram()) {
      const user = getTelegramUser();
      setUserId(user?.id || null);
    } else {
      // Для разработки вне Telegram
      setUserId(12345); // тестовый ID
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    const fetchData = async () => {
      try {
        // Загружаем доступные категории
        const catRes = await fetch('/api/subscriptions/categories');
        const catData = await catRes.json();
        setAvailable(catData);

        // Загружаем подписки пользователя
        const subRes = await fetch(`/api/subscriptions?user_id=${userId}`);
        const subData = await subRes.json();
        setSubscriptions(subData.subscriptions);
      } catch (error) {
        console.error('Ошибка загрузки подписок:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const isSubscribed = (category: string, dateType: string) => {
    return subscriptions.some(
      s => s.category === category && s.date_type === dateType
    );
  };

  const toggleSubscription = async (category: string, dateType: string) => {
    if (!userId) return;

    const subscribed = isSubscribed(category, dateType);
    const endpoint = subscribed ? '/api/subscriptions/remove' : '/api/subscriptions/add';
    
    haptic(subscribed ? 'light' : 'medium');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          category,
          date_type: dateType,
        }),
      });

      if (response.ok) {
        if (subscribed) {
          setSubscriptions(subs => 
            subs.filter(s => !(s.category === category && s.date_type === dateType))
          );
        } else {
          setSubscriptions(subs => [...subs, { category, date_type: dateType }]);
        }
      }
    } catch (error) {
      console.error('Ошибка при изменении подписки:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!available) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">Не удалось загрузить категории</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">🔔 Управление подписками</h1>
      <p className="text-muted-foreground mb-8">
        Выберите, о каких событиях вы хотите получать уведомления
      </p>

      {available.date_types.map(dateType => (
        <div key={dateType} className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{DATE_TYPE_NAMES[dateType]}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {available.categories.map(category => (
              <button
                key={`${category}-${dateType}`}
                onClick={() => toggleSubscription(category, dateType)}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  isSubscribed(category, dateType)
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/30'
                }`}
              >
                <span className="font-medium">
                  {CATEGORY_NAMES[category] || category}
                </span>
                {isSubscribed(category, dateType) ? (
                  <Bell className="h-5 w-5 text-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 p-4 glass-card text-sm text-muted-foreground">
        <p className="mb-2">ℹ️ Как это работает:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Уведомления приходят в бота @MinskDvizhBot</li>
          <li>Вы можете отписаться в любой момент</li>
          <li>Дайджесты приходят каждый день в 8:05</li>
        </ul>
      </div>
    </div>
  );
};

export default SubscriptionsPage;
