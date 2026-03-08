import { Film, Music, Drama, Frame, Baby, Trophy, Sparkles, Gift } from 'lucide-react';
import type { CategorySlug } from '@/data/events';

const iconConfig: Record<CategorySlug, { icon: React.ElementType; color: string; border: string; glow: string }> = {
  cinema:     { icon: Film,     color: 'text-blue-400',    border: 'border-blue-400/25',    glow: 'shadow-blue-500/10' },
  concert:    { icon: Music,    color: 'text-fuchsia-400', border: 'border-fuchsia-400/25', glow: 'shadow-fuchsia-500/10' },
  theater:    { icon: Drama,    color: 'text-rose-400',    border: 'border-rose-400/25',    glow: 'shadow-rose-500/10' },
  exhibition: { icon: Frame,    color: 'text-teal-400',    border: 'border-teal-400/25',    glow: 'shadow-teal-500/10' },
  kids:       { icon: Baby,     color: 'text-orange-400',  border: 'border-orange-400/25',  glow: 'shadow-orange-500/10' },
  sport:      { icon: Trophy,   color: 'text-emerald-400', border: 'border-emerald-400/25', glow: 'shadow-emerald-500/10' },
  party:      { icon: Sparkles, color: 'text-violet-400',  border: 'border-violet-400/25',  glow: 'shadow-violet-500/10' },
  free:       { icon: Gift,     color: 'text-lime-400',    border: 'border-lime-400/25',    glow: 'shadow-lime-500/10' },
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
