import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { ProductCard } from './ProductCard';
import { ImageWithFallback } from './ImageWithFallback';
import { 
  Heart, 
  ShoppingBag, 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Ruler, 
  Star, 
  Share2, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { ProductColor, ProductVariant } from '../types';
import { getEffectiveProductPrice, getPublishedProducts } from '../lib/backend';

export const ProductDetailPage: React.FC = () => {
  const { 
    selectedProductId, 
    navigateToHome, 
    navigateToCategory, 
    addToCart, 
    toggleWishlist, 
    isInWishlist,
    addToast 
  } = useShop();

  const [catalog, setCatalog] = useState(PRODUCTS);
  React.useEffect(() => { getPublishedProducts().then(setCatalog).catch(() => undefined); }, []);
  const product = catalog.find(p => p.id === selectedProductId) || PRODUCTS[0];
  const categoryMeta = CATEGORIES.find(c => c.id === product.category);

  // States
  const [selectedImage, setSelectedImage] = useState(product.primaryImage);
  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants.find(v => v.inStock) || product.variants[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [pinCode, setPinCode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<{
    tested: boolean;
    valid?: boolean;
    message?: string;
  }>({ tested: false });
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<'desc' | 'care' | 'shipping' | null>('desc');
  const [effectivePrice, setEffectivePrice] = useState<{ regular: number; sale: number; discount: number } | null>(null);

  React.useEffect(() => {
    let active = true;
    getEffectiveProductPrice(product.id).then(price => {
      if (active && price) setEffectivePrice({
        regular: price.regularPriceMinor / 100,
        sale: price.effectivePriceMinor / 100,
        discount: price.discountMinor,
      });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [product.id]);

  // Reset states when product changes
  React.useEffect(() => {
    setSelectedImage(product.primaryImage);
    setSelectedColor(product.colors[0]);
    setSelectedVariant(product.variants.find(v => v.inStock) || product.variants[0]);
    setQuantity(1);
    setDeliveryStatus({ tested: false });
  }, [product.id]);

  const isSaved = isInWishlist(product.id);
  const displayRegularPrice = effectivePrice?.discount ? effectivePrice.regular : product.originalPrice;

  // Check Indian PIN code
  const handleCheckPinCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pinCode.trim();
    if (/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setDeliveryStatus({
        tested: true,
        valid: true,
        message: `Delivery available to ${cleanPin}. Estimated arrival in 2–4 business days. Cash on Delivery supported.`
      });
    } else {
      setDeliveryStatus({
        tested: true,
        valid: false,
        message: 'Please enter a valid 6-digit Indian PIN code.'
      });
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast('Link copied to clipboard', product.name, 'info');
    }
  };

  // Related products from the same category
  const relatedProducts = PRODUCTS.filter(
    p => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-neutral-100 bg-neutral-50/50 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-neutral-500 overflow-x-auto whitespace-nowrap" aria-label="Breadcrumb">
            <button onClick={navigateToHome} className="hover:text-black transition-colors">
              Home
            </button>
            <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
            <button 
              onClick={() => navigateToCategory(product.category)} 
              className="hover:text-black uppercase tracking-wider transition-colors shrink-0"
            >
              {categoryMeta?.label || product.category}
            </button>
            <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
            <span className="text-neutral-500 uppercase tracking-wider shrink-0">
              {product.subcategory}
            </span>
            <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
            <span className="text-neutral-900 font-medium truncate max-w-xs">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main PDP Grid: Gallery Left + Sticky Purchase Module Right */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* GALLERY SECTION (7 Columns on Desktop) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            
            {/* Thumbnail Strip */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0 pb-2 md:pb-0">
              {product.gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-20 sm:w-20 sm:h-26 overflow-hidden bg-neutral-100 border transition-all shrink-0 ${
                    selectedImage === img
                      ? 'border-neutral-900 ring-1 ring-neutral-900'
                      : 'border-neutral-200 hover:border-neutral-400 opacity-80 hover:opacity-100'
                  }`}
                  aria-label={`Thumbnail view ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`${product.name} angle ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Primary Main Image (Large Portrait 3:4) */}
            <div className="flex-1 relative aspect-[3/4] overflow-hidden bg-neutral-100 border border-neutral-200/60 shadow-xs">
              <ImageWithFallback
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
                fallbackText={product.name}
              />
              {product.badge && (
                <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs text-[11px] font-semibold tracking-wider uppercase text-neutral-900 px-3 py-1 shadow-xs">
                  {product.badge}
                </span>
              )}
            </div>

          </div>

          {/* CONTIGUOUS PURCHASE MODULE (5 Columns on Desktop, Sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
            
            {/* Category kicker & Title */}
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-400 uppercase tracking-widest mb-1.5 font-medium">
                <span>{product.subcategory}</span>
                <button
                  onClick={handleShare}
                  className="text-neutral-500 hover:text-black flex items-center gap-1 transition-colors"
                  aria-label="Share product"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl text-neutral-950 font-normal tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-2 mt-2.5">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono font-medium text-neutral-800">
                  {product.rating}
                </span>
                <span className="text-neutral-400 text-xs">·</span>
                <span className="text-xs text-neutral-500 underline">
                  {product.reviewCount} reviews
                </span>
              </div>
            </div>

            {/* Price Block */}
            <div className="p-4 bg-neutral-50 border border-neutral-200/80">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-2xl font-bold text-neutral-950 tabular-nums">
                  ₹{(effectivePrice?.sale ?? product.price).toLocaleString('en-IN')}
                </span>
                {displayRegularPrice && (
                  <span className="font-mono text-sm text-neutral-400 line-through tabular-nums">
                    ₹{displayRegularPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {(effectivePrice?.discount ? Math.round((effectivePrice.discount / (effectivePrice.regular * 100)) * 100) : product.discountPercent) && (
                  <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                    Save {effectivePrice?.discount ? Math.round((effectivePrice.discount / (effectivePrice.regular * 100)) * 100) : product.discountPercent}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1 font-light">
                MRP inclusive of all taxes. Free shipping on orders above ₹1,999.
              </p>
            </div>

            {/* Color Swatch Selection */}
            {product.colors.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <span className="font-semibold uppercase tracking-wider text-neutral-900">
                    Colour: <span className="font-normal text-neutral-600">{selectedColor.name}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  {product.colors.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        selectedColor.name === color.name
                          ? 'ring-2 ring-neutral-950 scale-110 border-white'
                          : 'border-neutral-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                      aria-label={`Select color ${color.name}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Variant / Size Selection */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-semibold uppercase tracking-wider text-neutral-900">
                  {product.variantType === 'size'
                    ? 'Select Size'
                    : product.variantType === 'volume'
                    ? 'Bottle Volume'
                    : 'Option'}
                </span>

                {product.variantType === 'size' && (
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="text-neutral-500 hover:text-black flex items-center gap-1 underline transition-colors"
                  >
                    <Ruler className="w-3.5 h-3.5" /> Size Guide
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {product.variants.map(variant => {
                  const isSelected = selectedVariant.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      disabled={!variant.inStock}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2.5 text-xs font-mono tracking-wider border transition-all ${
                        !variant.inStock
                          ? 'border-neutral-200 text-neutral-300 line-through cursor-not-allowed bg-neutral-50'
                          : isSelected
                          ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                          : 'border-neutral-300 text-neutral-800 hover:border-neutral-900 bg-white'
                      }`}
                    >
                      {variant.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper & Add to Bag CTA */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-neutral-300 bg-white h-12 px-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="text-neutral-500 hover:text-black disabled:opacity-30 p-1 text-sm font-mono"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-mono font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-neutral-500 hover:text-black p-1 text-sm font-mono"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Primary Add to Bag Button */}
                <button
                  onClick={() => addToCart(product, selectedColor, selectedVariant, quantity)}
                  className="flex-1 h-12 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.18em] hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  ADD TO SHOPPING BAG
                </button>

                {/* Wishlist Toggle Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`w-12 h-12 border flex items-center justify-center transition-colors ${
                    isSaved
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 text-neutral-800 hover:border-black'
                  }`}
                  aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : 'stroke-[1.5]'}`} />
                </button>
              </div>
            </div>

            {/* Indian Delivery PIN Code Checker */}
            <div className="p-4 bg-white border border-neutral-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-900 mb-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-600" />
                <span>Check Delivery & Cash on Delivery</span>
              </div>
              <form onSubmit={handleCheckPinCode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={e => {
                    setPinCode(e.target.value.replace(/\D/g, ''));
                    setDeliveryStatus({ tested: false });
                  }}
                  placeholder="Enter 6-digit PIN code (e.g. 560001)"
                  className="flex-1 px-3 py-2 text-xs border border-neutral-300 font-mono focus:outline-none focus:border-black"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white text-xs uppercase font-semibold tracking-wider hover:bg-black transition-colors"
                >
                  Check
                </button>
              </form>

              {deliveryStatus.tested && (
                <div
                  className={`mt-2.5 text-xs p-2.5 flex items-start gap-2 ${
                    deliveryStatus.valid
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {deliveryStatus.valid ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : null}
                  <span>{deliveryStatus.message}</span>
                </div>
              )}
            </div>

            {/* Product Accordion (Description, Care, Shipping) */}
            <div className="border-t border-neutral-200 divide-y divide-neutral-200 pt-2">
              
              {/* Product Description */}
              <div>
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'desc' ? null : 'desc')}
                  className="w-full py-3.5 flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-neutral-900"
                >
                  <span>Product Description & Craft</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 transition-transform ${
                      openAccordion === 'desc' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'desc' && (
                  <div className="pb-4 text-xs text-neutral-600 space-y-2 leading-relaxed">
                    <p>{product.description}</p>
                    <ul className="list-disc pl-4 space-y-1 text-neutral-700 pt-1">
                      {product.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Fabric, Care & Maintenance */}
              <div>
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'care' ? null : 'care')}
                  className="w-full py-3.5 flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-neutral-900"
                >
                  <span>Fabric, Care & Preservation</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 transition-transform ${
                      openAccordion === 'care' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'care' && (
                  <div className="pb-4 text-xs text-neutral-600 space-y-1.5 leading-relaxed">
                    <ul className="list-disc pl-4 space-y-1 text-neutral-700">
                      {product.fabricCare.map((care, idx) => (
                        <li key={idx}>{care}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Shipping & Returns */}
              <div>
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                  className="w-full py-3.5 flex items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-neutral-900"
                >
                  <span>Complimentary Shipping & Returns</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 transition-transform ${
                      openAccordion === 'shipping' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'shipping' && (
                  <div className="pb-4 text-xs text-neutral-600 space-y-2 leading-relaxed">
                    <p>{product.deliveryInfo}</p>
                    <p>
                      We offer hassle-free 7-day doorstep exchange and returns on all orders.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-12 border-t border-neutral-200">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400 block mb-1">
                  Complete The Look
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-neutral-900 font-normal">
                  YOU MAY ALSO ADORE
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* SIZE GUIDE MODAL */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowSizeGuide(false)}
          />
          <div className="relative bg-white max-w-lg w-full p-6 sm:p-8 shadow-2xl z-10 border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <h3 className="font-display text-xl font-medium text-neutral-900">
                Women's Apparel Size Guide (Inches)
              </h3>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="text-neutral-400 hover:text-black"
                aria-label="Close size guide"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 overflow-x-auto text-xs">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 uppercase">
                    <th className="py-2.5">Size</th>
                    <th className="py-2.5">Bust</th>
                    <th className="py-2.5">Waist</th>
                    <th className="py-2.5">Hip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-800">
                  <tr><td className="py-2 font-bold">XS</td><td>34"</td><td>28"</td><td>36"</td></tr>
                  <tr><td className="py-2 font-bold">S</td><td>36"</td><td>30"</td><td>38"</td></tr>
                  <tr><td className="py-2 font-bold">M</td><td>38"</td><td>32"</td><td>40"</td></tr>
                  <tr><td className="py-2 font-bold">L</td><td>40"</td><td>34"</td><td>42"</td></tr>
                  <tr><td className="py-2 font-bold">XL</td><td>42"</td><td>36"</td><td>44"</td></tr>
                  <tr><td className="py-2 font-bold">XXL</td><td>44"</td><td>38"</td><td>46"</td></tr>
                </tbody>
              </table>
              <p className="text-[11px] text-neutral-500 mt-4 font-sans">
                Measurements refer to body measurements. If you prefer a relaxed fit for ethnic tunics, we recommend selecting one size up.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE STICKY BUY BAR */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3 flex items-center gap-3">
        <div>
          <span className="text-[10px] text-neutral-500 uppercase block font-mono">Total</span>
          <span className="text-base font-bold font-mono text-neutral-950">
            ₹{(effectivePrice?.sale ?? product.price).toLocaleString('en-IN')}
          </span>
        </div>
        <button
          onClick={() => addToCart(product, selectedColor, selectedVariant, quantity)}
          className="flex-1 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Add to Bag
        </button>
      </div>

    </div>
  );
};
