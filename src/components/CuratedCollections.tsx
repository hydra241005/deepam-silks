import React, { useState } from 'react';
import { CURATED_COLLECTIONS, PRODUCTS } from '../data/products';
import { ProductCard } from './ProductCard';
import { useShop } from '../context/ShopContext';
import { ArrowRight } from 'lucide-react';
import { CategoryId } from '../types';

export const CuratedCollections: React.FC = () => {
  const [activeTab, setActiveTab] = useState(CURATED_COLLECTIONS[0].id);
  const { navigateToCategory } = useShop();

  const currentConfig = CURATED_COLLECTIONS.find(c => c.id === activeTab) || CURATED_COLLECTIONS[0];

  // Filter products based on selected tab
  const filteredProducts = PRODUCTS.filter(product => {
    if (currentConfig.filterTag === 'isFestive') {
      return product.isFestive;
    }
    if (currentConfig.filterCategory) {
      return product.category === currentConfig.filterCategory;
    }
    return true;
  }).slice(0, 4);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-neutral-400 block mb-2">
            Stylist Curations
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-normal text-neutral-900 tracking-tight">
            CURATED FOR YOU
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-light">
            Handpicked edits tailored to signature moments of modern Indian living.
          </p>
        </div>

        {/* Tab Selector (interactive filter controls as functional buttons) */}
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 mb-10">
          {CURATED_COLLECTIONS.map(col => {
            const isActive = activeTab === col.id;
            return (
              <button
                key={col.id}
                onClick={() => setActiveTab(col.id)}
                className={`px-4 sm:px-5 py-2 text-xs uppercase tracking-wider font-medium transition-all duration-200 border ${
                  isActive
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900'
                }`}
              >
                {col.label}
              </button>
            );
          })}
        </div>

        {/* Active Collection Description */}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
            {currentConfig.desc}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All In Category Action */}
        <div className="mt-12 text-center">
          <button
            onClick={() => {
              if (currentConfig.filterCategory) {
                navigateToCategory(currentConfig.filterCategory as CategoryId);
              } else {
                navigateToCategory('sarees');
              }
            }}
            className="inline-flex items-center gap-2 px-8 py-3 border border-neutral-900 text-neutral-900 text-xs font-semibold tracking-[0.16em] uppercase hover:bg-neutral-900 hover:text-white transition-colors"
          >
            <span>Explore Entire {currentConfig.label} Edit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </section>
  );
};
