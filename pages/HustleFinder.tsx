import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Filter, DollarSign, Clock, CheckCircle, Star, Search, ChevronLeft, ChevronRight, ArrowUpDown, SlidersHorizontal, X, Briefcase, Bookmark, Trash2, ChevronDown, Check, ArrowRight as ArrowRightIcon } from 'lucide-react';
import GlassSelect from '../components/ui/GlassSelect';
import { Card, Button, Input, Badge } from '../components/CommonUI';
import { ScrollReveal } from '../components/ScrollReveal';
import { HUSTLE_DATA, CATEGORIES } from '../data/hustleData';
import { HustleIdea } from '../types';
import HustleDetail from './HustleDetail';
import { motion, useScroll, useTransform } from 'framer-motion';

// --- Parallax Hustle Grid ---
interface ParallaxHustleGridProps {
  hustles: HustleIdea[];
  favorites: number[];
  toggleFavorite: (id: number) => void;
  animatingStars: number[];
  showSavedOnly: boolean;
  removeFromSaved: (id: number) => void;
  setSelectedHustleId: (id: number | null) => void;
}

const ParallaxHustleGrid: React.FC<ParallaxHustleGridProps> = ({
  hustles, favorites, toggleFavorite, animatingStars, showSavedOnly, removeFromSaved, setSelectedHustleId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 1024) setColumns(2); // lg breakpoint (HustleFinder was 2 cols previously, maybe keep 2 or go 3?)
      // Original was grid-cols-1 md:grid-cols-2.
      // If I want "professional", 2 cols is good for detailed cards. 3 might be too crowded for these text-heavy cards?
      // "Unitoolbox" uses 3 cols but cards are smaller (icon + title + desc).
      // Hustle cards have tags, badges, buttons.
      // Let's stick to 2 columns max as per original layout (grid-cols-2), or upgrade to 3 if user wants "fully animate... change places".
      // 3 columns would look more "ecospystem". Let's try 3 for lg, 2 for md, 1 for sm. Generous width.
      // Actually, original code: `grid-cols-1 md:grid-cols-2`.
      // I'll stick to max 2 columns to ensure readability, parallax works fine with 2.
      else if (window.innerWidth >= 768) setColumns(2);
      else setColumns(1);
    };

    // Actually, let's enable 3 columns on very large screens (xl)?
    // The user said "do like we did before". Home/Unitoolbox are 3 cols.
    // I'll check container width. `container mx-auto` max-w is usually 1280px.
    // 3 cards of ~400px is tight.
    // I will use 2 columns max to be safe with content density.
    // Logic: >= 768 -> 2 columns. < 768 -> 1 column.
    if (window.innerWidth >= 768) setColumns(2);
    else setColumns(1);

    const handler = () => {
      if (window.innerWidth >= 768) setColumns(2);
      else setColumns(1);
    };

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Parallax for 2 columns
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  const distributedHustles = useMemo(() => {
    const cols: HustleIdea[][] = Array.from({ length: columns }, () => []);
    hustles.forEach((h, i) => {
      cols[i % columns].push(h);
    });
    return cols;
  }, [hustles, columns]);

  const HustleCard = ({ hustle }: { hustle: HustleIdea }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <div
        className="group relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-xl transition-all duration-500 hover:scale-[1.01] hover:bg-white/[0.06] hover:border-white/20 cursor-pointer"
        onClick={() => setSelectedHustleId(hustle.id)}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-2">
              <Badge color={hustle.difficulty === 'Beginner' ? 'green' : hustle.difficulty === 'Intermediate' ? 'yellow' : 'red'}>
                {hustle.difficulty}
              </Badge>
              <Badge color="blue">{hustle.earningTier.replace(' Tier', '')}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(hustle.id); }}
                className="p-2 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-95"
                title={favorites.includes(hustle.id) ? 'Remove from saved' : 'Save this hustle'}
              >
                <Star className={`w-5 h-5 transition-all ${animatingStars.includes(hustle.id) ? 'animate-spin' : ''} ${favorites.includes(hustle.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`} />
              </button>
              {showSavedOnly && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromSaved(hustle.id); }}
                  className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-gray-400 hover:text-red-400"
                  title="Remove from saved"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-300 transition-colors font-heading tracking-wide">
            {hustle.title}
          </h3>
          <span className="text-xs text-primary-300 uppercase tracking-wider font-medium font-signature block mb-4">
            {hustle.category}
          </span>

          <p className="text-sm text-gray-400 mb-6 line-clamp-2 leading-relaxed font-light">{hustle.description}</p>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="font-semibold text-green-400">{hustle.earningPotential}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-primary-400 mt-1 flex-shrink-0" />
              <div className="flex flex-wrap gap-2">
                {hustle.skills.map(s => (
                  <span key={s} className="bg-white/5 border border-white/5 px-2 py-1 rounded-md text-xs">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <Button
              variant="ghost"
              className="w-full text-white hover:bg-white/5 hover:text-primary-300 justify-between group/btn"
              onClick={(e) => { e.stopPropagation(); setSelectedHustleId(hustle.id); }}
            >
              <span>View Details</span>
              <ArrowRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div ref={containerRef} className={`grid gap-6 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {distributedHustles.map((colHustles, colIndex) => {
        let style = {};
        let className = "flex flex-col gap-6";

        if (columns === 2) {
          if (colIndex === 0) style = { y: y1 };
          if (colIndex === 1) { style = { y: y2 }; className += " pt-16"; }
        }

        return (
          <motion.div key={colIndex} style={style} className={className}>
            {colHustles.map(h => <HustleCard key={h.id} hustle={h} />)}
          </motion.div>
        );
      })}
    </div>
  );
};

const ITEMS_PER_PAGE = 10;

const HustleFinder: React.FC = () => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string[]>([]);
  const [filterEarningTier, setFilterEarningTier] = useState<string[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);

  // Sort State
  const [sortBy, setSortBy] = useState<'relevance' | 'earning-high' | 'earning-low' | 'alphabetical'>('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageJumpInput, setPageJumpInput] = useState('');

  // Favorites with localStorage persistence
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('hustleFinder_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Show saved only toggle
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Mobile filter toggle
  const [showFilters, setShowFilters] = useState(false);

  // Detail view state
  const [selectedHustleId, setSelectedHustleId] = useState<number | null>(null);

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem('hustleFinder_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Animation state for star
  const [animatingStars, setAnimatingStars] = useState<number[]>([]);

  // Toggle filter helpers
  const toggleFilter = (value: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  // Get earning value for sorting (extract first number from string)
  const getEarningValue = (earningStr: string): number => {
    const match = earningStr.match(/\$(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let data = HUSTLE_DATA.filter(h => {
      // Filter by saved only
      if (showSavedOnly && !favorites.includes(h.id)) return false;

      const matchSearch = searchTerm === '' ||
        h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDifficulty = filterDifficulty.length === 0 || filterDifficulty.includes(h.difficulty);
      const matchEarningTier = filterEarningTier.length === 0 || filterEarningTier.includes(h.earningTier);
      const matchCategory = filterCategories.length === 0 || filterCategories.includes(h.category);

      return matchSearch && matchDifficulty && matchEarningTier && matchCategory;
    });

    // Sort
    switch (sortBy) {
      case 'earning-high':
        data = [...data].sort((a, b) => getEarningValue(b.earningPotential) - getEarningValue(a.earningPotential));
        break;
      case 'earning-low':
        data = [...data].sort((a, b) => getEarningValue(a.earningPotential) - getEarningValue(b.earningPotential));
        break;
      case 'alphabetical':
        data = [...data].sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        // relevance - keep original order
        break;
    }

    return data;
  }, [searchTerm, filterDifficulty, filterEarningTier, filterCategories, sortBy, showSavedOnly, favorites]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageJump = () => {
    const pageNum = parseInt(pageJumpInput, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setPageJumpInput('');
    }
  };

  const toggleFavorite = (id: number) => {
    // Trigger star animation
    setAnimatingStars(prev => [...prev, id]);
    setTimeout(() => setAnimatingStars(prev => prev.filter(sid => sid !== id)), 400);
    setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  };

  const removeFromSaved = (id: number) => {
    setFavorites(prev => prev.filter(fid => fid !== id));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterDifficulty([]);
    setFilterEarningTier([]);
    setFilterCategories([]);
    setSortBy('relevance');
    setCurrentPage(1);
  };

  const activeFiltersCount = filterDifficulty.length + filterEarningTier.length + filterCategories.length + (searchTerm ? 1 : 0);

  // If a hustle is selected, show the detail view
  if (selectedHustleId !== null) {
    return (
      <HustleDetail
        hustleId={selectedHustleId}
        onBack={() => setSelectedHustleId(null)}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-down">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl mb-4 animate-float shadow-lg shadow-purple-500/30">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 font-heading">Hustle<span className="font-signature text-5xl md:text-6xl text-purple-400">Finder</span></h1>
          <p className="text-xl text-gray-400 mb-6">
            <span className="font-signature text-2xl text-cyan-300">Discover</span> <span className="text-purple-400 font-bold animate-pulse">{HUSTLE_DATA.length}+</span> Verified Remote Side Hustles
          </p>

          {/* Tabs: All Hustles / Saved Hustles */}
          <div className="inline-flex bg-white/10 backdrop-blur-xl rounded-xl p-1.5 border border-white/20">
            <button
              onClick={() => setShowSavedOnly(false)}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${!showSavedOnly
                ? 'bg-primary-500/30 text-primary-300 border border-primary-500/50 shadow-lg'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
            >
              All Hustles
            </button>
            <button
              onClick={() => setShowSavedOnly(true)}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${showSavedOnly
                ? 'bg-primary-500/30 text-primary-300 border border-primary-500/50 shadow-lg'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Bookmark className={`w-4 h-4 transition-all ${showSavedOnly ? 'fill-primary-400' : ''}`} />
              Saved ({favorites.length})
            </button>
          </div>
        </div>

        {/* Search & Sort Bar */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 md:p-6 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by keyword, skill, or description..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Sort */}
            <div className="relative min-w-[200px]">
              <GlassSelect
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                options={[
                  { value: 'relevance', label: 'Relevance' },
                  { value: 'earning-high', label: 'Earning: High → Low' },
                  { value: 'earning-low', label: 'Earning: Low → High' },
                  { value: 'alphabetical', label: 'Alphabetical: A-Z' }
                ]}
                className="w-full"
              />
            </div>
            {/* Removed manual dropdown logic */}
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-500/20 backdrop-blur-md text-primary-300 border border-primary-500/30 font-medium"
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={`w-full lg:w-80 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-lg font-bold text-white font-heading">
                  <Filter className="w-5 h-5 text-purple-400" /> <span className="font-signature text-xl">Filters</span>
                </div>
                {activeFiltersCount > 0 && (
                  <button onClick={clearAllFilters} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
                    <X className="w-4 h-4" /> Clear All
                  </button>
                )}
              </div>

              {/* Difficulty Level */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Difficulty Level</h3>
                <div className="space-y-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map(d => (
                    <label key={d} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filterDifficulty.includes(d)}
                        onChange={() => toggleFilter(d, filterDifficulty, setFilterDifficulty)}
                        className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className={`text-sm ${filterDifficulty.includes(d) ? 'text-purple-600 font-medium' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                        {d === 'Beginner' ? '🟢 Beginner Friendly' : d === 'Intermediate' ? '🟡 Intermediate' : '🔴 Advanced'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Earning Potential */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Earning Potential</h3>
                <div className="space-y-2">
                  {['Beginner Tier', 'Intermediate Tier', 'Advanced Tier'].map(tier => (
                    <label key={tier} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filterEarningTier.includes(tier)}
                        onChange={() => toggleFilter(tier, filterEarningTier, setFilterEarningTier)}
                        className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className={`text-sm ${filterEarningTier.includes(tier) ? 'text-purple-600 font-medium' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                        {tier === 'Beginner Tier' ? '💵 Beginner Tier ($0-500/mo)' : tier === 'Intermediate Tier' ? '💰 Intermediate Tier ($500-3K/mo)' : '💎 Advanced Tier ($3K+/mo)'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Categories</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {CATEGORIES.map(cat => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filterCategories.includes(cat)}
                        onChange={() => toggleFilter(cat, filterCategories, setFilterCategories)}
                        className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className={`text-sm ${filterCategories.includes(cat) ? 'text-purple-600 font-medium' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                        {cat}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </Card>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <span className="text-2xl font-bold text-white font-heading">{filteredData.length}</span>
                <span className="text-gray-400 ml-2">Hustles <span className="font-signature text-lg text-indigo-300">found</span></span>
              </div>
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length}
              </div>
            </div>

            {/* Hustle Cards */}
            {/* Hustle Cards */}
            <div className="mb-8">
              <ParallaxHustleGrid
                hustles={paginatedData}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                animatingStars={animatingStars}
                showSavedOnly={showSavedOnly}
                removeFromSaved={removeFromSaved}
                setSelectedHustleId={setSelectedHustleId}
              />
            </div>

            {/* No Results */}
            {filteredData.length === 0 && (
              <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10">
                {showSavedOnly ? (
                  <>
                    <div className="text-6xl mb-4 animate-bounce">⭐</div>
                    <p className="text-xl font-semibold text-white mb-2">No saved hustles yet</p>
                    <p className="text-gray-400 mb-6">Click the star icon on any hustle to save it here</p>
                    <Button onClick={() => setShowSavedOnly(false)} className="bg-purple-600 hover:bg-purple-700 text-white border-none shadow-lg shadow-purple-900/20">Browse All Hustles</Button>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4 animate-pulse">🔍</div>
                    <p className="text-xl font-semibold text-white mb-2">No hustles found</p>
                    <p className="text-gray-400 mb-6">Try adjusting your filters or search term</p>
                    <Button onClick={clearAllFilters} className="bg-white/10 hover:bg-white/20 text-white border-white/20">Clear All Filters</Button>
                  </>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg mt-8">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                  {/* Page Navigation */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>

                    <div className="flex items-center gap-1 px-4">
                      {/* First Page */}
                      {currentPage > 3 && (
                        <>
                          <button onClick={() => setCurrentPage(1)} className="w-10 h-10 rounded-lg hover:bg-white/10 text-gray-300 font-medium transition-colors">1</button>
                          {currentPage > 4 && <span className="text-gray-500">...</span>}
                        </>
                      )}

                      {/* Page Numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        if (pageNum < 1 || pageNum > totalPages) return null;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-medium transition-all ${currentPage === pageNum
                              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30 ring-2 ring-purple-400/30'
                              : 'hover:bg-white/10 text-gray-300 hover:text-white'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      {/* Last Page */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && <span className="text-gray-500">...</span>}
                          <button onClick={() => setCurrentPage(totalPages)} className="w-10 h-10 rounded-lg hover:bg-white/10 text-gray-300 font-medium transition-colors">{totalPages}</button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-30"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Page Jump */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">Go to page:</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pageJumpInput}
                      onChange={(e) => setPageJumpInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePageJump()}
                      placeholder={`1-${totalPages}`}
                      className="w-24 px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-center text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder-gray-600"
                    />
                    <Button onClick={handlePageJump} size="sm">Go</Button>
                  </div>
                </div>

                {/* Page Info */}
                <div className="text-center mt-4 text-sm text-gray-500">
                  Page <span className="font-semibold text-purple-600">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div >

  );
};

export default HustleFinder;