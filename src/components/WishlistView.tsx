import React from 'react';
import { useShop } from '../context/ShopContext';
import { ProductCard } from './ProductCard';
import { Heart, ArrowRight, ChevronRight } from 'lucide-react';

export const WishlistView: React.FC = () => {
  const { wishlistProducts, navigateToHome, navigateToCategory } = useShop();

  return (
    <div className="bg-white min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-400 mb-6" aria-label="Breadcrumb">
          <button onClick={navigateToHome} className="hover:text-black transition-colors">
            Home
          </button>
          <ChevronRight className="w-3 h-3 text-neutral-300" />
          <span className="text-neutral-900 uppercase tracking-wider font-medium">
            Saved Wishlist
          </span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 mb-10 border-b border-neutral-200">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-neutral-400 block mb-1">
              Your Personal Edits
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-normal text-neutral-900 tracking-tight">
              MY WISHLIST
            </h1>
          </div>
          <div className="text-xs text-neutral-500 font-mono mt-2 sm:mt-0">
            <span className="font-bold text-neutral-900 tabular-nums">
              {wishlistProducts.length}
            </span>{' '}
            {wishlistProducts.length === 1 ? 'ITEM SAVED' : 'ITEMS SAVED'}
          </div>
        </div>

        {/* Wishlist Grid or Empty State */}
        {wishlistProducts.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mx-auto mb-4">
              <Heart className="w-8 h-8 stroke-[1.2]" />
            </div>
            <h2 className="font-display text-xl text-neutral-900 mb-2">
              Your wishlist is currently empty
            </h2>
            <p className="text-xs text-neutral-500 mb-8 leading-relaxed">
              Explore our handloom sarees, daily kurtis, and artisanal fine jewellery. Click the heart icon on any piece to save it for later.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigateToCategory('sarees')}
                className="px-6 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
              >
                Explore Sarees
              </button>
              <button
                onClick={() => navigateToCategory('kurtis')}
                className="px-6 py-3 border border-neutral-900 text-neutral-900 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-900 hover:text-white transition-colors"
              >
                Shop Kurtis
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {wishlistProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
