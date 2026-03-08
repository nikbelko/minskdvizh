import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type QuickFilter = 'today' | 'tomorrow' | 'weekend' | 'upcoming';

interface HeroProps {
  activeFilter: QuickFilter;
  onFilterChange: (filter: QuickFilter) => void;
}

const pills: { key: QuickFilter; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'tomorrow', label: 'Завтра' },
  { key: 'weekend', label: 'Выходные' },
  { key: 'upcoming', label: 'Ближайшие' },
];

const Hero = ({ activeFilter, onFilterChange }: HeroProps) => {
  const today = new Date();
  const dateStr = format(today, "d MMMM yyyy, EEEE", { locale: ru });

  return (
    <section className="relative py-20 md:py-28 overflow-hidden city-grid">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-glow-pulse pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="opacity-0 animate-fade-up">
          <p className="text-accent font-body font-medium text-sm tracking-widest uppercase mb-4">
            {dateStr}
          </p>
        </div>

        <h2 className="opacity-0 animate-fade-up animate-stagger-1 text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.1] mb-8">
          <span className="text-foreground">Что сегодня</span>
          <br />
          <span className="text-primary">в Минске?</span>
        </h2>

        <div className="opacity-0 animate-fade-up animate-stagger-2 flex flex-wrap gap-3">
          {pills.map((pill) => (
            <button
              key={pill.key}
              onClick={() => onFilterChange(pill.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-300 ${
                activeFilter === pill.key
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'glass-card text-foreground hover:border-primary/40'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
export type { QuickFilter };
