import { Home, CalendarDays, Search, Bell } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'home' | 'calendar' | 'search' | 'subscriptions';
  onTabChange: (tab: 'home' | 'calendar' | 'search' | 'subscriptions') => void;
}

const tabs = [
  { key: 'home' as const, icon: Home, label: 'Главная' },
  { key: 'calendar' as const, icon: CalendarDays, label: 'Календарь' },
  { key: 'search' as const, icon: Search, label: 'Поиск' },
  { key: 'subscriptions' as const, icon: Bell, label: 'Подписки' },
];

const MobileNav = ({ activeTab, onTabChange }: MobileNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-card border-t border-border/50 sm:hidden">
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === key
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-body font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
