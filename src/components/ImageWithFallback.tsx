import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'DEEPAM SILKS product image',
  className = '',
  fallbackText = 'DEEPAM SILKS',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError || !src) {
    return (
      <div
        className={`bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 p-4 border border-neutral-200/50 select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sparkles className="w-5 h-5 mb-2 stroke-[1.5] text-neutral-400" />
        <span className="font-display text-xs uppercase tracking-widest text-neutral-600 font-semibold">
          {fallbackText}
        </span>
        <span className="text-[10px] text-neutral-400 tracking-wider mt-0.5 uppercase">
          Curated Editorial
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-neutral-100 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse flex items-center justify-center">
          <span className="font-display text-[10px] uppercase tracking-widest text-neutral-400">
            DEEPAM SILKS
          </span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
    </div>
  );
};
