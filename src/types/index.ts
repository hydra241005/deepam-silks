export type CategoryId = 
  | 'new-arrivals'
  | 'clothing'
  | 'sarees'
  | 'kurtis'
  | 'nightwear'
  | 'jewellery'
  | 'sale';

export type ViewId =
  | 'home'
  | 'category'
  | 'product'
  | 'wishlist'
  | 'order-confirmation'
  | 'login'
  | 'signup'
  | 'admin';

export interface ProductVariant {
  id: string;
  name: string; // e.g., 'XS', 'S', 'M', 'L', 'XL' or '50ml', '100ml', 'Free Size'
  inStock: boolean;
}

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  subcategory: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  isNewArrival?: boolean;
  isTrending?: boolean;
  isBestseller?: boolean;
  isFestive?: boolean;
  rating: number;
  reviewCount: number;
  primaryImage: string;
  secondaryImage: string;
  gallery: string[];
  colors: ProductColor[];
  variants: ProductVariant[];
  variantType: 'size' | 'volume' | 'standard'; // 'size' for clothes, 'standard' for jewellery
  description: string;
  details: string[];
  fabricCare: string[];
  deliveryInfo: string;
  badge?: string; // e.g. "Limited Edition", "Pure Silk", "Handcrafted"
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  selectedColor: ProductColor;
  selectedVariant: ProductVariant;
  quantity: number;
}

export interface FilterState {
  category: CategoryId | 'all';
  subcategory: string | 'all';
  minPrice: number;
  maxPrice: number;
  colors: string[];
  sizes: string[];
  inStockOnly: boolean;
  onSaleOnly: boolean;
  sortBy: 'featured' | 'price-low' | 'price-high' | 'newest' | 'rating';
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'error';
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  pinCode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
}

export interface Order {
  databaseId?: string;
  orderId: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'cod';
  paymentStatus?: 'created' | 'pending' | 'paid' | 'failed' | 'refunded' | 'review';
  status: 'Pending' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled';
  estimatedDelivery: string;
}
