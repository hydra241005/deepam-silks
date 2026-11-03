import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Please provide an email address.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <section className="py-20 bg-neutral-100 border-t border-neutral-200/80">
      <div className="max-w-3xl mx-auto px-6 text-center">
        
        <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-neutral-500 block mb-2">
          The DEEPAM SILKS Club
        </span>
        
        <h2 className="font-display text-3xl sm:text-4xl font-normal text-neutral-900 tracking-tight mb-3">
          BE THE FIRST TO KNOW
        </h2>
        
        <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto mb-8 font-light leading-relaxed">
          Subscribe to receive secret preview invitations, private festive drops, and enjoy <span className="font-semibold text-neutral-900">10% off</span> your first order.
        </p>

        {isSubmitted ? (
          <div className="bg-white p-6 border border-neutral-200/80 max-w-md mx-auto shadow-xs animate-fade-in">
            <div className="flex items-center justify-center text-emerald-600 mb-2">
              <CheckCircle2 className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-display text-lg text-neutral-900 font-medium">
              Welcome to DEEPAM SILKS
            </h3>
            <p className="text-xs text-neutral-600 mt-1">
              Your invitation has been registered. Use exclusive promo code:
            </p>
            <div className="mt-3 inline-block bg-neutral-100 px-4 py-1.5 font-mono text-sm font-semibold tracking-wider text-neutral-900 border border-neutral-200">
              WELCOME10
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 bg-white border border-neutral-300 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-neutral-950 text-white text-xs font-semibold tracking-[0.16em] uppercase hover:bg-neutral-800 transition-colors inline-flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>SUBSCRIBE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {error && (
              <p className="text-xs text-rose-600 mt-2 text-left animate-fade-in font-medium">
                {error}
              </p>
            )}
            <p className="text-[11px] text-neutral-400 mt-3 font-light">
              By subscribing, you agree to our Privacy Policy. You can unsubscribe at any time.
            </p>
          </form>
        )}

      </div>
    </section>
  );
};
