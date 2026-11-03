import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Product, 
  CartItem, 
  CategoryId, 
  ViewId,
  ProductColor, 
  ProductVariant, 
  ToastMessage, 
  ShippingAddress, 
  Order 
} from '../types';
import { PRODUCTS } from '../data/products';
import {
  createOrder, createPaymentOrder, deleteDeliveryAddress, getAccountData, getSession,
  saveDeliveryAddress, selectPrimaryAddress, signIn, signOut, signUp,
  subscribeToAuthChanges, updateProfile,
  getActiveOffers,
} from '../lib/backend';
import type {
  DeliveryAddress, DeliveryAddressInput, OrderLineInput, PaymentMethod,
  RazorpayPaymentOrder, UserProfile,
} from '../lib/backend';

interface ShopContextType {
  // Navigation & Views
  currentView: ViewId;
  selectedCategory: CategoryId | null;
  selectedSubcategory: string | null;
  selectedProductId: string | null;
  navigateToHome: () => void;
  navigateToCategory: (category: CategoryId, subcategory?: string) => void;
  navigateToProduct: (productId: string) => void;
  navigateToWishlist: () => void;
  navigateToLogin: () => void;
  navigateToSignup: () => void;
  navigateToAdmin: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAuthLoading: boolean;
  authenticate: (email: string, password: string) => Promise<{ isAdmin: boolean }>;
  register: (input: { fullName: string; email: string; phone: string; password: string }) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  profile: UserProfile | null;
  addresses: DeliveryAddress[];
  isAccountDataLoading: boolean;
  accountError: string | null;
  refreshAccountData: () => Promise<void>;
  saveProfile: (input: { fullName: string; phone: string }) => Promise<void>;
  saveAddress: (input: DeliveryAddressInput, addressId?: string) => Promise<void>;
  removeAddress: (addressId: string) => Promise<void>;
  makePrimaryAddress: (addressId: string) => Promise<void>;
  activeOffers: Awaited<ReturnType<typeof getActiveOffers>>;
  activeOffersLoading: boolean;
  refreshActiveOffers: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, color: ProductColor, variant: ProductVariant, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartShipping: number;
  cartDiscount: number;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistProducts: Product[];

  // Modals & Drawers
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isAccountOpen: boolean;
  setIsAccountOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Promo Code
  promoCode: string;
  appliedPromo: { code: string; discountPercent: number } | null;
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;

  // Checkout & Orders
  recentOrders: Order[];
  latestOrder: Order | null;
  placeOrder: (address: ShippingAddress, paymentMethod: PaymentMethod) => Promise<{ order: Order; payment?: RazorpayPaymentOrder }>;
  completeOrder: (order?: Order) => void;

  // Toast notifications
  toasts: ToastMessage[];
  addToast: (title: string, description?: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Views
  const [currentView, setCurrentView] = useState<ViewId>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<{ id: string; email: string; isAdmin: boolean } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [isAccountDataLoading, setIsAccountDataLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [activeOffers, setActiveOffers] = useState<Awaited<ReturnType<typeof getActiveOffers>>>([]);
  const [activeOffersLoading, setActiveOffersLoading] = useState(false);

  // Cart state initialized from localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('deepam_silks_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist state initialized from localStorage
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('deepam_silks_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orders history
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [checkoutIdempotencyKey, setCheckoutIdempotencyKey] = useState(() => crypto.randomUUID());

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Promo code
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);

  // Toast messages
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    let active = true;
    getSession()
      .then(({ user }) => {
        if (active) {
          setAuthUser(user);
          if (!user) {
            setProfile(null);
            setAddresses([]);
          }
        }
      })
      .catch(() => {
        if (active) setAuthUser(null);
      })
      .finally(() => {
        if (active) setIsAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => subscribeToAuthChanges(() => {
    getSession()
      .then(({ user }) => {
        setAuthUser(user);
        if (!user) {
          setProfile(null);
          setAddresses([]);
        }
      })
      .catch(() => {
        setAuthUser(null);
        setProfile(null);
        setAddresses([]);
      });
  }), []);

  const refreshAccountData = async () => {
    if (!authUser) return;
    setIsAccountDataLoading(true);
    setAccountError(null);
    try {
      const data = await getAccountData();
      setProfile(data.profile);
      setAddresses(data.addresses);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Account details could not be loaded.';
      setAccountError(message);
      throw error;
    } finally {
      setIsAccountDataLoading(false);
    }
  };

  useEffect(() => {
    if (!authUser) return;
    refreshAccountData().catch(() => undefined);
  }, [authUser?.id]);

  const saveProfile = async (input: { fullName: string; phone: string }) => {
    await updateProfile(input);
    await refreshAccountData();
  };

  const saveAddress = async (input: DeliveryAddressInput, addressId?: string) => {
    await saveDeliveryAddress(input, addressId);
    await refreshAccountData();
  };

  const removeAddress = async (addressId: string) => {
    await deleteDeliveryAddress(addressId);
    await refreshAccountData();
  };

  const makePrimaryAddress = async (addressId: string) => {
    await selectPrimaryAddress(addressId);
    await refreshAccountData();
  };

  const refreshActiveOffers = useCallback(async () => {
    setActiveOffersLoading(true);
    try {
      setActiveOffers(await getActiveOffers());
    } catch {
      setActiveOffers([]);
    } finally {
      setActiveOffersLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshActiveOffers().catch(() => undefined);
  }, []);

  // Cart and wishlist are convenience caches only; authoritative orders stay server-side.
  useEffect(() => {
    try {
      localStorage.setItem('deepam_silks_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('deepam_silks_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  // Toast Helpers
  const addToast = (title: string, description?: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Navigation handlers
  const navigateToHome = () => {
    setCurrentView('home');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedProductId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCategory = (category: CategoryId, subcategory?: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory || null);
    setSelectedProductId(null);
    setCurrentView('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToProduct = (productId: string) => {
    setSelectedProductId(productId);
    setCurrentView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToWishlist = () => {
    setCurrentView('wishlist');
    setSelectedProductId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToLogin = () => {
    setCurrentView('login');
    setSelectedProductId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSignup = () => {
    setCurrentView('signup');
    setSelectedProductId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToAdmin = () => {
    if (!authUser?.isAdmin) {
      addToast('Admin access required', 'Please sign in with an authorized admin account.', 'error');
      setCurrentView('login');
      return;
    }
    setCurrentView('admin');
    setSelectedProductId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const authenticate = async (email: string, password: string) => {
    const { user } = await signIn(email, password);
    setAuthUser(user);
    return user;
  };

  const register = (input: { fullName: string; email: string; phone: string; password: string }) =>
    signUp(input);

  const logout = async () => {
    await signOut();
    setAuthUser(null);
    setCurrentView('home');
  };

  // Cart operations
  const addToCart = (
    product: Product,
    selectedColor: ProductColor,
    selectedVariant: ProductVariant,
    quantity = 1
  ) => {
    setCart(prev => {
      const itemKey = `${product.id}-${selectedColor.name}-${selectedVariant.id}`;
      const existingIndex = prev.findIndex(item => item.id === itemKey);

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        const newItem: CartItem = {
          id: itemKey,
          productId: product.id,
          product,
          selectedColor,
          selectedVariant,
          quantity
        };
        return [...prev, newItem];
      }
    });

    addToast('Added to Shopping Bag', `${product.name} (${selectedVariant.name})`);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
    addToast('Item removed', 'Your shopping bag was updated', 'info');
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  
  // Free shipping above ₹1,999
  const cartShipping = cartSubtotal >= 1999 || cartSubtotal === 0 ? 0 : 150;
  
  const discountPercent = appliedPromo ? appliedPromo.discountPercent : 0;
  const cartDiscount = Math.round((cartSubtotal * discountPercent) / 100);
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + cartShipping);

  // Wishlist
  const toggleWishlist = (productId: string) => {
    const isSaved = wishlist.includes(productId);
    const product = PRODUCTS.find(p => p.id === productId);
    const prodName = product ? product.name : 'Item';

    if (isSaved) {
      setWishlist(prev => prev.filter(id => id !== productId));
      addToast('Removed from Wishlist', prodName, 'info');
    } else {
      setWishlist(prev => [...prev, productId]);
      addToast('Saved to Wishlist', prodName, 'success');
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const wishlistProducts = PRODUCTS.filter(p => wishlist.includes(p.id));

  // Promo Code handling
  const applyPromoCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'WELCOME10') {
      setAppliedPromo({ code: 'WELCOME10', discountPercent: 10 });
      setPromoCode('WELCOME10');
      addToast('Promo Code Applied!', '10% discount on your order', 'success');
      return true;
    } else if (clean === 'FESTIVE15') {
      setAppliedPromo({ code: 'FESTIVE15', discountPercent: 15 });
      setPromoCode('FESTIVE15');
      addToast('Festive Offer Applied!', '15% discount on your order', 'success');
      return true;
    } else {
      addToast('Invalid Promo Code', 'Try WELCOME10 or FESTIVE15', 'error');
      return false;
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
    addToast('Promo Code Removed', '', 'info');
  };

  // Place Order
  const placeOrder = async (
    address: ShippingAddress, 
    paymentMethod: PaymentMethod
  ): Promise<{ order: Order; payment?: RazorpayPaymentOrder }> => {
    if (cart.length === 0) {
      throw new Error('Your shopping bag is empty.');
    }

    const items: OrderLineInput[] = cart.map(item => ({
      productId: item.productId,
      variantId: `${item.productId}-${item.selectedVariant.id}`,
      colorName: item.selectedColor.name,
      quantity: item.quantity,
    }));
    const { order: newOrder } = await createOrder({
      idempotencyKey: checkoutIdempotencyKey,
      address,
      paymentMethod,
      promoCode: appliedPromo?.code,
      items,
    });
    const payment = paymentMethod === 'cod'
      ? undefined
      : await createPaymentOrder(newOrder.databaseId ?? '');

    setLatestOrder(newOrder);
    setRecentOrders(prev => [newOrder, ...prev]);
    return { order: newOrder, payment };
  };

  const completeOrder = (order?: Order) => {
    clearCart();
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setCurrentView('order-confirmation');
    setCheckoutIdempotencyKey(crypto.randomUUID());
    const completedOrder = order ?? latestOrder;
    if (completedOrder) addToast(
      completedOrder.paymentStatus === 'pending' ? 'Payment submitted' : 'Order placed successfully',
      `Order ID: ${completedOrder.orderId}`,
      'success',
    );
  };

  return (
    <ShopContext.Provider
      value={{
        currentView,
        selectedCategory,
        selectedSubcategory,
        selectedProductId,
        navigateToHome,
        navigateToCategory,
        navigateToProduct,
        navigateToWishlist,
        navigateToLogin,
        navigateToSignup,
        navigateToAdmin,
        isAuthenticated: authUser !== null,
        isAdmin: authUser?.isAdmin === true,
        isAuthLoading,
        authenticate,
        register,
        logout,
        profile,
        addresses,
        isAccountDataLoading,
        accountError,
        refreshAccountData,
        saveProfile,
        saveAddress,
        removeAddress,
        makePrimaryAddress,
        activeOffers,
        activeOffersLoading,
        refreshActiveOffers,

        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartShipping,
        cartDiscount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,

        wishlist,
        toggleWishlist,
        isInWishlist,
        wishlistProducts,

        isSearchOpen,
        setIsSearchOpen,
        isAccountOpen,
        setIsAccountOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,

        searchQuery,
        setSearchQuery,

        promoCode,
        appliedPromo,
        applyPromoCode,
        removePromoCode,

        recentOrders,
        latestOrder,
        placeOrder,
        completeOrder,

        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
