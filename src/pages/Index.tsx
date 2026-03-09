import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import Hero, { type QuickFilter } from '@/components/Hero';
import CategoryGrid from '@/components/CategoryGrid';
import EventsList from '@/components/EventsList';
import CalendarView from '@/components/CalendarView';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import MobileNav from '@/components/MobileNav';
import Footer from '@/components/Footer';
import type { CategorySlug } from '@/data/events';
import { useDebounce } from '@/hooks/use-debounce';
import { useCategoryCounts } from '@/hooks/use-events';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('upcoming');
  const [activeCategory, setActiveCategory] = useState<CategorySlug | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);
  const [mobileTab, setMobileTab] = useState<'home' | 'calendar' | 'search' | 'categories'>('home');
  const [totalFiltered, setTotalFiltered] = useState(0);
  const { data: categoryCounts } = useCategoryCounts(quickFilter, calendarDate);

  const handleCalendarToggle = useCallback(() => {
    setCalendarOpen(prev => !prev);
    if (calendarOpen) setCalendarDate(null);
  }, [calendarOpen]);

  const handleCalendarDate = useCallback((date: Date | null) => {
    setCalendarDate(date);
  }, []);

  const handleMobileTab = useCallback((tab: 'home' | 'calendar' | 'search' | 'categories') => {
    setMobileTab(tab);
    if (tab === 'home') { setCalendarOpen(false); setCalendarDate(null); }
  }, []);

  const handleCategoryClick = useCallback((slug: CategorySlug | null) => {
    setActiveCategory(slug);
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="grain-overlay" />
      {/* Mobile: unified sticky header + filters */}
      <div className="sm:hidden sticky top-0 z-40">
        <div className="relative overflow-hidden rounded-b-2xl">
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, hsla(293, 69%, 49%, 0.08) 0%, hsla(var(--glass-bg)) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid hsla(var(--glass-border))',
          }} />
          <div className="relative z-10">
            <Header
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onCalendarToggle={handleCalendarToggle}
              calendarOpen={calendarOpen}
            />
            <div className="mx-4 h-[2px] bg-primary/30" />
            <Hero
              activeFilter={quickFilter}
              onFilterChange={setQuickFilter}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryClick}
              categoryCounts={categoryCounts}
              totalFiltered={totalFiltered}
            />
          </div>
        </div>
      </div>
      {/* Desktop: separate header */}
      <div className="hidden sm:block">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCalendarToggle={handleCalendarToggle}
          calendarOpen={calendarOpen}
        />
      </div>
      {/* Desktop calendar */}
      {calendarOpen && (
        <div className="sticky top-[57px] z-30 hidden sm:block">
          <CalendarView selectedDate={calendarDate} onSelectDate={handleCalendarDate} />
        </div>
      )}
      <div className="hidden sm:block">
        <Hero
          activeFilter={quickFilter}
          onFilterChange={setQuickFilter}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryClick}
          categoryCounts={categoryCounts}
          totalFiltered={totalFiltered}
        />
      </div>
      <SubscriptionBanner />
      <CategoryGrid activeCategory={activeCategory} onCategoryClick={handleCategoryClick} />

      <EventsList
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryClick}
        quickFilter={quickFilter}
        searchQuery={searchQuery}
        debouncedSearch={debouncedSearch}
        calendarDate={calendarDate}
        onTotalChange={setTotalFiltered}
      />
      <Footer />
      <MobileNav 
        activeTab={mobileTab} 
        onTabChange={handleMobileTab} 
        activeCategory={activeCategory}
        onCategorySelect={handleCategoryClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        calendarDate={calendarDate}
        onCalendarDate={handleCalendarDate}
      />
    </div>
  );
};

export default Index;
