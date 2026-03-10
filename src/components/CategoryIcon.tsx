import { Film, Music, Drama, Frame, Baby, Trophy, Sparkles, Gift, Map, ShoppingBag, Palette, Dices, Tv, BookOpen, Pin } from 'lucide-react';
import type { CategorySlug } from '@/data/events';

const iconConfig: Record<CategorySlug, { icon: React.ElementType; color: string; border: string; glow: string }> = {
  cinema:      { icon: Film,        color: 'text-blue-400',    border: 'border-blue-400/25',    glow: 'shadow-blue-500/10' },
  concert:     { icon: Music,       color: 'text-fuchsia-400', border: 'border-fuchsia-400/25', glow: 'shadow-fuchsia-500/10' },
  theater:     { icon: Drama,       color: 'text-rose-400',    border: 'border-rose-400/25',    glow: 'shadow-rose-500/10' },
  exhibition:  { icon: Frame,       color: 'text-teal-400',    border: 'border-teal-400/25',    glow: 'shadow-teal-500/10' },
  kids:        { icon: Baby,        color: 'text-orange-400',  border: 'border-orange-400/25',  glow: 'shadow-orange-500/10' },
  sport:       { icon: Trophy,      color: 'text-emerald-400', border: 'border-emerald-400/25', glow: 'shadow-emerald-500/10' },
  party:       { icon: Sparkles,    color: 'text-violet-400',  border: 'border-violet-400/25',  glow: 'shadow-violet-500/10' },
  free:        { icon: Gift,        color: 'text-lime-400',    border: 'border-lime-400/25',    glow: 'shadow-lime-500/10' },
  excursion:   { icon: Map,         color: 'text-cyan-400',    border: 'border-cyan-400/25',    glow: 'shadow-cyan-500/10' },
  market:      { icon: ShoppingBag, color: 'text-pink-400',    border: 'border-pink-400/25',    glow: 'shadow-pink-500/10' },
  masterclass: { icon: Palette,     color: 'text-amber-400',   border: 'border-amber-400/25',   glow: 'shadow-amber-500/10' },
  boardgames:  { icon: Dices,       color: 'text-indigo-400',  border: 'border-indigo-400/25',  glow: 'shadow-indigo-500/10' },
  broadcast:   { icon: Tv,          color: 'text-sky-400',     border: 'border-sky-400/25',     glow: 'shadow-sky-500/10' },
  education:   { icon: BookOpen,    color: 'text-purple-400',  border: 'border-purple-400/25',  glow: 'shadow-purple-500/10' },
  other:       { icon: Pin,         color: 'text-slate-400',   border: 'border-slate-400/25',   glow: 'shadow-slate-500/10' },
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
  const config = iconConfig[slug] ?? iconConfig['other'];
  const s = sizeMap[size];
  const Icon = config.icon;

  return (
    <div className={`${s.container} bg-white/[0.06] backdrop-blur-md border ${config.border} ${config.glow} shadow-lg flex items-center justify-center shrink-0`}>
      <Icon size={s.icon} className={config.color} strokeWidth={1.8} />
    </div>
  );
};

export default CategoryIcon;
