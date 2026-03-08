export type CategorySlug = 'cinema' | 'concert' | 'theater' | 'exhibition' | 'kids' | 'sport' | 'party' | 'free';

export interface Category {
  slug: CategorySlug;
  emoji: string;
  name: string;
  borderClass: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string; // ISO date
  time?: string;
  venue: string;
  price?: string;
  category: CategorySlug;
  description?: string;
}

/** Grouped event for display */
export interface GroupedEvent {
  key: string;
  title: string;
  category: CategorySlug;
  price?: string;
  // For cinema: grouped by title+date, multiple venues with times
  cinemaShowtimes?: { venue: string; times: string[] }[];
  cinemaDate?: string;
  // For non-cinema: grouped by title+venue, multiple date/times
  venue?: string;
  dateTimes?: { date: string; time?: string }[];
}

export const categories: Category[] = [
  { slug: 'cinema', emoji: '🎬', name: 'Кино', borderClass: 'category-border-cinema' },
  { slug: 'concert', emoji: '🎵', name: 'Концерты', borderClass: 'category-border-concert' },
  { slug: 'theater', emoji: '🎭', name: 'Театр', borderClass: 'category-border-theater' },
  { slug: 'exhibition', emoji: '🖼️', name: 'Выставки', borderClass: 'category-border-exhibition' },
  { slug: 'kids', emoji: '🧸', name: 'Детям', borderClass: 'category-border-kids' },
  { slug: 'sport', emoji: '⚽', name: 'Спорт', borderClass: 'category-border-sport' },
  { slug: 'party', emoji: '🌟', name: 'Движ', borderClass: 'category-border-party' },
  { slug: 'free', emoji: '🆓', name: 'Бесплатно', borderClass: 'category-border-free' },
];

export const mockEvents: EventItem[] = [
  // Cinema — multiple showtimes/venues per film
  { id: 'c1a', title: 'Дюна: Часть третья', date: '2026-03-08', time: '10:00', venue: 'Кинотеатр Москва', price: 'от 15 BYN', category: 'cinema' },
  { id: 'c1b', title: 'Дюна: Часть третья', date: '2026-03-08', time: '13:30', venue: 'Кинотеатр Москва', price: 'от 15 BYN', category: 'cinema' },
  { id: 'c1c', title: 'Дюна: Часть третья', date: '2026-03-08', time: '16:00', venue: 'Кинотеатр Москва', price: 'от 15 BYN', category: 'cinema' },
  { id: 'c1d', title: 'Дюна: Часть третья', date: '2026-03-08', time: '12:00', venue: 'Кинотеатр Беларусь', price: 'от 15 BYN', category: 'cinema' },
  { id: 'c1e', title: 'Дюна: Часть третья', date: '2026-03-08', time: '19:30', venue: 'Кинотеатр Беларусь', price: 'от 15 BYN', category: 'cinema' },
  { id: 'c2a', title: 'Оскар 2026: Лучшие фильмы', date: '2026-03-10', time: '20:00', venue: 'Кинотеатр Беларусь', price: 'от 12 BYN', category: 'cinema' },
  { id: 'c2b', title: 'Оскар 2026: Лучшие фильмы', date: '2026-03-10', time: '17:00', venue: 'Кинотеатр Москва', price: 'от 12 BYN', category: 'cinema' },
  { id: 'c3a', title: 'Ретроспектива Тарковского', date: '2026-03-15', time: '18:30', venue: 'Кинотеатр Москва', price: 'от 10 BYN', category: 'cinema' },
  { id: 'c3b', title: 'Ретроспектива Тарковского', date: '2026-03-15', time: '14:00', venue: 'Кинотеатр Беларусь', price: 'от 10 BYN', category: 'cinema' },
  { id: 'c4', title: 'Аниме-марафон: Миядзаки', date: '2026-03-22', time: '12:00', venue: 'Кинотеатр Беларусь', price: 'от 8 BYN', category: 'cinema' },
  { id: 'c5', title: 'Премьера: Последний рубеж', date: '2026-03-28', time: '21:00', venue: 'Кинотеатр Москва', price: 'от 18 BYN', category: 'cinema' },
  { id: 'c5b', title: 'Премьера: Последний рубеж', date: '2026-03-28', time: '18:00', venue: 'Кинотеатр Беларусь', price: 'от 18 BYN', category: 'cinema' },

  // Concerts
  { id: 'co1', title: 'Симфонический оркестр: Рахманинов', date: '2026-03-09', time: '19:00', venue: 'Белорусская государственная филармония', price: 'от 25 BYN', category: 'concert' },
  { id: 'co2', title: 'Ночь электронной музыки', date: '2026-03-14', time: '22:00', venue: 'Prime Hall', price: 'от 40 BYN', category: 'concert' },
  { id: 'co3', title: 'Jazz Весна 2026', date: '2026-03-20', time: '20:00', venue: 'Белорусская государственная филармония', price: 'от 20 BYN', category: 'concert' },
  { id: 'co4', title: 'Рок-фестиваль «Гром»', date: '2026-03-27', time: '18:00', venue: 'Минск-Арена', price: 'от 50 BYN', category: 'concert' },
  { id: 'co5', title: 'Акустический вечер: Инди', date: '2026-04-03', time: '19:30', venue: 'Prime Hall', price: 'от 30 BYN', category: 'concert' },
  { id: 'co6', title: 'Хор Турецкого', date: '2026-04-10', time: '19:00', venue: 'Дворец Республики', price: 'от 35 BYN', category: 'concert' },

  // Theater — some with multiple dates at same venue
  { id: 't1a', title: 'Вишнёвый сад', date: '2026-03-08', time: '19:00', venue: 'Театр им. Янки Купалы', price: 'от 20 BYN', category: 'theater' },
  { id: 't1b', title: 'Вишнёвый сад', date: '2026-03-14', time: '18:00', venue: 'Театр им. Янки Купалы', price: 'от 20 BYN', category: 'theater' },
  { id: 't2', title: 'Гамлет: Новая интерпретация', date: '2026-03-12', time: '19:00', venue: 'Молодёжный театр', price: 'от 18 BYN', category: 'theater' },
  { id: 't3a', title: 'Мастер и Маргарита', date: '2026-03-18', time: '19:00', venue: 'Театр им. Янки Купалы', price: 'от 25 BYN', category: 'theater' },
  { id: 't3b', title: 'Мастер и Маргарита', date: '2026-03-22', time: '18:00', venue: 'Театр им. Янки Купалы', price: 'от 25 BYN', category: 'theater' },
  { id: 't4', title: 'Сон в летнюю ночь', date: '2026-03-25', time: '18:30', venue: 'Молодёжный театр', price: 'от 15 BYN', category: 'theater' },
  { id: 't5', title: 'Три сестры', date: '2026-04-02', time: '19:00', venue: 'Театр им. Янки Купалы', price: 'от 22 BYN', category: 'theater' },

  // Exhibition
  { id: 'e1', title: 'Беларускі авангард XX стагоддзя', date: '2026-03-08', venue: 'Национальный художественный музей', price: 'от 8 BYN', category: 'exhibition' },
  { id: 'e2', title: 'Цифровое искусство: AI & Art', date: '2026-03-15', venue: 'Prime Hall', price: 'от 15 BYN', category: 'exhibition' },
  { id: 'e3', title: 'Фотовыставка «Минск в лицах»', date: '2026-03-20', venue: 'Национальный художественный музей', price: 'от 5 BYN', category: 'exhibition' },
  { id: 'e4', title: 'Современная скульптура', date: '2026-04-01', venue: 'Национальный художественный музей', price: 'от 10 BYN', category: 'exhibition' },
  { id: 'e5', title: 'Графика и гравюра', date: '2026-04-08', venue: 'Национальный художественный музей', price: 'от 6 BYN', category: 'exhibition' },

  // Kids
  { id: 'k1', title: 'Кот в сапогах (мюзикл)', date: '2026-03-09', time: '11:00', venue: 'Молодёжный театр', price: 'от 12 BYN', category: 'kids' },
  { id: 'k2', title: 'Научное шоу профессора Бум', date: '2026-03-15', time: '12:00', venue: 'Дворец Республики', price: 'от 10 BYN', category: 'kids' },
  { id: 'k3', title: 'Мастер-класс: Робототехника', date: '2026-03-22', time: '10:00', venue: 'Prime Hall', price: 'от 20 BYN', category: 'kids' },
  { id: 'k4', title: 'Цирк «Звёздный дождь»', date: '2026-03-29', time: '14:00', venue: 'Дворец Республики', price: 'от 15 BYN', category: 'kids' },
  { id: 'k5', title: 'Детский кинофестиваль', date: '2026-04-05', time: '11:00', venue: 'Кинотеатр Москва', price: 'от 5 BYN', category: 'kids' },

  // Sport
  { id: 's1', title: 'ХК Динамо Минск vs СКА', date: '2026-03-10', time: '19:00', venue: 'Минск-Арена', price: 'от 20 BYN', category: 'sport' },
  { id: 's2', title: 'Минский полумарафон 2026', date: '2026-03-16', time: '09:00', venue: 'Минск-Арена', price: 'от 30 BYN', category: 'sport' },
  { id: 's3', title: 'Баскетбол: Цмокі vs Гродно', date: '2026-03-21', time: '18:00', venue: 'Минск-Арена', price: 'от 10 BYN', category: 'sport' },
  { id: 's4', title: 'Турнир по кроссфиту', date: '2026-03-28', time: '10:00', venue: 'Prime Hall', price: 'от 15 BYN', category: 'sport' },
  { id: 's5', title: 'Футбол: Динамо vs БАТЭ', date: '2026-04-04', time: '17:00', venue: 'Минск-Арена', price: 'от 12 BYN', category: 'sport' },

  // Party
  { id: 'p1', title: 'Вечеринка Neon Dreams', date: '2026-03-08', time: '23:00', venue: 'Prime Hall', price: 'от 25 BYN', category: 'party' },
  { id: 'p2', title: 'Stand-Up: Лучшие комики Минска', date: '2026-03-13', time: '20:00', venue: 'Prime Hall', price: 'от 20 BYN', category: 'party' },
  { id: 'p3', title: 'Квиз «Мозгобойня»', date: '2026-03-19', time: '19:00', venue: 'Prime Hall', price: 'от 10 BYN', category: 'party' },
  { id: 'p4', title: 'Гастрофестиваль «Вкус Минска»', date: '2026-03-26', time: '12:00', venue: 'Дворец Республики', price: 'от 5 BYN', category: 'party' },
  { id: 'p5', title: 'Караоке-баттл', date: '2026-04-02', time: '21:00', venue: 'Prime Hall', price: 'от 15 BYN', category: 'party' },
  { id: 'p6', title: 'Ночь музеев', date: '2026-04-12', time: '18:00', venue: 'Национальный художественный музей', price: 'Бесплатно', category: 'party' },

  // Free
  { id: 'f1', title: 'Экскурсия «Минск неизвестный»', date: '2026-03-09', time: '11:00', venue: 'Дворец Республики', category: 'free' },
  { id: 'f2', title: 'Йога в парке Горького', date: '2026-03-15', time: '08:00', venue: 'Дворец Республики', category: 'free' },
  { id: 'f3', title: 'Книжный своп', date: '2026-03-22', time: '14:00', venue: 'Национальный художественный музей', category: 'free' },
  { id: 'f4', title: 'Лекция: Урбанистика Минска', date: '2026-03-29', time: '16:00', venue: 'Национальный художественный музей', category: 'free' },
  { id: 'f5', title: 'Фестиваль уличной музыки', date: '2026-04-06', time: '12:00', venue: 'Дворец Республики', category: 'free' },
];

export function getCategoryBySlug(slug: CategorySlug): Category {
  return categories.find(c => c.slug === slug)!;
}

export function getEventCountByCategory(slug: CategorySlug): number {
  return mockEvents.filter(e => e.category === slug).length;
}

/** Group filtered events according to cinema vs non-cinema logic */
export function groupEvents(events: EventItem[]): GroupedEvent[] {
  const groups: GroupedEvent[] = [];
  const processed = new Set<string>();

  for (const event of events) {
    if (event.category === 'cinema') {
      // Cinema: group by title + date
      const key = `cinema:${event.title}:${event.date}`;
      if (processed.has(key)) continue;
      processed.add(key);

      const sameGroup = events.filter(e => e.category === 'cinema' && e.title === event.title && e.date === event.date);
      const venueMap = new Map<string, string[]>();
      for (const e of sameGroup) {
        if (!e.time) continue;
        if (!venueMap.has(e.venue)) venueMap.set(e.venue, []);
        venueMap.get(e.venue)!.push(e.time);
      }
      // Sort times
      venueMap.forEach((times) => times.sort());

      groups.push({
        key,
        title: event.title,
        category: event.category,
        price: event.price,
        cinemaDate: event.date,
        cinemaShowtimes: Array.from(venueMap.entries()).map(([venue, times]) => ({ venue, times })),
      });
    } else {
      // Non-cinema: group by title + venue
      const key = `other:${event.title}:${event.venue}`;
      if (processed.has(key)) continue;
      processed.add(key);

      const sameGroup = events.filter(e => e.title === event.title && e.venue === event.venue);
      const dateTimes = sameGroup.map(e => ({ date: e.date, time: e.time }))
        .sort((a, b) => a.date.localeCompare(b.date));

      groups.push({
        key,
        title: event.title,
        category: event.category,
        price: event.price,
        venue: event.venue,
        dateTimes,
      });
    }
  }

  return groups;
}

/** Get all unique dates that have events */
export function getEventDates(): Set<string> {
  return new Set(mockEvents.map(e => e.date));
}
