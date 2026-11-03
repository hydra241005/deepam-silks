import React from 'react';
import { HeroCampaign } from './HeroCampaign';
import { CategoryGrid } from './CategoryGrid';
import { CampaignBanners } from './CampaignBanners';
import { CuratedCollections } from './CuratedCollections';
import { BrandStory } from './BrandStory';
import { Newsletter } from './Newsletter';
import { ProductCard } from './ProductCard';
import { PRODUCTS } from '../data/products';
import { useShop } from '../context/ShopContext';
import { ArrowRight } from 'lucide-react';

export const HomePageView: React.FC = () => {
  const { navigateToCategory } = useShop();

  // New arrivals products
  const newArrivals = PRODUCTS.filter(p => p.isNewArrival).slice(0, 4);

  // Trending now / bestsellers products
  const trendingNow = PRODUCTS.filter(p => p.isTrending || p.isBestseller).slice(0, 4);

  return (
    <div className="bg-white">
      {/* B. Hero Campaign */}
      <HeroCampaign />

      {/* C. Shop By Category */}
      <CategoryGrid />

      {/* D. New Arrivals */}
      <section className="py-20 bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 mb-10 border-b border-neutral-100">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-neutral-400 block mb-1">
                Just Unveiled
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-neutral-900">
                NEW ARRIVALS
              </h2>
            </div>
            <button
              onClick={() => navigateToCategory('new-arrivals')}
              className="mt-3 sm:mt-0 text-xs font-semibold uppercase tracking-wider text-neutral-900 hover:underline flex items-center gap-1 group"
            >
              <span>View All New Arrivals</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* E. Campaign Banners */}
      <CampaignBanners />

      {/* F. Trending Now */}
      <section className="py-20 bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 mb-10 border-b border-neutral-100">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-neutral-400 block mb-1">
                Customer Favourites
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-neutral-900">
                TRENDING NOW
              </h2>
            </div>
            <button
              onClick={() => navigateToCategory('sarees')}
              className="mt-3 sm:mt-0 text-xs font-semibold uppercase tracking-wider text-neutral-900 hover:underline flex items-center gap-1 group"
            >
              <span>Shop All Trending</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {trendingNow.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* G. Curated Collections */}
      <CuratedCollections />

      {/* H. Brand Story */}
      <BrandStory />

      {/* I. Newsletter */}
      <Newsletter />
    </div>
  );
};
