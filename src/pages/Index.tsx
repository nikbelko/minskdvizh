import { useState } from 'react';
import Header from '@/components/Header';
import Hero, { type QuickFilter } from '@/components/Hero';
import CategoryGrid from '@/components/CategoryGrid';
import EventsList from '@/components/EventsList';
import Footer from '@/components/Footer';
import type { CategorySlug } from '@/data/events';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('upcoming');
  const [activeCategory, setActiveCategory] = useState<CategorySlug | null>(null);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="grain-overlay" />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <Hero activeFilter={quickFilter} onFilterChange={setQuickFilter} />
      <CategoryGrid activeCategory={activeCategory} onCategoryClick={setActiveCategory} />
      <EventsList activeCategory={activeCategory} quickFilter={quickFilter} searchQuery={searchQuery} />
      <Footer />
    </div>
  );
};

export default Index;
