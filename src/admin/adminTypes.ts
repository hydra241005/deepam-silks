export type AdminSection =
  | 'overview'
  | 'orders'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'sales'
  | 'analytics'
  | 'customers'
  | 'settings';

export type AdminOrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface AdminOrder {
  orderId: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  products: { name: string; qty: number; price: number }[];
  total: number;
  date: string;           // ISO date string
  address: string;
  city: string;
  area: string;
  pinCode: string;
  state: string;
  status: AdminOrderStatus;
  paymentMethod: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  image: string;
  originalPrice: number;
  sellingPrice: number;
  stock: number;
  status: 'Active' | 'Inactive' | 'Out of Stock';
  isFeatured: boolean;
  isNewArrival: boolean;
  discountPercent: number;
  saleStartDate?: string;
  saleEndDate?: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  productCount: number;
  status: 'Active' | 'Inactive';
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  orderCount: number;
  totalSpent: number;
  joinedDate: string;
}

export interface RevenueDataPoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface Notification {
  id: string;
  type: 'order' | 'stock' | 'customer' | 'system';
  message: string;
  time: string;
  read: boolean;
}
