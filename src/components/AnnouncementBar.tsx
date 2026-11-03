import React, { useState, useEffect } from 'react';
import { ChevronRight, X } from 'lucide-react';

const MESSAGES = [
  'Discover your new-season favourites · Spring Festive Capsule 2026',
  'Complimentary delivery on all orders above ₹1,999 across India',
  'Enjoy 10% off your first purchase with code WELCOME10'
];

export const AnnouncementBar: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % MESSAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <aside aria-label="Store announcement" className="bg-neutral-900 text-white text-[11px] font-medium tracking-wider uppercase py-2 px-4 relative z-40 transition-colors">
      <div className="max-w-[1536px] w-full mx-auto flex items-center justify-between px-2 sm:px-4">
        <div className="hidden sm:block w-8" />
        
        <div className="flex-1 flex items-center justify-center text-center truncate px-2">
          <span className="truncate transition-opacity duration-300">
            {MESSAGES[index]}
          </span>
          <ChevronRight className="w-3 h-3 ml-1 inline-block opacity-60" />
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="text-neutral-400 hover:text-white transition-colors p-1"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
