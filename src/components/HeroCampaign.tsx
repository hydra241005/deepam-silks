import React from 'react';
import { useShop } from '../context/ShopContext';
import { ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

export const HeroCampaign: React.FC = () => {
  const { navigateToCategory } = useShop();

  return (
    <section className="relative w-full bg-neutral-900 text-white overflow-hidden">
      {/* Edge-to-edge fashion editorial image container */}
      <div className="relative w-full h-[75vh] min-h-[520px] max-h-[820px]">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=2000&q=85"
          alt="DEEPAM SILKS Festive & Contemporary Ethnic Wear Campaign"
          className="w-full h-full object-cover object-top"
          fallbackText="DEEPAM SILKS CAMPAIGN"
        />

        {/* Sophisticated editorial scrim gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-[1536px] mx-auto px-6 sm:px-8 lg:px-12 pb-14 sm:pb-20 w-full">
            <div className="max-w-2xl">
              
              <span className="inline-block text-[11px] sm:text-xs font-semibold tracking-[0.3em] uppercase text-amber-200/90 mb-3">
                Spring / Festive 2026 Collection
              </span>

              <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-white mb-4 leading-[1.08] text-balance">
                A STYLE OF HER OWN
              </h1>

              <p className="text-base sm:text-lg text-neutral-200 font-light max-w-xl mb-8 leading-relaxed">
                From everyday essentials to unforgettable occasions. Crafted for the modern Indian woman with timeless handloom weaves, modern tailoring, and fine fragrances.
              </p>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigateToCategory('new-arrivals')}
                  className="px-8 py-3.5 bg-white text-neutral-950 text-xs font-semibold tracking-[0.16em] uppercase hover:bg-neutral-100 transition-colors inline-flex items-center justify-center gap-2"
                >
                  SHOP NEW ARRIVALS
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigateToCategory('sarees')}
                  className="px-8 py-3.5 bg-transparent border border-white text-white text-xs font-semibold tracking-[0.16em] uppercase hover:bg-white hover:text-neutral-950 transition-colors inline-flex items-center justify-center"
                >
                  EXPLORE ETHNIC WEAR
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
