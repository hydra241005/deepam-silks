import React from 'react';
import { useShop } from '../context/ShopContext';
import { CategoryId } from '../types';
import { ImageWithFallback } from './ImageWithFallback';

interface CategoryTile {
  id: CategoryId;
  title: string;
  subtitle: string;
  image: string;
}

const CATEGORY_TILES: CategoryTile[] = [
  {
    id: 'sarees',
    title: 'Sarees',
    subtitle: 'Banarasi, Chanderi & Mulmul',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'kurtis',
    title: 'Kurtis & Co-ords',
    subtitle: 'Embroidered Sets & Linens',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'nightwear',
    title: 'Nightwear',
    subtitle: 'Mulmul Sets & Silk Satin',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'jewellery',
    title: 'Jewellery',
    subtitle: 'Kundan, Polki & Gold Accents',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'
  }
];

export const CategoryGrid: React.FC = () => {
  const { navigateToCategory } = useShop();

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-neutral-100">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-neutral-400 block mb-1">
              Curated Departments
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-neutral-900">
              SHOP BY CATEGORY
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-2 sm:mt-0 max-w-xs">
            Handcrafted luxury and everyday comfort, tailored for every facet of your life.
          </p>
        </div>

        {/* 6-Category Portrait Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {CATEGORY_TILES.map(cat => (
            <div
              key={cat.id}
              onClick={() => navigateToCategory(cat.id)}
              className="group cursor-pointer flex flex-col"
            >
              {/* Image Frame (Portrait 3:4) */}
              <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 mb-4">
                <ImageWithFallback
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  fallbackText={cat.title}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
              </div>

              {/* Category Titles & Clean Text Link */}
              <div className="flex flex-col items-start">
                <h3 className="font-display text-lg sm:text-xl font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {cat.subtitle}
                </p>
                <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-neutral-900 group-hover:underline underline-offset-4">
                  Shop Collection
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
