# MinskDvizh — Frontend

Веб-интерфейс афиши Минска. Работает как самостоятельный сайт и как Telegram WebApp внутри [@MinskDvizh_bot](https://t.me/MinskDvizh_bot).

## Стек

- **React 18** + **TypeScript**
- **Vite** — сборка и dev-сервер
- **Tailwind CSS** — стили
- **shadcn/ui** — UI-компоненты (Radix UI)
- **TanStack React Query** — fetching и кэширование
- **React Router DOM** — SPA-роутинг
- **Sonner** — toast-уведомления
- **lucide-react** — иконки

## Локальный запуск

```sh
npm install
npm run dev       # dev-сервер на http://localhost:5173
npm run build     # production-сборка в dist/
npm run preview   # предпросмотр dist/
npm run lint      # ESLint
```

## Связь с API

Все запросы идут на бэкенд Railway:

```
https://minskdvizh.up.railway.app
```

Переменная `API_BASE` задана в `src/services/api.ts`. При необходимости переключиться на локальный бэкенд — поменять там.

## Структура

```
src/
├── components/
│   ├── EventGroupCard.tsx   # Карточка события (иконки, description, venue)
│   ├── EventsList.tsx       # Список событий, пагинация, flash-подписки
│   ├── Header.tsx           # Лого, поиск (desktop), панель подписок
│   ├── MobileNav.tsx        # Bottom nav: поиск, категории, календарь
│   ├── Hero.tsx             # Quick-фильтры (сегодня / завтра / выходные / все)
│   ├── CategoryGrid.tsx     # Сетка категорий с бейджами
│   ├── CalendarView.tsx     # Выбор даты
│   ├── Footer.tsx           # Футер + Dialog «О проекте»
│   ├── SubmitEventModal.tsx # Форма предложить событие
│   └── ui/                  # shadcn/ui компоненты
├── data/
│   └── events.ts            # Типы EventItem, GroupedEvent, группировка, пагинация
├── hooks/
│   ├── use-events.ts        # React Query хуки (useEvents, useCategoryCounts)
│   ├── use-debounce.ts
│   ├── use-mobile.tsx
│   └── useTelegramTheme.ts
├── services/
│   └── api.ts               # Fetch-функции, toEventItem маппинг
├── lib/
│   └── telegram.ts          # Telegram WebApp API (haptic, openLink, user)
└── pages/
    └── Index.tsx            # Главная страница, стейт-менеджмент
```

## Telegram WebApp

В контексте Telegram бота фронт открывается как WebApp. Инициализация — `src/lib/telegram.ts`:

- `getTelegramUser()` — ID и имя пользователя из `tg.initDataUnsafe`
- `openLink(url)` — открывает ссылку через `tg.openLink()` (не `window.open`)
- `haptic(style)` — тактильная отдача

Если `window.Telegram` недоступен (обычный браузер) — всё gracefully деградирует.

## Деплой

Деплой на Railway через Docker. При пуше в `main` Railway автоматически собирает и деплоит.

Фронт также совместим с Vercel (статическая Vite-сборка), нужен `vercel.json` с SPA rewrite rules и обновление `WEB_APP_URL` в боте.
