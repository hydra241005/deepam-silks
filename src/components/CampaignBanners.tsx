import React from 'react';
import { useShop } from '../context/ShopContext';
import { EDITORIAL_CAMPAIGNS } from '../data/products';
import { ImageWithFallback } from './ImageWithFallback';
import { ArrowRight } from 'lucide-react';

export const CampaignBanners: React.FC = () => {
  const { navigateToCategory } = useShop();

  return (
    <section className="py-20 bg-neutral-50/70 border-y border-neutral-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-neutral-400 block mb-2">
            Seasonal Editorials
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-normal text-neutral-900 tracking-tight">
            CAMPAIGN STORIES
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-2 font-light">
            Thoughtfully styled chapters curated for every milestone, celebration, and quiet evening.
          </p>
        </div>

        {/* 2x2 Clean Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {EDITORIAL_CAMPAIGNS.map(campaign => (
            <div
              key={campaign.id}
              onClick={() => navigateToCategory(campaign.category)}
              className="group cursor-pointer flex flex-col"
            >
              {/* Image Container (16:10 aspect ratio) */}
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-200 mb-6">
                <ImageWithFallback
                  src={campaign.image}
                  alt={campaign.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  fallbackText={campaign.title}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              </div>

              {/* Editorial Copy */}
              <div className="flex flex-col items-start pr-4">
                <h3 className="font-display text-2xl font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors">
                  {campaign.title}
                </h3>
                <p className="text-sm text-neutral-600 mt-1.5 font-light leading-relaxed">
                  {campaign.subtitle}
                </p>
                <div className="mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-[0.15em] text-neutral-950 group-hover:underline underline-offset-4 gap-1.5">
                  <span>{campaign.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
