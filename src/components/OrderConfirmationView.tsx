import React from 'react';
import { useShop } from '../context/ShopContext';
import { CheckCircle2, Package, Truck, ArrowRight, Printer } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { getOrderPresentation } from '../lib/order-presentation';

export const OrderConfirmationView: React.FC = () => {
  const { latestOrder, navigateToHome, navigateToCategory } = useShop();

  if (!latestOrder) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <h2 className="font-display text-2xl text-neutral-900 mb-2">No Active Order Found</h2>
        <p className="text-xs text-neutral-500 mb-6">Explore our curated collections to place your next order.</p>
        <button
          onClick={navigateToHome}
          className="px-6 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const presentation = getOrderPresentation(latestOrder);

  return (
    <div className="bg-neutral-50/70 min-h-screen py-12 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Receipt Card */}
        <div className="bg-white border border-neutral-200/80 shadow-sm p-6 sm:p-10">
          
          {/* Header Status */}
          <div className="text-center pb-8 border-b border-neutral-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-400 block mb-1">
              {presentation.statusLabel}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-neutral-900">
              Thank You, {latestOrder.shippingAddress.fullName}
            </h1>
            <p className="text-xs text-neutral-500 mt-2">
              Your order receipt is saved to your account under{' '}
              <strong className="text-neutral-900">{latestOrder.shippingAddress.email}</strong>
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-neutral-100 px-4 py-1.5 font-mono text-xs border border-neutral-200">
              <span className="text-neutral-500">Order ID:</span>
              <strong className="text-neutral-900">{latestOrder.orderId}</strong>
            </div>
          </div>

          {/* Logistics ETA & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-neutral-200 text-xs">
            <div>
              <h4 className="font-semibold uppercase tracking-wider text-neutral-900 mb-2 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-neutral-600" /> Estimated Delivery
              </h4>
              <p className="text-neutral-700 font-medium">{latestOrder.estimatedDelivery}</p>
              <p className="text-neutral-500 text-[11px] mt-0.5">
                Standard insured courier via BlueDart / Delhivery Express
              </p>
            </div>

            <div>
              <h4 className="font-semibold uppercase tracking-wider text-neutral-900 mb-2">
                Shipping Destination
              </h4>
              <p className="text-neutral-700">{latestOrder.shippingAddress.fullName}</p>
              <p className="text-neutral-500">{latestOrder.shippingAddress.addressLine1}</p>
              <p className="text-neutral-500 font-mono">
                {latestOrder.shippingAddress.city}, {latestOrder.shippingAddress.state} - {latestOrder.shippingAddress.pinCode}
              </p>
              <p className="text-neutral-500 font-mono mt-0.5">Phone: +91 {latestOrder.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Itemized Order List */}
          <div className="py-6 border-b border-neutral-200">
            <h4 className="font-semibold uppercase tracking-wider text-neutral-900 text-xs mb-4 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-neutral-600" /> Items in this Order ({latestOrder.items.length})
            </h4>

            <div className="divide-y divide-neutral-100">
              {latestOrder.items.map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-16 bg-neutral-100 shrink-0 overflow-hidden">
                      <ImageWithFallback
                        src={item.product.primaryImage}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        fallbackText={item.product.name}
                      />
                    </div>
                    <div className="min-w-0 text-xs">
                      <p className="font-semibold text-neutral-900 truncate">{item.product.name}</p>
                      <p className="text-neutral-500 text-[11px]">
                        {item.selectedColor.name} · {item.selectedVariant.name} · Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold tabular-nums text-neutral-900 shrink-0">
                    ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="pt-6 pb-2 space-y-2 text-xs font-mono text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">₹{latestOrder.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {latestOrder.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Promotional Savings</span>
                <span className="tabular-nums">-₹{latestOrder.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span className="tabular-nums">
                {latestOrder.shipping === 0 ? 'FREE' : `₹${latestOrder.shipping}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-neutral-950 pt-3 border-t border-neutral-200">
              <span className="font-sans uppercase">
                {latestOrder.paymentStatus === 'paid' ? 'Total Paid' : 'Total Payable'} ({latestOrder.paymentMethod.toUpperCase()})
              </span>
              <span className="tabular-nums">₹{latestOrder.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-5 py-2.5 border border-neutral-300 text-neutral-700 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-50 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Order Receipt
            </button>
            <button
              onClick={navigateToHome}
              className="w-full sm:w-auto px-8 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
