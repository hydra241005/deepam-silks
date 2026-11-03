import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { ShippingAddress } from '../types';
import { openRazorpayCheckout } from '../lib/backend';

export const CheckoutModal: React.FC = () => {
  const { 
    isCheckoutOpen, 
    setIsCheckoutOpen, 
    cart, 
    cartSubtotal, 
    cartDiscount, 
    cartShipping, 
    cartTotal,
    placeOrder,
    completeOrder,
  } = useShop();

  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    email: '',
    pinCode: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Karnataka'
  });

  const [paymentMethod] = useState<'cod'>('cod');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCheckoutOpen) return null;

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required.';
    if (!formData.phone.trim() || !/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      errs.phone = 'Valid 10-digit Indian mobile number is required.';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Valid email address is required.';
    }
    if (!formData.pinCode.trim() || !/^[1-9]\d{5}$/.test(formData.pinCode.trim())) {
      errs.pinCode = 'Valid 6-digit Indian PIN code is required.';
    }
    if (!formData.addressLine1.trim()) errs.addressLine1 = 'Street address is required.';
    if (!formData.city.trim()) errs.city = 'City is required.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleCompleteOrder = async () => {
    setIsSubmitting(true);
    setErrors({});
    try {
      const result = await placeOrder(formData, paymentMethod);
      if (result.payment) {
        await openRazorpayCheckout(
          result.payment,
          () => completeOrder(result.order),
          () => setErrors({ form: 'Payment was not completed. Your reservation will expire automatically if you do not retry.' }),
        );
      } else {
        completeOrder(result.order);
      }
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'Checkout could not be completed securely.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCheckoutOpen(false)}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white max-w-2xl w-full shadow-2xl border border-neutral-200 overflow-hidden animate-fade-in my-8">
          
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold block">
                Step {step} of 2
              </span>
              <h2 className="font-display text-xl font-medium text-neutral-900">
                {step === 1 ? 'Shipping & Contact Details' : 'Select Payment Method'}
              </h2>
            </div>
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="p-1 text-neutral-400 hover:text-black"
              aria-label="Close checkout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8">
            
            {/* STEP 1: Address Details */}
            {step === 1 && (
              <form onSubmit={handleNext} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full px-3 py-2.5 text-xs border border-neutral-300 focus:outline-none focus:border-black"
                    />
                    {errors.fullName && <p className="text-[11px] text-rose-600 mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-1">
                      Mobile Number (+91) *
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2.5 text-xs border border-neutral-300 font-mono focus:outline-none focus:border-black"
                    />
                    {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-1">
                    Email Address for Order Confirmation *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2.5 text-xs border border-neutral-300 focus:outline-none focus:border-black"
                  />
                  {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.pinCode}
                      onChange={e => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '') })}
                      placeholder="6 digits"
                      className="w-full px-3 py-2.5 text-xs border border-neutral-300 font-mono focus:outline-none focus:border-black"
                    />
                    {errors.pinCode && <p className="text-[11px] text-rose-600 mt-1">{errors.pinCode}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className="w-full px-3 py-2.5 text-xs border border-neutral-300 focus:outline-none focus:border-black"
                    />
                    {errors.city && <p className="text-[11px] text-rose-600 mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-1">
                      State *
                    </label>
                    <select
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2.5 text-xs border border-neutral-300 bg-white focus:outline-none focus:border-black"
                    >
                      <option value="Karnataka">Karnataka</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Delhi">Delhi NCR</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-800 mb-1">
                    Street Address & Flat / Building *
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={e => setFormData({ ...formData, addressLine1: e.target.value })}
                    placeholder="House/Flat No., Apartment, Street"
                    className="w-full px-3 py-2.5 text-xs border border-neutral-300 focus:outline-none focus:border-black"
                  />
                  {errors.addressLine1 && <p className="text-[11px] text-rose-600 mt-1">{errors.addressLine1}</p>}
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-neutral-200">
                  <div className="text-xs font-mono">
                    <span className="text-neutral-500">Order Total: </span>
                    <strong className="text-neutral-900 font-bold">₹{cartTotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors inline-flex items-center gap-2"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Payment Selection */}
            {step === 2 && (
              <div className="space-y-6">
                
                {/* COD is the only enabled launch payment method. */}
                <div className="space-y-3">
                  <label
                    className="block p-4 border border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked
                        readOnly
                        className="accent-neutral-900"
                      />
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-neutral-700" />
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                          Cash on Delivery (Pay upon arrival)
                        </span>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Receipt Preview */}
                <div className="p-4 bg-neutral-50 border border-neutral-200 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-neutral-600">
                    <span>Delivering to:</span>
                    <span className="text-neutral-900 font-sans">{formData.fullName}, {formData.pinCode}</span>
                  </div>
                    {errors.form && (
                      <p className="mt-3 text-xs text-rose-700" role="alert">{errors.form}</p>
                    )}
                  <div className="flex justify-between text-neutral-600">
                    <span>Total Amount Payable:</span>
                    <span className="text-base font-bold text-neutral-950 font-mono">
                      ₹{cartTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex justify-between items-center border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold uppercase text-neutral-600 hover:text-black inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Address
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteOrder}
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="px-8 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isSubmitting ? 'Submitting securely…' : 'Confirm & Place Order'}
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
