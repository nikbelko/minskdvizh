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
  date: string;
  time?: string;
  venue: string;
  price?: string;
  category: CategorySlug;
  description?: string;
  sourceUrl?: string;
  sourceName?: string;
}

export interface GroupedEvent {
  key: string;
  title: string;
  category: CategorySlug;
  price?: string;
  sourceUrl?: string;
  cinemaShowtimes?: { venue: string; times: string[] }[];
  cinemaDate?: string;
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

export function getCategoryBySlug(slug: CategorySlug): Category {
  return categories.find(c => c.slug === slug)!;
}

/** Group filtered events according to cinema vs non-cinema logic */
export function groupEvents(events: EventItem[]): GroupedEvent[] {
  const groups: GroupedEvent[] = [];
  const processed = new Set<string>();

  for (const event of events) {
    if (event.category === 'cinema') {
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
      venueMap.forEach((times) => times.sort());

      groups.push({
        key,
        title: event.title,
        category: event.category,
        price: event.price,
        sourceUrl: event.sourceUrl,
        cinemaDate: event.date,
        cinemaShowtimes: Array.from(venueMap.entries()).map(([venue, times]) => ({ venue, times })),
      });
    } else {
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
        sourceUrl: event.sourceUrl,
        venue: event.venue,
        dateTimes,
      });
    }
  }

  return groups;
}
