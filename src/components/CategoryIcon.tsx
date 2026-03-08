import { Film, Music, Drama, Frame, Baby, Trophy, Sparkles, Gift } from 'lucide-react';
import type { CategorySlug } from '@/data/events';

const iconConfig: Record<CategorySlug, { icon: React.ElementType; gradient: string; glow: string }> = {
  cinema:     { icon: Film,     gradient: 'from-blue-500 to-indigo-600',   glow: 'shadow-blue-500/30' },
  concert:    { icon: Music,    gradient: 'from-primary to-fuchsia-600',   glow: 'shadow-primary/30' },
  theater:    { icon: Drama,    gradient: 'from-rose-500 to-pink-600',     glow: 'shadow-rose-500/30' },
  exhibition: { icon: Frame,    gradient: 'from-teal-400 to-cyan-600',     glow: 'shadow-teal-400/30' },
  kids:       { icon: Baby,     gradient: 'from-orange-400 to-amber-500',  glow: 'shadow-orange-400/30' },
  sport:      { icon: Trophy,   gradient: 'from-emerald-500 to-green-600', glow: 'shadow-emerald-500/30' },
  party:      { icon: Sparkles, gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/30' },
  free:       { icon: Gift,     gradient: 'from-lime-400 to-green-500',    glow: 'shadow-lime-400/30' },
};

interface CategoryIconProps {
  slug: CategorySlug;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { container: 'w-8 h-8 rounded-lg', icon: 16 },
  md: { container: 'w-11 h-11 rounded-xl', icon: 22 },
  lg: { container: 'w-14 h-14 rounded-2xl', icon: 28 },
};

const CategoryIcon = ({ slug, size = 'md' }: CategoryIconProps) => {
  const config = iconConfig[slug];
  const s = sizeMap[size];
  const Icon = config.icon;

  return (
    <div className={`${s.container} bg-gradient-to-br ${config.gradient} ${config.glow} shadow-lg flex items-center justify-center shrink-0`}>
      <Icon size={s.icon} className="text-white" strokeWidth={1.8} />
    </div>
  );
};

export default CategoryIcon;
