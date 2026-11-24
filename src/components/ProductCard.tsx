import React, { useEffect, useState } from 'react';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { Product, ProductColor, ProductVariant } from '../types';
import { useShop } from '../context/ShopContext';
import { ImageWithFallback } from './ImageWithFallback';
import { getEffectiveProductPrice, type EffectiveProductPrice } from '../lib/backend';
import { getProductPriceDisplay } from '../lib/pricing';
import { getVariantColorLabel, variantSupportsColor } from '../lib/cart';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigateToProduct, addToCart, toggleWishlist, isInWishlist } = useShop();
  const defaultVariant = product.variants.find(variant => variant.inStock) ?? product.variants[0] ?? null;
  const defaultColorName = defaultVariant ? getVariantColorLabel(defaultVariant) : null;
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    (defaultColorName
      ? product.colors.find(color => color.name === defaultColorName)
      : product.colors[0]) ?? product.colors[0] ?? { name: 'Default', hex: '#e5e5e5' }
  );
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    defaultVariant
  );
  const [effectivePrice, setEffectivePrice] = useState<EffectiveProductPrice | null>(null);

  useEffect(() => {
    let active = true;
    getEffectiveProductPrice(product.id).then(price => {
      if (active && price) setEffectivePrice({
        ...price,
      });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [product.id]);

  useEffect(() => {
    const variant = product.variants.find(item => item.inStock) ?? product.variants[0] ?? null;
    const colorName = variant ? getVariantColorLabel(variant) : null;
    setSelectedVariant(variant);
    setSelectedColor((colorName
      ? product.colors.find(color => color.name === colorName)
      : product.colors[0]) ?? product.colors[0] ?? { name: 'Default', hex: '#e5e5e5' });
  }, [product]);

  const isSaved = isInWishlist(product.id);
  const priceDisplay = getProductPriceDisplay(product, effectivePrice);
  const variantsForSelectedColor = product.variants.filter(variant =>
    variantSupportsColor(variant, selectedColor.name)
  );

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedVariant) return;
    if (product.variants.length > 1) {
      setShowQuickAdd(true);
    } else {
      addToCart(product, selectedColor, selectedVariant, 1);
    }
  };

  const confirmQuickAdd = (e: React.MouseEvent, variant: ProductVariant) => {
    e.stopPropagation();
    if (!variant.inStock) return;
    addToCart(product, selectedColor, variant, 1);
    setShowQuickAdd(false);
  };

  return (
    <div
      className="group relative flex flex-col bg-white select-none cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowQuickAdd(false);
      }}
      onClick={() => navigateToProduct(product.id)}
    >
      {/* Product Image Container (Aspect 3:4) */}
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 mb-3">
        <ImageWithFallback
          src={isHovered && product.secondaryImage ? product.secondaryImage : product.primaryImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          fallbackText={product.name}
        />

        {/* Badge (if any, clean and subtle) */}
        {product.badge && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] tracking-wider uppercase font-semibold text-neutral-900 px-2.5 py-1">
            {product.badge}
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isSaved
              ? 'bg-neutral-900 text-white'
              : 'bg-white/80 backdrop-blur-xs text-neutral-800 hover:bg-white hover:text-black shadow-xs'
          }`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : 'stroke-[1.5]'}`} />
        </button>

        {/* Quick Add Button or Popover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!showQuickAdd ? (
            <button
              onClick={handleQuickAdd}
              className="w-full py-2.5 bg-white/95 backdrop-blur-xs text-neutral-900 text-xs font-semibold tracking-wider uppercase hover:bg-neutral-900 hover:text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Quick Add
            </button>
          ) : (
            <div 
              className="bg-white p-3 shadow-lg border border-neutral-200 animate-fade-in"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium mb-2">
                Select {product.variantType === 'size' ? 'Size' : 'Option'}:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {variantsForSelectedColor.map(variant => (
                  <button
                    key={variant.id}
                    disabled={!variant.inStock}
                    onClick={(e) => confirmQuickAdd(e, variant)}
                    className={`px-2 py-1 text-xs border font-mono transition-colors ${
                      !variant.inStock
                        ? 'border-neutral-200 text-neutral-300 line-through cursor-not-allowed'
                        : selectedVariant?.id === variant.id
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-300 text-neutral-800 hover:border-neutral-900'
                    }`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Colour Swatches (if more than 1) */}
      {product.colors.length > 1 && (
        <div className="flex items-center gap-1.5 mb-2">
          {product.colors.map(color => (
            <button
              key={color.name}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedColor(color);
                const matchingVariants = product.variants.filter(variant =>
                  variantSupportsColor(variant, color.name)
                );
                setSelectedVariant(
                  matchingVariants.find(variant => variant.inStock) ??
                  matchingVariants[0] ??
                  null
                );
              }}
              className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                selectedColor.name === color.name
                  ? 'ring-1 ring-neutral-950 scale-110 border-white'
                  : 'border-neutral-300 hover:scale-105'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
              aria-label={`Select ${color.name}`}
            />
          ))}
          <span className="text-[10px] text-neutral-500 ml-1">
            {product.colors.length} shades
          </span>
        </div>
      )}

      {/* Unboxed Metadata */}
      <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-1">
        {product.subcategory}
      </div>

      {/* Product Name */}
      <h3 className="text-sm font-medium text-neutral-900 line-clamp-1 group-hover:text-neutral-700 transition-colors">
        {product.name}
      </h3>

      {/* Price Block */}
      <div className="flex items-baseline gap-2 mt-1.5 font-mono">
        <span className="text-sm font-semibold text-neutral-950 tabular-nums">
          ₹{(priceDisplay.priceMinor / 100).toLocaleString('en-IN')}
        </span>
        {priceDisplay.compareAtMinor !== null && (
          <span className="text-xs text-neutral-400 line-through tabular-nums">
            ₹{(priceDisplay.compareAtMinor / 100).toLocaleString('en-IN')}
          </span>
        )}
        {priceDisplay.discountPercent !== null && (
          <span className="text-[11px] font-sans font-medium text-rose-700">
            {priceDisplay.discountPercent}% OFF
          </span>
        )}
      </div>
    </div>
  );
};
