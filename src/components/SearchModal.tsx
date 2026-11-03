import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS } from '../data/products';
import { Search, X, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

const POPULAR_SEARCHES = [
  'Banarasi Silk Saree',
  'Chanderi Kurta Set',
  'Mulmul Night Suit',
  'Polki Chandbali',
  'Kajal',
  'Silk Saree'
];

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, navigateToProduct } = useShop();
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return PRODUCTS.filter(p => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.details.some(d => d.toLowerCase().includes(q))
      );
    });
  }, [query]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsSearchOpen(false)}
      />

      <div className="relative min-h-screen flex flex-col items-center pt-16 sm:pt-24 px-4 pb-12">
        <div className="relative bg-white max-w-3xl w-full shadow-2xl border border-neutral-200 overflow-hidden animate-fade-in">
          
          {/* Search Input Bar */}
          <div className="p-4 sm:p-6 border-b border-neutral-200 flex items-center gap-3">
            <Search className="w-5 h-5 text-neutral-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search sarees, kurtis, jewellery, nightwear..."
              className="flex-1 text-sm sm:text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-neutral-400 hover:text-black text-xs font-mono"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-1 text-neutral-400 hover:text-black ml-2"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results Area / Suggestions */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {!query ? (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-3">
                  Trending Searches
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map(term => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-xs text-neutral-800 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-neutral-900 font-medium mb-1">
                  No matching styles found for "{query}"
                </p>
                <p className="text-xs text-neutral-500">
                  Try searching for general keywords such as 'Silk', 'Kurta', 'Gold', or 'Linen'.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-neutral-500 font-mono">
                    Found <strong className="text-neutral-900">{searchResults.length}</strong> matching results
                  </span>
                </div>

                <div className="divide-y divide-neutral-100">
                  {searchResults.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigateToProduct(p.id);
                      }}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-neutral-50 p-2 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-16 bg-neutral-100 overflow-hidden shrink-0">
                          <ImageWithFallback
                            src={p.primaryImage}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            fallbackText={p.name}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                            {p.subcategory}
                          </span>
                          <h4 className="text-xs font-semibold text-neutral-900 truncate group-hover:text-neutral-700">
                            {p.name}
                          </h4>
                          <span className="text-xs font-mono font-bold text-neutral-950 tabular-nums">
                            ₹{p.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-black transition-transform group-hover:translate-x-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
