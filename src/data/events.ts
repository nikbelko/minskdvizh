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
  // Cinema
  cinemaDate?: string;
  cinemaShowtimes?: { venue: string; times: string[] }[];
  // Other
  venue?: string;
  dateTimeGroups?: { time: string; dateRanges: string[] }[];
  _sort: string;
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

// ── Date range helpers ──

function makeDateRanges(dates: string[]): string[] {
  const sorted = [...new Set(dates)].sort();
  if (sorted.length === 0) return [];
  const parsed = sorted.map(d => new Date(d + 'T00:00:00'));
  const ranges: [Date, Date][] = [];
  let start = parsed[0], end = parsed[0];
  for (const d of parsed.slice(1)) {
    if ((d.getTime() - end.getTime()) / 86400000 === 1) {
      end = d;
    } else {
      ranges.push([start, end]);
      start = end = d;
    }
  }
  ranges.push([start, end]);

  return ranges.map(([s, e]) => {
    const fmt = (d: Date) =>
      d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (s.getTime() === e.getTime()) return fmt(s);
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
      return `${String(s.getDate()).padStart(2, '0')}–${fmt(e)}`;
    return `${s.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}–${fmt(e)}`;
  });
}

// ── Cinema grouping ──

function groupCinemaEvents(events: EventItem[]): GroupedEvent[] {
  // title -> date -> venue -> times[]
  const grouped: Record<string, Record<string, Record<string, string[]>>> = {};
  const sourceUrls: Record<string, string> = {};
  const prices: Record<string, string> = {};

  for (const e of events) {
    if (!grouped[e.title]) grouped[e.title] = {};
    if (!grouped[e.title][e.date]) grouped[e.title][e.date] = {};
    const venue = e.venue || '';
    if (!grouped[e.title][e.date][venue]) grouped[e.title][e.date][venue] = [];
    if (e.time) grouped[e.title][e.date][venue].push(e.time);

    const k = `${e.title}__${e.date}`;
    if (!sourceUrls[k] && e.sourceUrl) sourceUrls[k] = e.sourceUrl;
    if (!prices[k] && e.price) prices[k] = e.price;
  }

  const result: GroupedEvent[] = [];
  for (const [title, dates] of Object.entries(grouped)) {
    for (const [date, cinemas] of Object.entries(dates)) {
      const k = `${title}__${date}`;
      const showtimes = Object.entries(cinemas).map(([venue, times]) => ({
        venue,
        times: [...times].sort(),
      }));
      result.push({
        key: `cinema:${title}:${date}`,
        title,
        category: 'cinema',
        price: prices[k],
        sourceUrl: sourceUrls[k],
        cinemaDate: date,
        cinemaShowtimes: showtimes,
        _sort: date,
      });
    }
  }
  return result.sort((a, b) => a._sort.localeCompare(b._sort));
}

// ── Other categories grouping ──

function groupOtherEvents(events: EventItem[]): GroupedEvent[] {
  const grouped: Record<string, {
    title: string; place: string; price: string;
    category: CategorySlug; sourceUrl: string;
    dates: { date: string; time: string }[];
  }> = {};
  const titleToKey: Record<string, string> = {};

  for (const e of events) {
    const keyWithPlace = `${e.title}__${e.venue || ''}`;
    let key: string;
    if (e.venue) {
      key = keyWithPlace;
      if (!titleToKey[e.title]) titleToKey[e.title] = key;
    } else {
      key = titleToKey[e.title] || keyWithPlace;
    }

    if (!grouped[key]) {
      grouped[key] = {
        title: e.title,
        place: e.venue || '',
        price: e.price || '',
        category: e.category,
        sourceUrl: e.sourceUrl || '',
        dates: [],
      };
      if (e.venue) titleToKey[e.title] = key;
    } else {
      if (!grouped[key].place && e.venue) grouped[key].place = e.venue;
      if (!grouped[key].price && e.price) grouped[key].price = e.price;
      if (!grouped[key].sourceUrl && e.sourceUrl) grouped[key].sourceUrl = e.sourceUrl;
    }
    grouped[key].dates.push({ date: e.date, time: e.time || '' });
  }

  return Object.values(grouped).map(g => {
    // Group dates by time
    const byTime: Record<string, string[]> = {};
    for (const d of g.dates) {
      const t = d.time || '';
      if (!byTime[t]) byTime[t] = [];
      byTime[t].push(d.date);
    }

    const dateTimeGroups = Object.entries(byTime).map(([time, dates]) => ({
      time,
      dateRanges: makeDateRanges(dates),
    }));

    const earliestDate = g.dates.reduce((min, d) => d.date < min ? d.date : min, '9999');

    return {
      key: `other:${g.title}:${g.place}`,
      title: g.title,
      category: g.category as CategorySlug,
      price: g.price || undefined,
      sourceUrl: g.sourceUrl || undefined,
      venue: g.place || undefined,
      dateTimeGroups,
      _sort: earliestDate,
    };
  }).sort((a, b) => a._sort.localeCompare(b._sort));
}

// ── Main grouping + pagination ──

export function groupEvents(events: EventItem[]): GroupedEvent[] {
  const cinema = events.filter(e => e.category === 'cinema');
  const other = events.filter(e => e.category !== 'cinema');
  return [
    ...groupCinemaEvents(cinema),
    ...groupOtherEvents(other),
  ].sort((a, b) => a._sort.localeCompare(b._sort));
}

export function groupAndPaginate(events: EventItem[], page: number, perPage = 10) {
  const grouped = groupEvents(events);
  const total = grouped.length;
  const start = (page - 1) * perPage;
  const items = grouped.slice(start, start + perPage);
  const totalPages = Math.ceil(total / perPage);
  return { grouped: items, total, page, totalPages };
}
