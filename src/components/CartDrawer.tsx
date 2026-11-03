import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  X, 
  Trash2, 
  ShoppingCart, 
  ArrowRight, 
  Truck, 
  Tag, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    cartShipping,
    cartDiscount,
    cartTotal,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    setIsCheckoutOpen,
    navigateToHome
  } = useShop();

  const [promoInput, setPromoInput] = useState('');

  if (!isCartOpen) return null;

  // Free shipping threshold ₹1,999
  const threshold = 1999;
  const neededForFreeShipping = Math.max(0, threshold - cartSubtotal);
  const freeShippingProgress = Math.min(100, (cartSubtotal / threshold) * 100);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const success = applyPromoCode(promoInput);
    if (success) setPromoInput('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Container (Strictly bounded to viewport width and height) */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pointer-events-none">
        <div 
          className="w-full sm:w-[420px] max-w-[100vw] sm:max-w-md bg-white shadow-2xl flex flex-col h-full max-h-[100dvh] overflow-hidden pointer-events-auto border-l border-neutral-200"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Cart"
        >
          
          {/* Header (shrink-0 prevents vertical squishing) */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-5 h-5 text-neutral-900 stroke-[1.75]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                Shopping Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-sm transition-colors"
              aria-label="Close shopping cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar (shrink-0) */}
          <div className="bg-neutral-50 px-4 sm:px-5 py-3 border-b border-neutral-200 shrink-0">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="flex items-center gap-1.5 text-neutral-700">
                <Truck className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                {neededForFreeShipping === 0 ? (
                  <span className="text-emerald-700 font-semibold">
                    You've qualified for FREE Standard Delivery!
                  </span>
                ) : (
                  <span>
                    Add <strong className="font-mono">₹{neededForFreeShipping.toLocaleString('en-IN')}</strong> more for FREE delivery
                  </span>
                )}
              </span>
              <span className="font-mono text-[11px] text-neutral-500">
                {Math.round(freeShippingProgress)}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-neutral-900 h-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Item List / Empty State (flex-1 min-h-0 enables proper vertical scroll without expanding bounds) */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5 divide-y divide-neutral-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mb-4">
                  <ShoppingCart className="w-8 h-8 stroke-[1.2]" />
                </div>
                <h3 className="font-display text-lg text-neutral-900 mb-1">
                  Your cart is empty
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mb-6">
                  Explore our new-season sarees, contemporary kurtis, and artisanal fragrances.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateToHome();
                  }}
                  className="px-6 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="py-4 flex gap-3 sm:gap-4 first:pt-0 last:pb-0">
                  {/* Thumbnail */}
                  <div className="w-18 sm:w-20 h-24 sm:h-26 bg-neutral-100 shrink-0 overflow-hidden relative border border-neutral-200/50">
                    <ImageWithFallback
                      src={item.product.primaryImage}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      fallbackText={item.product.name}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-neutral-900 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-400 hover:text-rose-600 p-1 -mr-1 transition-colors"
                          aria-label="Remove item"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-neutral-500 mt-1 space-y-0.5">
                        <p className="truncate">Colour: {item.selectedColor.name}</p>
                        <p className="truncate">Option / Size: {item.selectedVariant.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-neutral-300 text-xs bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1 text-neutral-600 hover:text-black font-mono"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono tabular-nums text-neutral-900 font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-neutral-600 hover:text-black font-mono"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <span className="font-mono text-xs font-bold text-neutral-950 tabular-nums">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action (shrink-0 keeps checkout button always visible in view) */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50/95 space-y-3 shrink-0">
              
              {/* Promo code input */}
              {!appliedPromo ? (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value)}
                      placeholder="Promo code (e.g. WELCOME10)"
                      className="w-full px-3 py-2 pl-8 text-xs bg-white border border-neutral-300 uppercase font-mono placeholder:normal-case focus:outline-none focus:border-black"
                    />
                    <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="submit"
                    className="px-3 sm:px-4 py-2 bg-neutral-900 text-white text-xs font-semibold uppercase hover:bg-black transition-colors shrink-0"
                  >
                    Apply
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 truncate">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      Code <strong>{appliedPromo.code}</strong> applied ({appliedPromo.discountPercent}% OFF)
                    </span>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="text-rose-600 hover:underline text-[11px] font-medium shrink-0 ml-2"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Order calculations */}
              <div className="space-y-1 text-xs text-neutral-600 pt-1 font-mono">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-semibold text-neutral-900">
                    ₹{cartSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="tabular-nums font-semibold">
                      -₹{cartDiscount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="tabular-nums">
                    {cartShipping === 0 ? (
                      <strong className="text-emerald-700 font-sans uppercase text-[11px]">FREE</strong>
                    ) : (
                      `₹${cartShipping}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-950 pt-2 border-t border-neutral-200">
                  <span className="font-sans uppercase">Total (incl. GST)</span>
                  <span className="tabular-nums">
                    ₹{cartTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.16em] hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                PROCEED TO CHECKOUT
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <p className="text-[10px] text-neutral-400 text-center">
                Secure 256-bit SSL encrypted checkout. All Indian payment methods supported.
              </p>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
