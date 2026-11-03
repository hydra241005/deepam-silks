import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  User, 
  Heart, 
  ShoppingBag, 
  ShoppingCart,
  Menu, 
  X, 
  ChevronDown, 
  ChevronRight,
  ArrowRight,
  LogIn,
  UserPlus,
  LogOut
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { CATEGORIES } from '../data/products';
import { CategoryId } from '../types';

export const Header: React.FC = () => {
  const { 
    navigateToHome, 
    navigateToCategory, 
    navigateToWishlist,
    navigateToLogin,
    navigateToSignup,
    cartCount, 
    wishlist, 
    setIsCartOpen, 
    setIsSearchOpen,
    setIsAccountOpen,
    selectedCategory,
    isAuthenticated,
    isAdmin,
    isAuthLoading,
    navigateToAdmin,
    logout,
    addToast,
    activeOffers,
    activeOffersLoading,
    refreshActiveOffers,
  } = useShop();

  const [activeMegaCategory, setActiveMegaCategory] = useState<CategoryId | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<CategoryId | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const megaMenuTimeout = useRef<number | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);

  const handleMouseEnter = (catId: CategoryId) => {
    if (megaMenuTimeout.current) clearTimeout(megaMenuTimeout.current);
    if (catId === 'sale') refreshActiveOffers().catch(() => undefined);
    setActiveMegaCategory(catId);
  };

  const handleMouseLeave = () => {
    megaMenuTimeout.current = window.setTimeout(() => {
      setActiveMegaCategory(null);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (megaMenuTimeout.current) clearTimeout(megaMenuTimeout.current);
    };
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileDropdownOpen]);

  const activeCategoryMeta = CATEGORIES.find(c => c.id === activeMegaCategory);

  const handleLogout = async () => {
    setIsProfileDropdownOpen(false);
    try {
      await logout();
      addToast('Logged out successfully', undefined, 'info');
    } catch (error) {
      addToast(
        'Logout failed',
        error instanceof Error ? error.message : 'Please try again.',
        'error',
      );
    }
  };

  const openAccount = () => {
    setIsProfileDropdownOpen(false);
    setIsAccountOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 transition-shadow duration-200 w-full">
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4 w-full">
          
          {/* Mobile Menu Button (Left on small screens) */}
          <div className="flex items-center lg:hidden shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-neutral-800 hover:text-black transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6 stroke-[1.5]" />
            </button>
          </div>

          {/* ZONE 1: Brand Wordmark */}
          <div className="flex items-center shrink-0">
            <button
              onClick={navigateToHome}
              className="text-left group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
              aria-label="DEEPAM SILKS Home"
            >
              <span className="font-display text-2xl sm:text-3xl tracking-[0.2em] font-medium text-neutral-950 block uppercase">
                DEEPAM SILKS
              </span>
              <span className="hidden sm:block text-[8px] sm:text-[9px] tracking-[0.25em] uppercase text-neutral-500 font-light mt-0.5">
                Her Style. Her Story.
              </span>
            </button>
          </div>

          {/* ZONE 2: Centered Desktop Navigation with Mega Menus */}
          <nav 
            className="hidden lg:flex items-center justify-center flex-1 min-w-0 mx-2 xl:mx-4 h-full"
            aria-label="Main Navigation"
          >
            <div className="flex items-center space-x-0.5 xl:space-x-1.5 2xl:space-x-3 h-full">
              {CATEGORIES.map(category => {
                const isSale = category.id === 'sale';
                const isSelected = selectedCategory === category.id;

                return (
                  <div
                    key={category.id}
                    className="relative h-full flex items-center shrink-0"
                    onMouseEnter={() => handleMouseEnter(category.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => {
                        navigateToCategory(category.id);
                        setActiveMegaCategory(null);
                      }}
                      className={`h-full flex items-center px-1.5 xl:px-2.5 2xl:px-3.5 text-[11px] 2xl:text-xs tracking-[0.06em] xl:tracking-[0.1em] 2xl:tracking-[0.14em] uppercase transition-colors whitespace-nowrap font-medium border-b-2 ${
                        isSale 
                          ? 'text-rose-700 hover:text-rose-900 border-transparent' 
                          : isSelected
                          ? 'text-neutral-950 border-neutral-900'
                          : 'text-neutral-700 hover:text-neutral-950 border-transparent hover:border-neutral-300'
                      }`}
                    >
                      {category.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </nav>

          {/* ZONE 3: Action Icons (Search, Account, Wishlist, Shopping Cart) */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 ml-auto lg:ml-0">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-neutral-700 hover:text-black transition-colors rounded-sm focus-visible:ring-1 focus-visible:ring-black"
              aria-label="Search collection"
              title="Search"
            >
              <Search className="w-5 h-5 stroke-[1.5]" />
            </button>

            {/* Account / Profile */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(v => !v)}
                className={`p-2 transition-colors rounded-sm focus-visible:ring-1 focus-visible:ring-black ${
                  isProfileDropdownOpen ? 'text-black' : 'text-neutral-700 hover:text-black'
                }`}
                aria-label="Account options"
                aria-expanded={isProfileDropdownOpen}
                aria-haspopup="true"
                title="Account"
              >
                <User className="w-5 h-5 stroke-[1.5]" />
              </button>

              {/* Dropdown menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-neutral-200 shadow-lg z-50 py-1">
                  {isAuthLoading ? (
                    <div className="px-4 py-2.5 text-xs text-neutral-500 uppercase tracking-[0.12em]">
                      Loading…
                    </div>
                  ) : isAuthenticated ? (
                    <>
                      <button
                        onClick={openAccount}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors text-left"
                      >
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="uppercase tracking-[0.12em] font-medium">Account</span>
                      </button>
                      {isAdmin && (
                        <>
                          <div className="mx-3 h-px bg-neutral-100" />
                          <button
                            onClick={() => {
                              setIsProfileDropdownOpen(false);
                              navigateToAdmin();
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors text-left"
                          >
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span className="uppercase tracking-[0.12em] font-medium">Admin</span>
                          </button>
                        </>
                      )}
                      <div className="mx-3 h-px bg-neutral-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span className="uppercase tracking-[0.12em] font-medium">Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigateToLogin();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors text-left"
                      >
                        <LogIn className="w-3.5 h-3.5 shrink-0" />
                        <span className="uppercase tracking-[0.12em] font-medium">Login</span>
                      </button>
                      <div className="mx-3 h-px bg-neutral-100" />
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigateToSignup();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors text-left"
                      >
                        <UserPlus className="w-3.5 h-3.5 shrink-0" />
                        <span className="uppercase tracking-[0.12em] font-medium">Sign Up</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={navigateToWishlist}
              className="p-2 text-neutral-700 hover:text-black transition-colors relative rounded-sm focus-visible:ring-1 focus-visible:ring-black"
              aria-label={`Wishlist, ${wishlist.length} saved items`}
              title="Wishlist"
            >
              <Heart className="w-5 h-5 stroke-[1.5]" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-neutral-900 text-white text-[10px] font-mono flex items-center justify-center font-medium">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-neutral-700 hover:text-black transition-colors relative rounded-sm focus-visible:ring-1 focus-visible:ring-black"
              aria-label={`Shopping cart, ${cartCount} items`}
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 stroke-[1.5]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-neutral-900 text-white text-[10px] font-mono flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* DESKTOP MEGA MENU DROPDOWN */}
      {activeMegaCategory && activeCategoryMeta && (
        <div
          className="hidden lg:block absolute left-0 right-0 top-full bg-white border-b border-neutral-200 shadow-xl z-50 animate-fade-in"
          onMouseEnter={() => handleMouseEnter(activeMegaCategory)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="max-w-7xl mx-auto px-8 py-10">
            <div className="grid grid-cols-12 gap-8 items-start">
              
              {/* Category Info */}
              <div className="col-span-3 pr-6 border-r border-neutral-100">
                <span className="text-[10px] tracking-[0.25em] text-neutral-400 uppercase block mb-1">
                  Collection
                </span>
                <h3 className="font-display text-xl text-neutral-900 mb-2 font-medium">
                  {activeCategoryMeta.headline}
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  {activeCategoryMeta.description}
                </p>
                <button
                  onClick={() => {
                    navigateToCategory(activeMegaCategory);
                    setActiveMegaCategory(null);
                  }}
                  className="inline-flex items-center text-xs font-semibold tracking-wider uppercase text-neutral-900 hover:text-neutral-600 transition-colors group"
                >
                  View All {activeCategoryMeta.label}
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* Subcategory Links */}
              <div className="col-span-5 grid grid-cols-2 gap-y-3 gap-x-6">
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                    Categories
                  </h4>
                  <ul className="space-y-2.5">
                    {activeMegaCategory === 'sale' && activeOffersLoading ? <li className="text-xs text-neutral-500">Loading active offers…</li> : activeMegaCategory === 'sale' && activeOffers.length === 0 ? <li className="text-xs text-neutral-500">No active offers</li> : (activeMegaCategory === 'sale' ? activeOffers.map(offer => ({ id: offer.id, label: offer.name })) : activeCategoryMeta.subcategories.map(sub => ({ id: sub, label: sub }))).map(sub => (
                      <li key={sub.id}>
                        <button
                          onClick={() => {
                            navigateToCategory(activeMegaCategory, sub.id);
                            setActiveMegaCategory(null);
                          }}
                          className="text-xs text-neutral-700 hover:text-neutral-950 hover:underline transition-colors block text-left"
                        >
                          {sub.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                    Curations
                  </h4>
                  <ul className="space-y-2.5">
                    <li>
                      <button
                        onClick={() => {
                          navigateToCategory(activeMegaCategory);
                          setActiveMegaCategory(null);
                        }}
                        className="text-xs text-neutral-700 hover:text-neutral-950 hover:underline transition-colors block text-left"
                      >
                        Bestsellers & Icons
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          navigateToCategory(activeMegaCategory);
                          setActiveMegaCategory(null);
                        }}
                        className="text-xs text-neutral-700 hover:text-neutral-950 hover:underline transition-colors block text-left"
                      >
                        New Season Highlights
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          navigateToCategory(activeMegaCategory);
                          setActiveMegaCategory(null);
                        }}
                        className="text-xs text-neutral-700 hover:text-neutral-950 hover:underline transition-colors block text-left"
                      >
                        Artisanal Heritage Edits
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Editorial Feature Image */}
              <div className="col-span-4 pl-4">
                <div 
                  onClick={() => {
                    navigateToCategory(activeMegaCategory);
                    setActiveMegaCategory(null);
                  }}
                  className="group relative cursor-pointer overflow-hidden aspect-[16/10] bg-neutral-100"
                >
                  <img
                    src={activeCategoryMeta.heroImage}
                    alt={activeCategoryMeta.headline}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white text-xs uppercase tracking-widest font-medium">
                      Shop {activeCategoryMeta.label}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MOBILE SLIDE-OUT MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-2xl flex flex-col h-full max-h-[100dvh] overflow-hidden z-50">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 shrink-0">
              <span className="font-display text-xl tracking-[0.2em] font-medium text-neutral-900 uppercase">
                DEEPAM SILKS
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-neutral-500 hover:text-neutral-900"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search in Drawer */}
            <div className="p-4 border-b border-neutral-100 shrink-0">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 bg-neutral-100 text-xs text-neutral-500 rounded-none text-left"
              >
                <span>Search ethnic wear, jewellery, scents...</span>
                <Search className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            {/* Category List with Accordions */}
            <div className="flex-1 overflow-y-auto min-h-0 py-2">
              <ul className="divide-y divide-neutral-100">
                {CATEGORIES.map(cat => {
                  const isExpanded = mobileExpandedCat === cat.id;
                  const isSale = cat.id === 'sale';

                  return (
                    <li key={cat.id}>
                      <div className="flex items-center justify-between px-5 py-3.5">
                        <button
                          onClick={() => {
                            navigateToCategory(cat.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`text-xs uppercase tracking-wider font-medium text-left flex-1 ${
                            isSale ? 'text-rose-700' : 'text-neutral-900'
                          }`}
                        >
                          {cat.label}
                        </button>
                        <button
                          onClick={() => setMobileExpandedCat(isExpanded ? null : cat.id)}
                          className="p-1 text-neutral-400 hover:text-neutral-900"
                          aria-label={`Toggle ${cat.label} subcategories`}
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="bg-neutral-50 px-7 py-3 space-y-2.5">
                          {isSale && activeOffersLoading ? <span className="block text-xs text-neutral-500 py-1">Loading active offers…</span> : isSale && activeOffers.length === 0 ? <span className="block text-xs text-neutral-500 py-1">No active offers</span> : (isSale ? activeOffers.map(offer => ({ id: offer.id, label: offer.name })) : cat.subcategories.map(sub => ({ id: sub, label: sub }))).map(sub => (
                            <button
                              key={sub.id}
                              onClick={() => {
                                navigateToCategory(cat.id, sub.id);
                                setIsMobileMenuOpen(false);
                              }}
                              className="block text-xs text-neutral-600 hover:text-black py-1 text-left w-full"
                            >
                              {sub.label}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              navigateToCategory(cat.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className="block text-xs font-semibold text-neutral-900 hover:underline py-1 text-left w-full pt-1"
                          >
                            View All {cat.label}
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-neutral-100 bg-neutral-50/50 space-y-3 shrink-0">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsCartOpen(true);
                }}
                className="w-full flex items-center justify-between text-xs text-neutral-800 font-medium py-1"
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Shopping Cart ({cartCount})
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
              {!isAuthLoading && isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAccountOpen(true);
                    }}
                    className="w-full flex items-center justify-between text-xs text-neutral-800 font-medium py-1"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Account
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigateToAdmin();
                      }}
                      className="w-full flex items-center justify-between text-xs text-neutral-800 font-medium py-1"
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" /> Admin
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-between text-xs text-neutral-800 font-medium py-1"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Logout
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>
                </>
              ) : !isAuthLoading ? (
                <>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateToLogin();
                    }}
                    className="w-full flex items-center justify-between text-xs text-neutral-800 font-medium py-1"
                  >
                    <span className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" /> Login
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateToSignup();
                    }}
                    className="w-full flex items-center justify-between text-xs text-neutral-800 font-medium py-1"
                  >
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> Sign Up
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>
                </>
              ) : null}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateToWishlist();
                }}
                className="w-full flex items-center justify-between text-xs text-neutral-800 font-medium py-1"
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Saved Wishlist ({wishlist.length})
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
              <div className="pt-2 text-[10px] text-neutral-500 uppercase tracking-widest">
                Her Style. Her Story. · India
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
