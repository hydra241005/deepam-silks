import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { ProductCard } from './ProductCard';
import { ImageWithFallback } from './ImageWithFallback';
import { 
  SlidersHorizontal, 
  ChevronDown, 
  X, 
  RotateCcw, 
  ChevronRight,
  Check
} from 'lucide-react';
import { CategoryId } from '../types';
import { getEffectiveProductPrice, getPublishedProducts } from '../lib/backend';

export const CategoryPage: React.FC = () => {
  const { 
    selectedCategory, 
    selectedSubcategory, 
    navigateToHome, 
    navigateToCategory,
    activeOffers,
    refreshActiveOffers,
  } = useShop();

  const currentCategory = selectedCategory || 'new-arrivals';
  const categoryMeta = CATEGORIES.find(c => c.id === currentCategory) || CATEGORIES[0];
  const subcategories = currentCategory === 'sale'
    ? activeOffers.map(offer => ({ id: offer.id, label: offer.name }))
    : categoryMeta.subcategories.map(subcategory => ({ id: subcategory, label: subcategory }));

  // Filter states
  const [activeSubcategory, setActiveSubcategory] = useState<string>(selectedSubcategory || 'all');
  const [priceRange, setPriceRange] = useState<string>('all'); // 'all', 'under-2000', '2000-5000', 'above-5000'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'newest' | 'rating'>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [effectivePrices, setEffectivePrices] = useState<Record<string, number>>({});
  const [catalog, setCatalog] = useState(PRODUCTS);

  React.useEffect(() => {
    let active = true;
    Promise.all([
      getPublishedProducts(),
      ...PRODUCTS.map(product => getEffectiveProductPrice(product.id).then(price => [product.id, price?.effectivePriceMinor ? price.effectivePriceMinor / 100 : product.price] as const)),
    ]).then(([nextCatalog, ...prices]) => {
      if (!active) return;
      setCatalog(nextCatalog as typeof PRODUCTS);
      setEffectivePrices(Object.fromEntries(prices as [string, number][]));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    if (currentCategory === 'sale') refreshActiveOffers().catch(() => undefined);
  }, [currentCategory, refreshActiveOffers]);

  // Sync subcategory when changed externally from mega-menu
  React.useEffect(() => {
    if (selectedSubcategory) {
      setActiveSubcategory(selectedSubcategory);
    } else {
      setActiveSubcategory('all');
    }
    setVisibleCount(8);
  }, [selectedCategory, selectedSubcategory]);

  // Compute filtered & sorted products
  const filteredProducts = useMemo(() => {
    let list = catalog.filter(product => {
      // Category match
      if (currentCategory === 'new-arrivals') {
        if (!product.isNewArrival) return false;
      } else if (currentCategory === 'sale') {
        if (!product.discountPercent && !activeOffers.some(offer => offer.productIds.includes(product.id))) return false;
      } else if (product.category !== currentCategory) {
        return false;
      }

      // Subcategory filter
      if (activeSubcategory !== 'all') {
        const selectedOffer = activeOffers.find(offer => offer.id === activeSubcategory || offer.name.toLowerCase() === activeSubcategory.toLowerCase());
        if (selectedOffer) return selectedOffer.productIds.includes(product.id);
        if (product.subcategory.toLowerCase() !== activeSubcategory.toLowerCase()) {
          // If subcategory has fuzzy match
          if (!product.subcategory.toLowerCase().includes(activeSubcategory.toLowerCase())) {
            return false;
          }
        }
      }

      // Price filter
      const effectivePrice = effectivePrices[product.id] ?? product.price;
      if (priceRange === 'under-2000' && effectivePrice >= 2000) return false;
      if (priceRange === '2000-5000' && (effectivePrice < 2000 || effectivePrice > 5000)) return false;
      if (priceRange === 'above-5000' && effectivePrice <= 5000) return false;

      // In stock
      if (inStockOnly && !product.variants.some(v => v.inStock)) return false;

      // On sale
      if (onSaleOnly && !product.discountPercent && !activeOffers.some(offer => offer.productIds.includes(product.id))) return false;

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'price-low') return (effectivePrices[a.id] ?? a.price) - (effectivePrices[b.id] ?? b.price);
      if (sortBy === 'price-high') return (effectivePrices[b.id] ?? b.price) - (effectivePrices[a.id] ?? a.price);
      if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // featured
    });

    return list;
  }, [catalog, currentCategory, activeSubcategory, priceRange, inStockOnly, onSaleOnly, sortBy, activeOffers, effectivePrices]);

  const resetFilters = () => {
    setActiveSubcategory('all');
    setPriceRange('all');
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSortBy('featured');
  };

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;
  const selectedOffer = currentCategory === 'sale'
    ? activeOffers.find(offer => offer.id === activeSubcategory || offer.name.toLowerCase() === activeSubcategory.toLowerCase())
    : undefined;

  return (
    <div className="bg-white min-h-screen">
      
      {/* Editorial Category Banner */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 bg-neutral-900 overflow-hidden">
        <ImageWithFallback
          src={categoryMeta.heroImage}
          alt={categoryMeta.headline}
          className="w-full h-full object-cover opacity-80"
          fallbackText={categoryMeta.label}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 w-full text-white">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-neutral-300 mb-3" aria-label="Breadcrumb">
              <button onClick={navigateToHome} className="hover:text-white transition-colors">
                Home
              </button>
              <ChevronRight className="w-3 h-3 text-neutral-400" />
              <span className="text-white uppercase tracking-wider font-medium">
                {categoryMeta.label}
              </span>
              {activeSubcategory !== 'all' && (
                <>
                  <ChevronRight className="w-3 h-3 text-neutral-400" />
                  <span className="text-amber-200 uppercase tracking-wider">
                    {selectedOffer?.name || activeSubcategory}
                  </span>
                </>
              )}
            </nav>

            <h1 className="font-display text-3xl sm:text-5xl font-medium tracking-tight text-white mb-2 text-balance">
              {categoryMeta.headline}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-200 max-w-xl font-light">
              {categoryMeta.description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Controls Bar: Mobile filter toggle, Product count, Sort dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-neutral-200 gap-4">
          
          <div className="flex items-center gap-4">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-xs font-semibold uppercase tracking-wider text-neutral-900"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter & Sort
            </button>

            {/* Product Count */}
            <div className="text-xs text-neutral-500 font-mono">
              <span className="font-bold text-neutral-900 tabular-nums">
                {filteredProducts.length}
              </span>{' '}
              {filteredProducts.length === 1 ? 'PRODUCT' : 'PRODUCTS'}
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs uppercase tracking-wider text-neutral-500 hidden sm:inline">
              Sort by:
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="appearance-none bg-white border border-neutral-300 pl-3 pr-8 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
              >
                <option value="featured">Featured Curations</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Layout Grid: Sidebar Filters (Desktop) + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 items-start">
          
          {/* DESKTOP FILTER SIDEBAR */}
          <aside className="hidden lg:block space-y-8 pr-4 sticky top-28">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-900">
                Filters
              </h3>
              {(activeSubcategory !== 'all' || priceRange !== 'all' || inStockOnly || onSaleOnly) && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-neutral-500 hover:text-black flex items-center gap-1 transition-colors underline"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Subcategories */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-3">
                Subcategory
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => setActiveSubcategory('all')}
                    className={`block w-full text-left py-1 transition-colors ${
                      activeSubcategory === 'all'
                        ? 'font-bold text-neutral-950 underline underline-offset-4'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    All {categoryMeta.label}
                  </button>
                </li>
                {subcategories.map(sub => (
                  <li key={sub.id}>
                    <button
                      onClick={() => setActiveSubcategory(sub.id)}
                      className={`block w-full text-left py-1 transition-colors ${
                        activeSubcategory === sub.id
                          ? 'font-bold text-neutral-950 underline underline-offset-4'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      {sub.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-3">
                Price (INR)
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { id: 'all', label: 'All Prices' },
                  { id: 'under-2000', label: 'Under ₹2,000' },
                  { id: '2000-5000', label: '₹2,000 – ₹5,000' },
                  { id: 'above-5000', label: 'Above ₹5,000' }
                ].map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer text-neutral-700 hover:text-black">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === p.id}
                      onChange={() => setPriceRange(p.id)}
                      className="accent-neutral-900 w-3.5 h-3.5"
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability & Offers */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-3">
                Status & Offers
              </h4>
              <div className="space-y-2.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-700 hover:text-black">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={e => setInStockOnly(e.target.checked)}
                    className="accent-neutral-900 w-3.5 h-3.5"
                  />
                  <span>In Stock Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-neutral-700 hover:text-black">
                  <input
                    type="checkbox"
                    checked={onSaleOnly}
                    onChange={e => setOnSaleOnly(e.target.checked)}
                    className="accent-neutral-900 w-3.5 h-3.5"
                  />
                  <span>On Sale / Discounted</span>
                </label>
              </div>
            </div>

          </aside>

          {/* MAIN PRODUCT CATALOG GRID */}
          <main className="lg:col-span-3">
            {displayedProducts.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-neutral-300 p-8">
                <h3 className="font-display text-xl text-neutral-900 mb-2">
                  No items match your selected filters
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-6">
                  Try adjusting or clearing your price or subcategory filters to discover other pieces from this collection.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 bg-neutral-900 text-white text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {displayedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="mt-14 text-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 6)}
                      className="px-10 py-3.5 border border-neutral-900 text-neutral-900 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-neutral-900 hover:text-white transition-colors"
                    >
                      Load More Products ({filteredProducts.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

        </div>

      </div>

      {/* MOBILE FILTER & SORT DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl flex flex-col z-50">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-900">
                Filters & Sorting
              </span>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-neutral-500 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Subcategories */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 mb-3">
                  Subcategories
                </h4>
                <div className="space-y-2 text-xs">
                  <button
                    onClick={() => setActiveSubcategory('all')}
                    className={`block w-full text-left py-1 ${
                      activeSubcategory === 'all' ? 'font-bold text-black underline' : 'text-neutral-600'
                    }`}
                  >
                    All {categoryMeta.label}
                  </button>
                  {subcategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubcategory(sub.id)}
                      className={`block w-full text-left py-1 ${
                        activeSubcategory === sub.id ? 'font-bold text-black underline' : 'text-neutral-600'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 mb-3">
                  Price
                </h4>
                <div className="space-y-2 text-xs">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under-2000', label: 'Under ₹2,000' },
                    { id: '2000-5000', label: '₹2,000 – ₹5,000' },
                    { id: 'above-5000', label: 'Above ₹5,000' }
                  ].map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-neutral-700">
                      <input
                        type="radio"
                        name="mobilePrice"
                        checked={priceRange === p.id}
                        onChange={() => setPriceRange(p.id)}
                        className="accent-neutral-900"
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 mb-3">
                  Availability
                </h4>
                <label className="flex items-center gap-2 text-xs text-neutral-700">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={e => setInStockOnly(e.target.checked)}
                    className="accent-neutral-900"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 flex gap-2">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 border border-neutral-300 text-neutral-700 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-50"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 bg-neutral-900 text-white text-xs uppercase font-semibold tracking-wider hover:bg-black"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
