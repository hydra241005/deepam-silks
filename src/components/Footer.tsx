import React from 'react';
import { useShop } from '../context/ShopContext';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  CreditCard 
} from 'lucide-react';
import { CategoryId } from '../types';

export const Footer: React.FC = () => {
  const { navigateToCategory } = useShop();

  return (
    <footer className="bg-neutral-900 text-white pt-16 pb-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trust Badges Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-neutral-800 text-neutral-300">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-amber-200/90 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white">Free Express Delivery</p>
              <p className="text-[11px] text-neutral-400">On all orders above ₹1,999 in India</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-amber-200/90 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white">7-Day Easy Returns</p>
              <p className="text-[11px] text-neutral-400">Doorstep reverse pickup guarantee</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-200/90 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white">100% Authentic Handlooms</p>
              <p className="text-[11px] text-neutral-400">Pure Silk Mark & tested metals</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-amber-200/90 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white">UPI & COD Available</p>
              <p className="text-[11px] text-neutral-400">Zero fee instant payments or pay on arrival</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-14">
          
          {/* Brand Info */}
          <div className="col-span-2">
            <span className="font-display text-2xl tracking-[0.25em] font-medium text-white block uppercase mb-3">
              DEEPAM SILKS
            </span>
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed mb-6 font-light">
              Her Style. Her Story. India's premier destination for heirloom handloom sarees, contemporary designer kurtis, luxury temple jewellery, and pure mulmul nightwear.
            </p>
            <div className="space-y-2 text-xs text-neutral-400">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neutral-500 shrink-0" />
                <span>Indiranagar 100ft Road, Bengaluru, Karnataka 560038</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
                <span>+91 1800 890 2244 (Mon–Sat, 10 AM – 7 PM IST)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
                <span>care@deepamsilks.in</span>
              </p>
            </div>
          </div>

          {/* Shop Departments */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Shop Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <button onClick={() => navigateToCategory('sarees')} className="hover:text-white transition-colors">
                  Banarasi & Silk Sarees
                </button>
              </li>
              <li>
                <button onClick={() => navigateToCategory('kurtis')} className="hover:text-white transition-colors">
                  Designer Kurtis & Sets
                </button>
              </li>
              <li>
                <button onClick={() => navigateToCategory('nightwear')} className="hover:text-white transition-colors">
                  Mulmul & Satin Sleepwear
                </button>
              </li>
              <li>
                <button onClick={() => navigateToCategory('jewellery')} className="hover:text-white transition-colors">
                  Artisanal Kundan & Polki
                </button>
              </li>
              <li>
                <button onClick={() => navigateToCategory('sale')} className="text-rose-400 hover:text-rose-300 transition-colors">
                  Seasonal Sale (Up to 40% Off)
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Customer Service
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li><a href="#orders" className="hover:text-white transition-colors">Track Your Order</a></li>
              <li><a href="#returns" className="hover:text-white transition-colors">Returns & Exchange Portal</a></li>
              <li><a href="#shipping" className="hover:text-white transition-colors">Shipping & Delivery Rates</a></li>
              <li><a href="#size-guide" className="hover:text-white transition-colors">Women's Size Chart</a></li>
              <li><a href="#faqs" className="hover:text-white transition-colors">Frequently Asked Questions</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Concierge</a></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li><a href="#story" className="hover:text-white transition-colors">About DEEPAM SILKS</a></li>
              <li><a href="#artisans" className="hover:text-white transition-colors">Our Weaver Communities</a></li>
              <li><a href="#sustainability" className="hover:text-white transition-colors">Sustainable Packaging</a></li>
              <li><a href="#careers" className="hover:text-white transition-colors">Careers & Studio</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Payments & Copyright */}
        <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© 2026 DEEPAM SILKS Luxury Retail India Pvt Ltd. All rights reserved.</p>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-neutral-400 font-mono">100% SECURE PAYMENTS:</span>
            <div className="flex items-center gap-2 text-[10px] text-neutral-300 font-mono">
              <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700">UPI</span>
              <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700">RUPAY</span>
              <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700">VISA</span>
              <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700">MASTERCARD</span>
              <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700">COD</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-neutral-400">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Facebook">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Twitter">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
