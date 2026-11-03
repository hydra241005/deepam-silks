import React from 'react';
import { Sparkles, ShieldCheck, HeartHandshake, Leaf } from 'lucide-react';

export const BrandStory: React.FC = () => {
  return (
    <section className="py-24 bg-neutral-950 text-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Editorial Brand Narrative */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-[11px] font-semibold tracking-[0.3em] uppercase text-amber-200/80 block mb-3">
            The Philosophy of DEEPAM SILKS
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-normal tracking-tight text-white mb-6 leading-tight text-balance">
            Rooted in heritage. Styled for the modern woman.
          </h2>
          <p className="text-sm sm:text-base text-neutral-300 font-light leading-relaxed">
            DEEPAM SILKS was conceived with a singular devotion: to honor the sublime artistry of India's textile guilds, while reinterpreting each silhouette for effortless contemporary elegance. From hand-spun silks of Varanasi to gentle botanical nightwear, we craft garments and fragrances that move with grace throughout your day.
          </p>
        </div>

        {/* 4 Pillars of Craftsmanship */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-neutral-800">
          
          <div className="flex flex-col items-start">
            <div className="p-3 bg-neutral-900 border border-neutral-800 text-amber-200 mb-4">
              <Sparkles className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="font-display text-lg text-white mb-2 font-medium">
              Artisanal Weaves
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Authentic handloom silks, Bagru woodblock prints, and pure Chanderi crafted by generational master karigars.
            </p>
          </div>

          <div className="flex flex-col items-start">
            <div className="p-3 bg-neutral-900 border border-neutral-800 text-amber-200 mb-4">
              <Leaf className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="font-display text-lg text-white mb-2 font-medium">
              Natural Fibres & Care
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Featherlight combed cotton, Lenzing modal, and chemical-free botanical cosmetic formulations gentle on delicate skin.
            </p>
          </div>

          <div className="flex flex-col items-start">
            <div className="p-3 bg-neutral-900 border border-neutral-800 text-amber-200 mb-4">
              <HeartHandshake className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="font-display text-lg text-white mb-2 font-medium">
              Fair Artisan Trade
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Direct partnership with weaving cooperatives across Rajasthan, Uttar Pradesh, and Madhya Pradesh ensuring transparent wages.
            </p>
          </div>

          <div className="flex flex-col items-start">
            <div className="p-3 bg-neutral-900 border border-neutral-800 text-amber-200 mb-4">
              <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="font-display text-lg text-white mb-2 font-medium">
              Guaranteed Authenticity
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Pure Silk Mark certification, hypoallergenic 18k jewellery plating, and tamper-proof insured express dispatch.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
