const SkeletonCard = () => {
  return (
    <div className="glass-card border-l-4 border-border/30 p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="h-5 w-3/4 rounded bg-secondary/80" />
          <div className="flex gap-3 items-center">
            <div className="h-6 w-20 rounded-full bg-secondary/60" />
            <div className="h-4 w-16 rounded bg-secondary/40" />
            <div className="h-4 w-32 rounded bg-secondary/40" />
          </div>
          <div className="h-4 w-24 rounded bg-secondary/30" />
        </div>
        <div className="h-8 w-8 rounded bg-secondary/50" />
      </div>
    </div>
  );
};

export const EventSkeletons = ({ count = 3 }: { count?: number }) => (
  <div className="grid gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const CategorySkeletons = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="glass-card p-5 animate-pulse">
        <div className="h-10 w-10 rounded bg-secondary/60 mb-3" />
        <div className="h-4 w-16 rounded bg-secondary/50 mb-2" />
        <div className="h-5 w-10 rounded-full bg-secondary/40" />
      </div>
    ))}
  </div>
);

export default SkeletonCard;
