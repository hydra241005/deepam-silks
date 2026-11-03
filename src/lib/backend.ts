import { Order, Product, ShippingAddress } from '../types';
import { PRODUCTS } from '../data/products';
import { requireSupabase, supabase } from './supabase';
import { isValidOrderInput, isPaymentMethod, minorUnitsToDisplay } from './security';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod';

export interface OrderLineInput {
  productId: string;
  variantId: string;
  colorName: string;
  quantity: number;
}

interface DatabaseOrder {
  id: string;
  order_number: string;
  created_at: string;
  subtotal_minor: number;
  discount_minor: number;
  shipping_minor: number;
  total_minor: number;
  payment_method: PaymentMethod;
  payment_status: string;
  fulfillment_status: string;
  shipping_address: ShippingAddress;
}

interface DatabaseOrderItem {
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string;
  color_name: string;
  unit_price_minor: number;
  quantity: number;
  product_snapshot: {
    product_id: string;
    product_name: string;
    category: string;
    price_minor: number;
    primary_image?: string;
  };
}

export interface AdminOrderRecord {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  products: { name: string; qty: number; price: number }[];
  total: number;
  date: string;
  address: string;
  city: string;
  area: string;
  pinCode: string;
  state: string;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentMethod: string;
  paymentStatus: string;
}

export interface AdminProductRecord {
  id: string;
  name: string;
  category: string;
  image: string;
  sellingPrice: number;
  stock: number;
  status: 'Active' | 'Inactive' | 'Out of Stock';
  variants: { id: string; name: string; stock: number }[];
}

export interface ActiveOfferRecord {
  id: string;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  productIds: string[];
}

export interface AdminCustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  orderCount: number;
  totalSpent: number;
  joinedDate: string;
}

export interface AdminOfferRecord {
  id: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  products: { id: string; name: string; category: string; regularPrice: number; image: string }[];
}

export interface AdminCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
  productCount: number;
}

export interface StoreSettingsRecord {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  supportEmail: string;
  supportPhone: string;
  currency: 'INR';
  freeDeliveryThreshold: number;
  deliveryFee: number;
  announcement: string;
  notifications: { newOrder: boolean; lowStock: boolean; newCustomer: boolean; cancellation: boolean };
}

export interface EffectiveProductPrice {
  regularPriceMinor: number;
  effectivePriceMinor: number;
  discountMinor: number;
  offerId: string | null;
}

export const getEffectiveProductPrice = async (productId: string): Promise<EffectiveProductPrice | null> => {
  const { data, error } = await requireSupabase().rpc('effective_product_price', { p_product_id: productId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    regularPriceMinor: Number(row.regular_price_minor),
    effectivePriceMinor: Number(row.effective_price_minor),
    discountMinor: Number(row.discount_minor),
    offerId: row.offer_id ?? null,
  };
};

const requireAdmin = async () => {
  const session = await getSession();
  if (!session.user?.isAdmin) throw new Error('Administrator access required.');
  return session.user.id;
};

const formatAdminStatus = (fulfillment: string, payment: string): AdminOrderRecord['status'] =>
  fulfillment === 'cancelled' ? 'Cancelled'
    : fulfillment === 'delivered' ? 'Delivered'
      : fulfillment === 'shipped' ? 'Shipped'
        : fulfillment === 'processing' ? 'Processing'
          : payment === 'paid' ? 'Confirmed' : 'Pending';

const addressParts = (address: ShippingAddress) => ({
  address: [address.addressLine1, address.addressLine2].filter(Boolean).join(', '),
  city: address.city,
  area: address.addressLine2 ?? '',
  pinCode: address.pinCode,
  state: address.state,
});

export const getAdminOrders = async (): Promise<AdminOrderRecord[]> => {
  await requireAdmin();
  const client = requireSupabase();
  const [{ data: orders, error: ordersError }, { data: items, error: itemsError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      client.from('orders').select('id, order_number, user_id, created_at, total_minor, payment_method, payment_status, fulfillment_status, shipping_address').order('created_at', { ascending: false }),
      client.from('order_items').select('order_id, product_name, quantity, unit_price_minor'),
      client.from('profiles').select('id, full_name, phone'),
    ]);
  if (ordersError) throw ordersError;
  if (itemsError) throw itemsError;
  if (profilesError) throw profilesError;
  const profileMap = new Map((profiles ?? []).map(profile => [profile.id, profile]));
  return (orders ?? []).map(order => {
    const shipping = order.shipping_address as ShippingAddress;
    const profile = profileMap.get(order.user_id);
    const customerEmail = typeof shipping.email === 'string' ? shipping.email : '';
    return {
      id: order.id,
      orderId: order.order_number,
      customerName: profile?.full_name ?? shipping.fullName ?? 'Customer',
      customerEmail,
      phone: profile?.phone ?? shipping.phone ?? '',
      products: (items ?? []).filter(item => item.order_id === order.id).map(item => ({
        name: item.product_name,
        qty: item.quantity,
        price: minorUnitsToDisplay(item.unit_price_minor),
      })),
      total: minorUnitsToDisplay(order.total_minor),
      date: new Date(order.created_at).toISOString().slice(0, 10),
      ...addressParts(shipping),
      status: formatAdminStatus(order.fulfillment_status, order.payment_status),
      paymentMethod: order.payment_method.toUpperCase(),
      paymentStatus: order.payment_status,
    };
  });
};

export const updateAdminOrderStatus = async (orderId: string, status: AdminOrderRecord['status']) => {
  await requireAdmin();
  const fulfillmentStatus = status === 'Cancelled' ? 'cancelled'
    : status === 'Delivered' ? 'delivered'
      : status === 'Shipped' ? 'shipped'
        : status === 'Processing' ? 'processing' : 'pending';
  const { error } = await requireSupabase().rpc('update_order_fulfillment_status', {
    p_order_id: orderId,
    p_status: fulfillmentStatus,
  });
  if (error) throw new Error(error.message);
};

const offerStatus = (offer: { active: boolean; starts_at: string; ends_at: string }) => {
  if (!offer.active) return 'Inactive';
  const now = Date.now();
  if (now < Date.parse(offer.starts_at)) return 'Scheduled';
  if (now > Date.parse(offer.ends_at)) return 'Expired';
  return 'Active';
};

export const getAdminOffers = async (): Promise<AdminOfferRecord[]> => {
  await requireAdmin();
  const client = requireSupabase();
  const [{ data: offers, error: offersError }, { data: links, error: linksError }, { data: products, error: productsError }] =
    await Promise.all([
      client.from('offers').select('id, name, description, discount_type, discount_value, starts_at, ends_at, active, created_at').order('starts_at', { ascending: false }),
      client.from('product_discounts').select('product_id, offer_id'),
      client.from('products').select('id, name, category, price_minor, primary_image'),
    ]);
  if (offersError) throw offersError;
  if (linksError) throw linksError;
  if (productsError) throw productsError;
  return (offers ?? []).map(offer => ({
    id: offer.id,
    name: offer.name,
    description: offer.description,
    discountType: offer.discount_type,
    discountValue: offer.discount_type === 'percentage' ? offer.discount_value : minorUnitsToDisplay(offer.discount_value),
    startsAt: offer.starts_at,
    endsAt: offer.ends_at,
    active: offer.active,
    products: (links ?? []).filter(link => link.offer_id === offer.id).map(link => {
      const product = (products ?? []).find(item => item.id === link.product_id);
      return {
        id: link.product_id,
        name: product?.name ?? link.product_id,
        category: product?.category ?? '',
        regularPrice: minorUnitsToDisplay(product?.price_minor ?? 0),
        image: product?.primary_image ?? '',
      };

    }),
  }));
};

export const getActiveOffers = async (): Promise<ActiveOfferRecord[]> => {
  const client = requireSupabase();
  const now = new Date().toISOString();
  const [{ data: offers, error: offersError }, { data: links, error: linksError }] = await Promise.all([
    client.from('offers').select('id, name, description, starts_at, ends_at, discount_type, discount_value')
      .eq('active', true).lte('starts_at', now).gte('ends_at', now),
    client.from('product_discounts').select('offer_id, product_id'),
  ]);
  if (offersError) throw offersError;
  if (linksError) throw linksError;
  return (offers ?? []).map(offer => ({
    id: offer.id,
    name: offer.name,
    description: offer.description,
    startsAt: offer.starts_at,
    endsAt: offer.ends_at,
    discountType: offer.discount_type,
    discountValue: offer.discount_type === 'fixed' ? minorUnitsToDisplay(offer.discount_value) : offer.discount_value,
    productIds: (links ?? []).filter(link => link.offer_id === offer.id).map(link => link.product_id),
  }));
};

export const getPublishedProducts = async (): Promise<Product[]> => {
  const client = requireSupabase();
  const [{ data: products, error: productError }, { data: variants, error: variantError }, { data: inventory, error: inventoryError }] = await Promise.all([
    client.from('products').select('id, name, category, price_minor, published, primary_image, description, subcategory, featured, created_at').eq('published', true).order('created_at', { ascending: false }),
    client.from('product_variants').select('id, product_id, name, active'),
    client.from('inventory').select('variant_id, available_quantity'),
  ]);
  if (productError) throw productError;
  if (variantError) throw variantError;
  if (inventoryError) throw inventoryError;
  const stock = new Map((inventory ?? []).map(item => [item.variant_id, item.available_quantity]));
  return (products ?? []).map(row => {
    const existing = PRODUCTS.find(product => product.id === row.id);
    const productVariants = (variants ?? []).filter(variant => variant.product_id === row.id && variant.active).map(variant => ({
      id: variant.id,
      name: variant.name,
      inStock: (stock.get(variant.id) ?? 0) > 0,
    }));
    if (existing) return { ...existing, name: row.name, price: minorUnitsToDisplay(row.price_minor), primaryImage: row.primary_image, variants: productVariants.length ? productVariants : existing.variants };
    return {
      id: row.id,
      name: row.name,
      category: row.category as Product['category'],
      subcategory: row.subcategory || row.category,
      price: minorUnitsToDisplay(row.price_minor),
      rating: 0,
      reviewCount: 0,
      primaryImage: row.primary_image,
      secondaryImage: row.primary_image,
      gallery: [row.primary_image],
      colors: [],
      variants: productVariants,
      variantType: 'standard' as const,
      description: row.description,
      details: [],
      fabricCare: [],
      deliveryInfo: 'Cash on Delivery available.',
      isNewArrival: row.featured,
    };
  });
};

export const saveAdminOffer = async (input: {
  id?: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  productIds: string[];
}) => {
  await requireAdmin();
  const start = new Date(input.startsAt);
  const end = new Date(input.endsAt);
  if (!input.name.trim() || Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end <= start) {
    throw new Error('Offer name and a valid date range are required.');
  }
  if (!Number.isFinite(input.discountValue) || input.discountValue <= 0 ||
      (input.discountType === 'percentage' && input.discountValue > 100)) {
    throw new Error('Discount must be greater than zero and percentage discounts cannot exceed 100.');
  }
  const client = requireSupabase();
  const values = {
    name: input.name.trim(),
    description: input.description.trim(),
    discount_type: input.discountType,
    discount_value: input.discountType === 'fixed' ? Math.round(input.discountValue * 100) : Math.round(input.discountValue),
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    active: input.active,
    updated_at: new Date().toISOString(),
  };
  const result = input.id
    ? await client.from('offers').update(values).eq('id', input.id).select('id').single()
    : await client.from('offers').insert(values).select('id').single();
  if (result.error) throw result.error;
  const offerId = input.id ?? result.data.id;
  if (input.id) {
    const { error } = await client.from('product_discounts').delete().eq('offer_id', offerId);
    if (error) throw error;
  }
  if (input.productIds.length) {
    const { error } = await client.from('product_discounts').insert(input.productIds.map(productId => ({ product_id: productId, offer_id: offerId })));
    if (error) throw error;
  }
};

export const deleteAdminOffer = async (offerId: string) => {
  await requireAdmin();
  const { error } = await requireSupabase().from('offers').delete().eq('id', offerId);
  if (error) throw error;
};

export const getAdminCategories = async (): Promise<AdminCategoryRecord[]> => {
  await requireAdmin();
  const client = requireSupabase();
  const [{ data: categories, error: categoryError }, { data: products, error: productError }] = await Promise.all([
    client.from('categories').select('id, name, slug, description, image, active').order('name'),
    client.from('products').select('category_id'),
  ]);
  if (categoryError) throw categoryError;
  if (productError) throw productError;
  return (categories ?? []).map(category => ({
    ...category,
    productCount: (products ?? []).filter(product => product.category_id === category.id).length,
  }));
};

export const saveAdminCategory = async (input: Omit<AdminCategoryRecord, 'id' | 'productCount'> & { id?: string }) => {
  await requireAdmin();
  if (!input.name.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    throw new Error('Category name and slug are invalid.');
  }
  const values = { name: input.name.trim(), slug: input.slug, description: input.description.trim(), image: input.image.trim(), active: input.active, updated_at: new Date().toISOString() };
  const query = input.id
    ? requireSupabase().from('categories').update(values).eq('id', input.id)
    : requireSupabase().from('categories').insert(values);
  const { error } = await query;
  if (error) throw error;
};

export const deleteAdminCategory = async (categoryId: string) => {
  await requireAdmin();
  const client = requireSupabase();
  const { error: clearError } = await client.from('products').update({ category_id: null }).eq('category_id', categoryId);
  if (clearError) throw clearError;
  const { error } = await client.from('categories').delete().eq('id', categoryId);
  if (error) throw error;
};

export const getStoreSettings = async (): Promise<StoreSettingsRecord> => {
  const { data, error } = await requireSupabase().from('store_settings').select('*').eq('id', true).single();
  if (error) throw error;
  return {
    storeName: data.store_name, contactEmail: data.contact_email, contactPhone: data.contact_phone,
    supportEmail: data.support_email, supportPhone: data.support_phone, currency: data.currency,
    freeDeliveryThreshold: minorUnitsToDisplay(data.free_delivery_threshold_minor),
    deliveryFee: minorUnitsToDisplay(data.delivery_fee_minor), announcement: data.announcement,
    notifications: data.notifications,
  };
};

export const saveStoreSettings = async (settings: StoreSettingsRecord) => {
  await requireAdmin();
  const { error } = await requireSupabase().from('store_settings').update({
    store_name: settings.storeName.trim(), contact_email: settings.contactEmail.trim(), contact_phone: settings.contactPhone.trim(),
    support_email: settings.supportEmail.trim(), support_phone: settings.supportPhone.trim(), currency: settings.currency,
    free_delivery_threshold_minor: Math.round(settings.freeDeliveryThreshold * 100), delivery_fee_minor: Math.round(settings.deliveryFee * 100),
    announcement: settings.announcement.trim(), notifications: settings.notifications, updated_at: new Date().toISOString(),
  }).eq('id', true);
  if (error) throw error;
};

export const getAdminProducts = async (): Promise<AdminProductRecord[]> => {
  await requireAdmin();
  const client = requireSupabase();
  const [{ data: products, error: productError }, { data: variants, error: variantError }, { data: inventory, error: inventoryError }] =
    await Promise.all([
      client.from('products').select('id, name, category, price_minor, published, primary_image').order('created_at', { ascending: false }),
      client.from('product_variants').select('id, product_id, name'),
      client.from('inventory').select('variant_id, available_quantity'),
    ]);
  if (productError) throw productError;
  if (variantError) throw variantError;
  if (inventoryError) throw inventoryError;
  const stockMap = new Map((inventory ?? []).map(row => [row.variant_id, row.available_quantity]));
  return (products ?? []).map(product => {
    const productVariants = (variants ?? []).filter(variant => variant.product_id === product.id)
      .map(variant => ({ id: variant.id, name: variant.name, stock: stockMap.get(variant.id) ?? 0 }));
    const stock = productVariants.reduce((sum, variant) => sum + variant.stock, 0);
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      image: product.primary_image,
      sellingPrice: minorUnitsToDisplay(product.price_minor),
      stock,
      status: !product.published ? 'Inactive' : stock === 0 ? 'Out of Stock' : 'Active',
      variants: productVariants,
    };

  });
};

export const createAdminProduct = async (input: {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  price: number;
  image: string;
  published: boolean;
  featured: boolean;
  variants: { id: string; name: string; colorName: string; stock: number }[];
}) => {
  await requireAdmin();
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(input.id)
      || !input.name.trim() || !input.category.trim()
      || !Number.isFinite(input.price) || input.price < 0
      || input.variants.length === 0
      || input.variants.some(variant => !variant.id.trim() || !variant.name.trim() || !Number.isInteger(variant.stock) || variant.stock < 0)) {
    throw new Error('Product code, details, price, and at least one valid variant are required.');
  }
  const { error } = await requireSupabase().rpc('create_admin_product', {
    p_product: {
      id: input.id.trim(),
      name: input.name.trim(),
      category: input.category.trim(),
      subcategory: input.subcategory.trim(),
      description: input.description.trim(),
      price_minor: Math.round(input.price * 100),
      primary_image: input.image.trim(),
      published: input.published,
      featured: input.featured,
    },
    p_variants: input.variants.map(variant => ({
      id: variant.id.trim(),
      name: variant.name.trim(),
      color_name: variant.colorName.trim(),
      stock: variant.stock,
    })),
  });
  if (error) throw error;
};

export const updateAdminProduct = async (productId: string, input: {
  name: string; category: string; sellingPrice: number; image: string; published: boolean;
}) => {
  await requireAdmin();
  if (!input.name.trim() || !input.category.trim() || input.sellingPrice < 0) {
    throw new Error('Invalid product details.');
  }
  const { error } = await requireSupabase().from('products').update({
    name: input.name.trim(),
    category: input.category.trim(),
    price_minor: Math.round(input.sellingPrice * 100),
    primary_image: input.image.trim(),
    published: input.published,
    updated_at: new Date().toISOString(),
  }).eq('id', productId);
  if (error) throw error;
};

export const deleteAdminProduct = async (productId: string) => {
  await requireAdmin();
  const { error } = await requireSupabase().from('products').delete().eq('id', productId);
  if (error) throw error;
};

export const updateAdminInventory = async (variantId: string, quantity: number) => {
  await requireAdmin();
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error('Inventory must be a non-negative integer.');
  const { error } = await requireSupabase().from('inventory')
    .update({ available_quantity: quantity, updated_at: new Date().toISOString() })
    .eq('variant_id', variantId);
  if (error) throw error;
};

export const getAdminCustomers = async (): Promise<AdminCustomerRecord[]> => {
  await requireAdmin();
  const client = requireSupabase();
  const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }, { data: addresses, error: addressesError }] =
    await Promise.all([
      client.from('profiles').select('id, full_name, phone, created_at'),
      client.from('orders').select('user_id, total_minor'),
      client.from('addresses').select('user_id, email, city, created_at').order('created_at', { ascending: false }),
    ]);
  if (profilesError) throw profilesError;
  if (ordersError) throw ordersError;
  if (addressesError) throw addressesError;
  return (profiles ?? []).filter(profile => {
    const customerOrders = (orders ?? []).filter(order => order.user_id === profile.id);
    return profile.id && customerOrders.length >= 0;
  }).map(profile => {
    const customerOrders = (orders ?? []).filter(order => order.user_id === profile.id);
    const address = (addresses ?? []).find(item => item.user_id === profile.id);
    return {
      id: profile.id,
      name: profile.full_name,
      email: address?.email ?? '',
      phone: profile.phone ?? '',
      city: address?.city ?? '',
      orderCount: customerOrders.length,
      totalSpent: minorUnitsToDisplay(customerOrders.reduce((sum, order) => sum + order.total_minor, 0)),
      joinedDate: new Date(profile.created_at).toISOString().slice(0, 10),
    };
  });
};

export const getAdminMetrics = async () => {
  await requireAdmin();
  const client = requireSupabase();
  const [{ data: orders, error: ordersError }, { count: productCount, error: productsError }, { count: customerCount, error: customersError }] =
    await Promise.all([
      client.from('orders').select('total_minor, fulfillment_status, created_at, payment_status'),
      client.from('products').select('id', { count: 'exact', head: true }),
      client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    ]);
  if (ordersError) throw ordersError;
  if (productsError) throw productsError;
  if (customersError) throw customersError;
  const validOrders = orders ?? [];
  return {
    totalOrders: validOrders.length,
    totalRevenue: minorUnitsToDisplay(validOrders.reduce((sum, order) => sum + order.total_minor, 0)),
    totalProducts: productCount ?? 0,
    totalCustomers: customerCount ?? 0,
    pendingOrders: validOrders.filter(order => order.fulfillment_status === 'pending').length,
    deliveredOrders: validOrders.filter(order => order.fulfillment_status === 'delivered').length,
    orders: validOrders,
  };
};

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'admin';
  email: string;
}

export interface DeliveryAddress {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  pinCode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export interface RazorpayPaymentOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
}

const toOrder = (order: DatabaseOrder, items: DatabaseOrderItem[]): Order => ({
  databaseId: order.id,
  orderId: order.order_number,
  date: new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
  items: items.map(item => {
    const snapshot = item.product_snapshot;
    const product: Product = {
      id: snapshot.product_id,
      name: snapshot.product_name,
      category: snapshot.category as Product['category'],
      subcategory: '',
      price: minorUnitsToDisplay(snapshot.price_minor),
      rating: 0,
      reviewCount: 0,
      primaryImage: snapshot.primary_image ?? '',
      secondaryImage: snapshot.primary_image ?? '',
      gallery: snapshot.primary_image ? [snapshot.primary_image] : [],
      colors: [{ name: item.color_name, hex: '#e5e5e5' }],
      variants: [{ id: item.variant_id, name: item.variant_name, inStock: true }],
      variantType: 'standard',
      description: '',
      details: [],
      fabricCare: [],
      deliveryInfo: '',
    };
    const color = product.colors[0];
    const variant = product.variants[0];
    return {
      id: `${snapshot.product_id}-${item.color_name}-${item.variant_id}`,
      productId: snapshot.product_id,
      product,
      selectedColor: color,
      selectedVariant: variant,
      quantity: item.quantity,
    };
  }),
  subtotal: minorUnitsToDisplay(order.subtotal_minor),
  discount: minorUnitsToDisplay(order.discount_minor),
  shipping: minorUnitsToDisplay(order.shipping_minor),
  total: minorUnitsToDisplay(order.total_minor),
  shippingAddress: order.shipping_address,
  paymentMethod: order.payment_method,
  paymentStatus: order.payment_status as Order['paymentStatus'],
  status: order.fulfillment_status === 'cancelled'
    ? 'Cancelled'
    : order.fulfillment_status === 'delivered'
      ? 'Delivered'
      : order.fulfillment_status === 'shipped'
        ? 'Dispatched'
        : order.payment_status === 'paid'
          ? 'Confirmed'
          : 'Pending',
  estimatedDelivery: '3–5 business days',
});

export const getSession = async () => {
  if (!supabase) return { user: null };
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.user) return { user: null };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, phone, role')
    .eq('id', session.user.id)
    .maybeSingle();
  if (profileError) throw profileError;

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      fullName: profile?.full_name ?? session.user.user_metadata?.full_name ?? '',
      phone: profile?.phone ?? session.user.user_metadata?.phone ?? '',
      isAdmin: profile?.role === 'admin',
    },
  };
};

const getAuthenticatedUserId = async () => {
  const { user } = await getSession();
  if (!user) throw new Error('Authentication required.');
  return user.id;
};

const toDeliveryAddress = (address: {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  pin_code: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  is_default: boolean;
}): DeliveryAddress => ({
  id: address.id,
  fullName: address.full_name,
  phone: address.phone,
  email: address.email,
  pinCode: address.pin_code,
  addressLine1: address.address_line1,
  addressLine2: address.address_line2 ?? '',
  city: address.city,
  state: address.state,
  isDefault: address.is_default,
});

export const getAccountData = async () => {
  const client = requireSupabase();
  const userId = await getAuthenticatedUserId();
  const [{ data: profile, error: profileError }, { data: addresses, error: addressError }] =
    await Promise.all([
      client.from('profiles').select('id, full_name, phone, role').eq('id', userId).single(),
      client.from('addresses')
        .select('id, full_name, phone, email, pin_code, address_line1, address_line2, city, state, is_default')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false }),
    ]);
  if (profileError || !profile) throw profileError ?? new Error('Profile could not be loaded.');
  if (addressError) throw addressError;
  return {
    profile: {
      id: profile.id,
      fullName: profile.full_name,
      phone: profile.phone ?? '',
      role: profile.role,
      email: (await getSession()).user?.email ?? '',
    } satisfies UserProfile,
    addresses: (addresses ?? []).map(toDeliveryAddress),
  };
};

export const updateProfile = async (input: { fullName: string; phone: string }) => {
  const client = requireSupabase();
  const userId = await getAuthenticatedUserId();
  const { error } = await client
    .from('profiles')
    .update({ full_name: input.fullName.trim(), phone: input.phone.trim() || null, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
};

export type DeliveryAddressInput = Omit<DeliveryAddress, 'id' | 'isDefault'> & { isDefault: boolean };

export const saveDeliveryAddress = async (
  input: DeliveryAddressInput,
  addressId?: string,
) => {
  const client = requireSupabase();
  const userId = await getAuthenticatedUserId();
  const values = {
    user_id: userId,
    full_name: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    pin_code: input.pinCode.trim(),
    address_line1: input.addressLine1.trim(),
    address_line2: input.addressLine2.trim() || null,
    city: input.city.trim(),
    state: input.state.trim(),
    is_default: input.isDefault,
  };
  if (input.isDefault) {
    const { error } = await client.from('addresses').update({ is_default: false }).eq('user_id', userId);
    if (error) throw error;
  }
  const query = addressId
    ? client.from('addresses').update(values).eq('id', addressId).eq('user_id', userId)
    : client.from('addresses').insert(values);
  const { error } = await query;
  if (error) throw error;
};

export const deleteDeliveryAddress = async (addressId: string) => {
  const client = requireSupabase();
  const userId = await getAuthenticatedUserId();
  const { error } = await client.from('addresses').delete().eq('id', addressId).eq('user_id', userId);
  if (error) throw error;
};

export const selectPrimaryAddress = async (addressId: string) => {
  const client = requireSupabase();
  const userId = await getAuthenticatedUserId();
  const { error: clearError } = await client.from('addresses')
    .update({ is_default: false }).eq('user_id', userId);
  if (clearError) throw clearError;
  const { error } = await client.from('addresses')
    .update({ is_default: true }).eq('id', addressId).eq('user_id', userId);
  if (error) throw error;
};

export const subscribeToAuthChanges = (onChange: () => void) => {
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange(onChange);
  return () => data.subscription.unsubscribe();
};

export const createOrder = async (input: {
  idempotencyKey: string;
  address: ShippingAddress;
  paymentMethod: PaymentMethod;
  promoCode?: string;
  items: OrderLineInput[];
}) => {
  if (!isValidOrderInput(input.items) || !isPaymentMethod(input.paymentMethod)) {
    throw new Error('Checkout contains invalid item data.');
  }
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke<{
    order: DatabaseOrder;
    items: DatabaseOrderItem[];
  }>('create-order', { body: input });
  if (error) {
    let backendMessage: string | undefined;
    if (error.context instanceof Response) {
      try {
        const body = await error.context.clone().json() as { error?: unknown };
        if (typeof body.error === 'string') backendMessage = body.error;
      } catch {
        backendMessage = undefined;
      }
    }
    throw new Error(backendMessage || 'Secure checkout is unavailable.');
  }
  if (!data?.order || !data.items) throw new Error('Checkout returned an invalid order response.');
  return { order: toOrder(data.order, data.items) };
};

export const createPaymentOrder = async (orderId: string) => {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke<RazorpayPaymentOrder | { error: string }>(
    'create-payment',
    { body: { orderId } },
  );
  if (error) throw new Error(error.message || 'Payment setup failed.');
  if (!data || !('keyId' in data) || !data.keyId) {
    throw new Error('Payment provider is not available.');
  }
  return data;
};

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      order_id: string;
      name: string;
      description: string;
      handler: () => void;
      modal?: { ondismiss?: () => void };
    }) => { open: () => void };
  }
}

export const openRazorpayCheckout = async (
  payment: RazorpayPaymentOrder,
  onSuccess: () => void,
  onDismiss: () => void,
) => {
  if (!window.Razorpay) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Payment checkout could not be loaded.'));
      document.head.appendChild(script);
    });
  }
  if (!window.Razorpay) throw new Error('Payment checkout is unavailable.');
  new window.Razorpay({
    key: payment.keyId,
    amount: payment.amount,
    currency: payment.currency,
    order_id: payment.orderId,
    name: 'Deepam Silks',
    description: 'Secure order payment',
    handler: onSuccess,
    modal: { ondismiss: onDismiss },
  }).open();
};

export const signIn = async (email: string, password: string) => {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return getSession() as Promise<{ user: { id: string; email: string; fullName: string; phone: string; isAdmin: boolean } }>;
};

export const signUp = async (input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) => {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        phone: input.phone,
      },
    },
  });
  if (error) throw error;
  return { needsEmailConfirmation: !data.session };
};

export const requestPasswordReset = async (email: string) => {
  const client = requireSupabase();
  const redirectTo = import.meta.env.VITE_APP_URL as string | undefined;
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo ? `${redirectTo.replace(/\/$/, '')}/reset-password` : undefined,
  });
  if (error) throw error;
};

export const signOut = async () => {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
  return { ok: true as const };
};
