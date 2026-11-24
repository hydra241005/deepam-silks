import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  reconcileCartStock,
  reconcileStoredCart,
  remainingCartLineQuantity,
  runExclusiveStockUpdate,
  updateCartLineQuantity,
  variantSupportsColor,
} from '../lib/cart';
import {
  createOrder, createPaymentOrder, deleteDeliveryAddress, getAccountData, getSession,
  saveDeliveryAddress, selectPrimaryAddress, signIn, signOut, signUp,
  subscribeToAuthChanges, updateProfile,
  getActiveOffers, getEffectiveProductPrice, getEffectiveProductPrices, getPublishedProducts,
  getVariantStock, resolvePublishedVariantId,
} from '../lib/backend';
import { calculateCartPricing } from '../lib/pricing';
import { getOrderPresentation } from '../lib/order-presentation';
import type {
  DeliveryAddress, DeliveryAddressInput, EffectiveProductPrice, OrderLineInput, PaymentMethod,
  RazorpayPaymentOrder, UserProfile,
} from '../lib/backend';

type StockStatus = 'loading' | 'ready' | 'error';

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
  addToCart: (product: Product, color: ProductColor, variant: ProductVariant, quantity?: number) => Promise<boolean>;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  variantStock: ReadonlyMap<string, number>;
  variantStockStatus: ReadonlyMap<string, StockStatus>;
  refreshVariantStock: (variantIds: string[]) => Promise<Map<string, number>>;
  cartValidationState: StockStatus;
  cartValidationError: string | null;
  retryCartValidation: () => Promise<void>;
  cartCount: number;
  cartSubtotal: number;
  cartShipping: number;
  cartDiscount: number;
  cartTotal: number;
  cartPricingValid: boolean;
  cartPricingError: string | null;
  refreshCartPricing: () => Promise<boolean>;
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

  const [savedCart] = useState<unknown>(() => {
    try {
      const saved = localStorage.getItem('deepam_silks_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return null;
    }
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartRef = useRef<CartItem[]>([]);
  const [variantStock, setVariantStock] = useState<Map<string, number>>(() => new Map());
  const variantStockRef = useRef<Map<string, number>>(new Map());
  const [variantStockStatus, setVariantStockStatus] = useState<Map<string, StockStatus>>(() => new Map());
  const variantStockStatusRef = useRef<Map<string, StockStatus>>(new Map());
  const stockRequestsRef = useRef<Map<string, Promise<number>>>(new Map());
  const pendingVariantUpdatesRef = useRef(new Set<string>());
  const cartItemVersionsRef = useRef(new Map<string, number>());
  const [cartValidationState, setCartValidationState] = useState<StockStatus>('loading');
  const [cartValidationError, setCartValidationError] = useState<string | null>(null);

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
            setRecentOrders([]);
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
          setRecentOrders([]);
        }
      })
      .catch(() => {
        setAuthUser(null);
        setProfile(null);
        setAddresses([]);
        setRecentOrders([]);
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
      setRecentOrders(data.recentOrders);
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
    if (cartValidationState !== 'ready') return;
    try {
      localStorage.setItem('deepam_silks_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart, cartValidationState]);

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

  const commitCart = (nextCart: CartItem[]) => {
    cartRef.current = nextCart;
    setCart(nextCart);
  };

  const bumpCartItemVersion = (cartItemId: string) => {
    const version = (cartItemVersionsRef.current.get(cartItemId) ?? 0) + 1;
    cartItemVersionsRef.current.set(cartItemId, version);
    return version;
  };

  const refreshVariantStock = useCallback(async (variantIds: string[]) => {
    const ids = [...new Set(variantIds)];
    const loadingStatuses = new Map(variantStockStatusRef.current);
    ids.forEach(id => loadingStatuses.set(id, 'loading'));
    variantStockStatusRef.current = loadingStatuses;
    setVariantStockStatus(loadingStatuses);

    const requests = new Map<string, Promise<number>>();
    const missingIds = ids.filter(id => !stockRequestsRef.current.has(id));
    for (let offset = 0; offset < missingIds.length; offset += 100) {
      const batchIds = missingIds.slice(offset, offset + 100);
      const batchRequest = getVariantStock(batchIds);
      for (const id of batchIds) {
        const request = batchRequest.then(stock => stock.get(id) ?? 0);
        stockRequestsRef.current.set(id, request);
        requests.set(id, request);
      }
    }
    ids.forEach(id => {
      const request = stockRequestsRef.current.get(id);
      if (request) requests.set(id, request);
    });

    try {
      const receivedStock = new Map<string, number>();
      const quantities = await Promise.all(ids.map(id => requests.get(id)!));
      ids.forEach((id, index) => receivedStock.set(id, quantities[index]));

      const nextStock = new Map(variantStockRef.current);
      receivedStock.forEach((quantity, id) => nextStock.set(id, quantity));
      variantStockRef.current = nextStock;
      setVariantStock(nextStock);

      const readyStatuses = new Map(variantStockStatusRef.current);
      ids.forEach(id => readyStatuses.set(id, 'ready'));
      variantStockStatusRef.current = readyStatuses;
      setVariantStockStatus(readyStatuses);

      if (receivedStock.size > 0) {
        const previousCart = cartRef.current;
        const nextCart = reconcileCartStock(previousCart, receivedStock);
        const adjusted = previousCart.length !== nextCart.length ||
          previousCart.some((item, index) =>
            nextCart[index]?.id !== item.id || nextCart[index]?.quantity !== item.quantity
          );
        if (adjusted) {
          previousCart.forEach(item => {
            const reconciled = nextCart.find(candidate => candidate.id === item.id);
            if (!reconciled || reconciled.quantity !== item.quantity) bumpCartItemVersion(item.id);
          });
          commitCart(nextCart);
          addToast('Shopping bag updated', 'Quantities were adjusted to current availability.', 'info');
        }
      }
      return receivedStock;
    } catch (error) {
      const errorStatuses = new Map(variantStockStatusRef.current);
      ids.forEach(id => errorStatuses.set(id, 'error'));
      variantStockStatusRef.current = errorStatuses;
      setVariantStockStatus(errorStatuses);
      throw error;
    } finally {
      ids.forEach(id => {
        const request = requests.get(id);
        if (request && stockRequestsRef.current.get(id) === request) {
          stockRequestsRef.current.delete(id);
        }
      });
    }
  }, []);

  const refreshCartPricing = useCallback(async () => {
    const productIds = [...new Set(cartRef.current.map(item => item.productId))];
    if (productIds.length === 0) return true;
    const prices = await getEffectiveProductPrices(productIds);
    const currentCart = cartRef.current;
    if (currentCart.some(item => !prices.has(item.productId))) {
      throw new Error('Cart changed while pricing was refreshed. Please try again.');
    }
    const pricedCart = currentCart.map(item => {
      const price = prices.get(item.productId);
      if (!price) throw new Error(`Pricing is unavailable for product ${item.productId}.`);
      return {
        ...item,
        regularPriceMinor: price.regularPriceMinor,
        effectivePriceMinor: price.effectivePriceMinor,
        discountMinor: price.discountMinor,
        offerId: price.offerId,
      };
    });
    commitCart(pricedCart);
    return calculateCartPricing(pricedCart.map(item => ({
      regularPriceMinor: item.regularPriceMinor ?? Math.round(item.product.price * 100),
      discountMinor: item.discountMinor ?? 0,
      quantity: item.quantity,
    })), appliedPromo?.discountPercent ?? 0).valid;
  }, [appliedPromo]);

  const retryCartValidation = useCallback(async () => {
    setCartValidationState('loading');
    setCartValidationError(null);
    if (!Array.isArray(savedCart) || savedCart.length === 0) {
      commitCart([]);
      setCartValidationState('ready');
      return;
    }
    try {
      const products = await getPublishedProducts();
      const restoredCart = reconcileStoredCart(savedCart, products);
      const prices = await getEffectiveProductPrices([...new Set(restoredCart.map(item => item.productId))]);
      const receivedStock = new Map<string, number>();
      const readyStatuses = new Map(variantStockStatusRef.current);
      products.forEach(product => product.variants.forEach(variant => {
        const quantity = variant.availableQuantity ?? 0;
        receivedStock.set(variant.id, quantity);
        readyStatuses.set(variant.id, 'ready');
      }));
      const nextStock = new Map(variantStockRef.current);
      receivedStock.forEach((quantity, id) => nextStock.set(id, quantity));
      variantStockRef.current = nextStock;
      setVariantStock(nextStock);
      variantStockStatusRef.current = readyStatuses;
      setVariantStockStatus(readyStatuses);
      commitCart(restoredCart.map(item => {
        const price = prices.get(item.productId);
        if (!price) throw new Error(`Pricing is unavailable for product ${item.productId}.`);
        return {
          ...item,
          regularPriceMinor: price.regularPriceMinor,
          effectivePriceMinor: price.effectivePriceMinor,
          discountMinor: price.discountMinor,
          offerId: price.offerId,
        };
      }));
      setCartValidationState('ready');
    } catch (error) {
      console.error('Saved cart stock validation failed', error);
      setCartValidationError('Saved cart stock or pricing could not be verified. Retry before adding or checking out.');
      setCartValidationState('error');
    }
  }, [savedCart]);

  useEffect(() => {
    retryCartValidation().catch(() => undefined);
  }, [retryCartValidation]);

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
  const addToCart = async (
    product: Product,
    selectedColor: ProductColor,
    selectedVariant: ProductVariant,
    quantity = 1
  ): Promise<boolean> => {
    if (cartValidationState !== 'ready') {
      addToast('Cart stock check required', cartValidationError ?? 'Please wait for saved cart validation to finish.', 'error');
      return false;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      addToast('Invalid quantity', 'Choose at least one item.', 'error');
      return false;
    }
    const ownedVariant = product.variants.find(variant =>
      variant.id === selectedVariant.id && variant.name === selectedVariant.name
    );
    if (!ownedVariant) {
      addToast('Invalid product option', 'This variant does not belong to the selected product.', 'error');
      return false;
    }
    if (!variantSupportsColor(ownedVariant, selectedColor.name)) {
      addToast('Invalid color option', 'This color is not available for the selected variant.', 'error');
      return false;
    }

    let canonicalVariantId: string | null = null;
    let latestStock: Map<string, number>;
    let latestPricing: EffectiveProductPrice;
    try {
      if (selectedVariant.availableQuantity !== undefined || selectedVariant.productId !== undefined) {
        if (selectedVariant.productId !== product.id || ownedVariant.productId !== product.id) {
          addToast('Invalid product option', 'This variant does not belong to the selected product.', 'error');
          return false;
        }
        canonicalVariantId = selectedVariant.id;
      } else {
        canonicalVariantId = await resolvePublishedVariantId(product.id, selectedVariant, selectedColor.name);
      }
      if (!canonicalVariantId) {
        addToast('Invalid product option', 'This variant is not available for the selected product.', 'error');
        return false;
      }
      const [stock, pricing] = await Promise.all([
        refreshVariantStock([canonicalVariantId]),
        getEffectiveProductPrice(product.id),
      ]);
      if (!pricing) throw new Error('Product pricing is unavailable.');
      latestStock = stock;
      latestPricing = pricing;
    } catch (error) {
      console.error('Product stock or pricing could not be verified', error);
      addToast('Price or stock unavailable', 'We could not verify current availability and pricing. Please try again.', 'error');
      return false;
    }
    const resolvedVariant = { ...selectedVariant, id: canonicalVariantId, productId: product.id };
    const available = latestStock.get(canonicalVariantId) ?? 0;
    if (available < 1) {
      addToast('Out of stock', `${product.name} is currently unavailable.`, 'info');
      return false;
    }

    const itemKey = `${product.id}-${selectedColor.name}-${canonicalVariantId}`;
    const pricedCart = cartRef.current.map(item => item.productId === product.id ? {
      ...item,
      regularPriceMinor: latestPricing.regularPriceMinor,
      effectivePriceMinor: latestPricing.effectivePriceMinor,
      discountMinor: latestPricing.discountMinor,
      offerId: latestPricing.offerId,
    } : item);
    const existing = pricedCart.find(item => item.id === itemKey);
    const requested = (existing?.quantity ?? 0) + quantity;
    const maximumForLine = remainingCartLineQuantity(cartRef.current, itemKey, available, canonicalVariantId);
    const nextQuantity = Math.min(requested, maximumForLine);
    if (nextQuantity <= (existing?.quantity ?? 0)) {
      addToast('Stock limit reached', `Only ${available} ${selectedVariant.name} item(s) are available.`, 'info');
      return false;
    }
    if (nextQuantity < requested) {
      addToast('Quantity adjusted', `Only ${available} ${selectedVariant.name} item(s) are available.`, 'info');
    }
    const nextItem: CartItem = {
      id: itemKey,
      productId: product.id,
      product,
      selectedColor,
      selectedVariant: { ...resolvedVariant, availableQuantity: available, inStock: true },
      quantity: nextQuantity,
      regularPriceMinor: latestPricing.regularPriceMinor,
      effectivePriceMinor: latestPricing.effectivePriceMinor,
      discountMinor: latestPricing.discountMinor,
      offerId: latestPricing.offerId,
    };
    bumpCartItemVersion(itemKey);
    commitCart(existing
      ? pricedCart.map(item => item.id === itemKey ? nextItem : item)
      : [...pricedCart, nextItem]);
    if (nextQuantity === requested) addToast('Added to Shopping Bag', `${product.name} (${selectedVariant.name})`);
    setIsCartOpen(true);
    return true;
  };

  const removeFromCart = (cartItemId: string) => {
    bumpCartItemVersion(cartItemId);
    commitCart(cartRef.current.filter(item => item.id !== cartItemId));
    addToast('Item removed', 'Your shopping bag was updated', 'info');
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    const item = cartRef.current.find(cartItem => cartItem.id === cartItemId);
    if (!item || !Number.isInteger(quantity)) return;
    if (quantity === item.quantity) return;
    if (quantity < item.quantity) {
      bumpCartItemVersion(cartItemId);
      commitCart(cartRef.current.map(cartItem =>
        cartItem.id === cartItemId ? { ...cartItem, quantity } : cartItem
      ));
      return;
    }

    const variantId = item.selectedVariant.id;
    let requestVersion = 0;
    try {
      const execution = await runExclusiveStockUpdate(
        pendingVariantUpdatesRef.current,
        variantId,
        async () => {
          requestVersion = bumpCartItemVersion(cartItemId);
          return updateCartLineQuantity(
            cartRef.current,
            cartItemId,
            quantity,
            async () => {
              const latest = await refreshVariantStock([variantId]);
              return { cart: cartRef.current, available: latest.get(variantId) ?? 0 };
            }
          );
        }
      );
      if (!execution.acquired) {
        addToast('Stock check in progress', 'Wait for availability to refresh before increasing quantity.', 'info');
        return;
      }
      if (cartItemVersionsRef.current.get(cartItemId) !== requestVersion || !execution.value) return;
      commitCart(execution.value.cart);
      if (execution.value.status === 'limited') {
        addToast('Quantity adjusted', 'Only the currently available quantity can be added.', 'info');
      } else if (execution.value.status === 'removed') {
        addToast('Out of stock', 'This variant is no longer available.', 'info');
      }
    } catch (error) {
      console.error('Cart quantity stock check failed', error);
      addToast('Stock unavailable', 'We could not verify availability. Quantity was not increased.', 'error');
    }
  };

  const clearCart = () => {
    cartRef.current.forEach(item => bumpCartItemVersion(item.id));
    commitCart([]);
  };

  // Calculations
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartPricing = calculateCartPricing(cart.map(item => ({
    regularPriceMinor: item.regularPriceMinor ?? Math.round(item.product.price * 100),
    discountMinor: item.discountMinor ?? 0,
    quantity: item.quantity,
  })), appliedPromo?.discountPercent ?? 0);
  const cartSubtotal = cartPricing.subtotalMinor / 100;
  const cartShipping = cartPricing.shippingMinor / 100;
  const cartDiscount = cartPricing.discountMinor / 100;
  const cartTotal = cartPricing.totalMinor / 100;
  const cartPricingValid = cartPricing.valid;
  const cartPricingError = cartPricing.error;

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
    if ((cartValidationState !== 'ready')) {
      throw new Error(cartValidationError ?? 'Cart stock has not been verified.');
    }
    if (cartRef.current.length === 0) {
      throw new Error('Your shopping bag is empty.');
    }

    if (!await refreshCartPricing()) {
      throw new Error('Combined discounts exceed the subtotal. Remove a promotion before checkout.');
    }
    await refreshVariantStock(cartRef.current.map(item => item.selectedVariant.id));
    const currentCart = cartRef.current;
    if (currentCart.length === 0) {
      throw new Error('Cart availability changed. Please review your shopping bag.');
    }
    const currentPricing = calculateCartPricing(currentCart.map(item => ({
      regularPriceMinor: item.regularPriceMinor ?? Math.round(item.product.price * 100),
      discountMinor: item.discountMinor ?? 0,
      quantity: item.quantity,
    })), appliedPromo?.discountPercent ?? 0);
    if (!currentPricing.valid) {
      throw new Error(currentPricing.error ?? 'Cart pricing could not be verified.');
    }
    if (currentCart.some(item => !variantSupportsColor(item.selectedVariant, item.selectedColor.name))) {
      throw new Error('A selected color is not available for its variant. Review your cart.');
    }
    const items: OrderLineInput[] = currentCart.map(item => ({
      productId: item.productId,
      variantId: item.selectedVariant.id,
      colorName: item.selectedVariant.colorName ?? item.selectedColor.name,
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
    if (completedOrder) {
      const presentation = getOrderPresentation(completedOrder);
      addToast(presentation.toastTitle, `Order ID: ${completedOrder.orderId}`, 'success');
    }
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
        variantStock,
        variantStockStatus,
        refreshVariantStock,
        cartValidationState,
        cartValidationError,
        retryCartValidation,
        cartCount,
        cartSubtotal,
        cartShipping,
        cartDiscount,
        cartTotal,
        cartPricingValid,
        cartPricingError,
        refreshCartPricing,
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
