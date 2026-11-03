import { Product, CategoryId } from '../types';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  headline: string;
  description: string;
  heroImage: string;
  subcategories: string[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'new-arrivals',
    label: 'NEW ARRIVALS',
    headline: 'The New Season Capsule',
    description: 'Fresh silhouettes, heirloom weaves, and radiant beauty arrivals crafted for contemporary elegance.',
    heroImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80',
    subcategories: ['Festive Edits', 'Modern Silks', 'Daily Linens', 'New in Jewellery']
  },
  {
    id: 'clothing',
    label: 'CLOTHING',
    headline: 'Modern Indian Apparel',
    description: 'Elevated essentials, tailored silhouettes, and relaxed daytime elegance designed for every mood.',
    heroImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80',
    subcategories: ['Kurta Sets', 'Co-ord Sets', 'Tunics & Dresses', 'Linen Separates', 'Draped Skirts']
  },
  {
    id: 'sarees',
    label: 'SAREES',
    headline: 'Heirloom Weaves & Contemporary Drapes',
    description: 'From ceremonial Banarasi silks to featherlight Chanderi and pure Mulmul cottons.',
    heroImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1600&q=80',
    subcategories: ['Silk Sarees', 'Cotton Sarees', 'Festive Sarees', 'Printed Sarees', 'Organza & Drapes']
  },
  {
    id: 'kurtis',
    label: 'KURTIS',
    headline: 'Curated Kurtis & Co-ord Sets',
    description: 'Fluid cuts, artisanal hand-embroidery, and everyday breathability tailored for modern comfort.',
    heroImage: 'https://images.unsplash.com/photo-1596783049615-534d023f9909?auto=format&fit=crop&w=1600&q=80',
    subcategories: ['Straight Kurtis', 'A-Line Kurtis', 'Kurta Sets with Dupatta', 'Co-ord Sets', 'Everyday Kurtis']
  },
  {
    id: 'nightwear',
    label: 'NIGHTWEAR',
    headline: 'Soft Nights & Loungewear',
    description: 'Breathable mulmul sets, pure mulberry satin pajamas, and relaxed kimono robes for uninterrupted rest.',
    heroImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80',
    subcategories: ['Pajama Sets', 'Cotton Night Suits', 'Satin Sleepwear', 'Robes & Kimonos', 'Loungewear']
  },
  {
    id: 'jewellery',
    label: 'JEWELLERY',
    headline: 'Fine Craftsmanship & Heritage Accents',
    description: 'Handcrafted Kundan, 18k gold plating, uncut polki stones, and sculptural everyday accents.',
    heroImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1600&q=80',
    subcategories: ['Chandbali & Earrings', 'Necklaces & Chokers', 'Bangles & Kadas', 'Bracelets', 'Rings']
  },
  {
    id: 'sale',
    label: 'SALE',
    headline: 'The End-of-Season Curations',
    description: 'Exclusive seasonal offers across iconic ethnic pieces, fine jewellery, and everyday luxuries.',
    heroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80',
    subcategories: ['Up to 40% Off Sarees', 'Kurtis Under ₹1999', 'Jewellery Specials']
  }
];

export const PRODUCTS: Product[] = [
  // --- SAREES ---
  {
    id: 'sar-01',
    name: 'Katan Banarasi Silk Saree in Crimson Gold',
    category: 'sarees',
    subcategory: 'Silk Sarees',
    price: 8499,
    originalPrice: 11999,
    discountPercent: 29,
    isNewArrival: true,
    isBestseller: true,
    isFestive: true,
    rating: 4.9,
    reviewCount: 142,
    primaryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1610030469850-717088b3ebdc?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Royal Crimson', hex: '#991b1b' },
      { name: 'Antique Gold', hex: '#ca8a04' },
      { name: 'Deep Emerald', hex: '#065f46' }
    ],
    variants: [
      { id: 'fs', name: 'Free Size (5.5m + Blouse)', inStock: true }
    ],
    variantType: 'standard',
    badge: 'Pure Silk Mark',
    description: 'Woven with centuries-old Jacquard kadwa techniques by master artisans in Varanasi. This heirloom piece features a dense floral zari pallu, subtle meenakari detailing, and an unstitched contrast running blouse piece.',
    details: [
      'Length: 5.5 metres saree + 0.8 metre matching blouse piece',
      'Weft: Pure Katan Mulberry Silk with zari border',
      'Occasion: Weddings, Festive Galas, Family Ceremonies',
      'Origin: Handloom Varanasi, India'
    ],
    fabricCare: [
      'Strictly Dry Clean Only',
      'Store wrapped in clean muslin cloth',
      'Iron on low heat with protective cloth layer'
    ],
    deliveryInfo: 'Dispatches within 24 hours. Standard delivery 3–5 business days across India.'
  },
  {
    id: 'sar-02',
    name: 'Handwoven Chanderi Zari Saree in Champagne Rose',
    category: 'sarees',
    subcategory: 'Silk Sarees',
    price: 4899,
    originalPrice: 6500,
    discountPercent: 24,
    isNewArrival: true,
    isTrending: true,
    rating: 4.8,
    reviewCount: 96,
    primaryImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1610030469850-717088b3ebdc?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Champagne Rose', hex: '#e2b5b5' },
      { name: 'Mint Ivory', hex: '#d1e7dd' },
      { name: 'Soft Lilac', hex: '#c8b6ff' }
    ],
    variants: [
      { id: 'fs', name: 'Free Size (5.5m + Blouse)', inStock: true }
    ],
    variantType: 'standard',
    badge: 'Artisanal Chanderi',
    description: 'A featherlight drape that combines the sheer glow of silk with the breathability of fine cotton. Woven with delicate silver zari booties that catch the softest evening light.',
    details: [
      'Fabric: 60% Silk, 40% Mercerised Cotton',
      'Includes unstitched textured blouse fabric',
      'Translucent body with woven temple border'
    ],
    fabricCare: [
      'Dry Clean Recommended for the first wash',
      'Subsequent gentle cold wash with mild soap'
    ],
    deliveryInfo: 'Ships within 1-2 days. Free shipping included.'
  },
  {
    id: 'sar-03',
    name: 'Mulmul Cotton Hand-Block Print Saree in Indigo Azure',
    category: 'sarees',
    subcategory: 'Cotton Sarees',
    price: 2499,
    originalPrice: 3200,
    discountPercent: 21,
    isBestseller: true,
    rating: 4.7,
    reviewCount: 218,
    primaryImage: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Indigo Azure', hex: '#1e3a8a' },
      { name: 'Earthy Terracotta', hex: '#b45309' },
      { name: 'Sage Leaf', hex: '#4d7c0f' }
    ],
    variants: [
      { id: 'fs', name: 'Free Size (5.5m)', inStock: true }
    ],
    variantType: 'standard',
    description: 'Crafted from 100 count pure combed cotton in Bagru, Rajasthan. Natural indigo dye stamped with hand-carved teak wood blocks. Impossibly soft from day one.',
    details: [
      '100% Pure Organic Mulmul Cotton',
      'Natural Vegetable Dyes',
      'Weight: 380 grams (Ultra-light)'
    ],
    fabricCare: [
      'Hand wash separately in cold water',
      'Do not soak or bleach. Dry in shade'
    ],
    deliveryInfo: 'In Stock. Standard delivery in 2-4 days.'
  },
  {
    id: 'sar-04',
    name: 'Contemporary Organza Floral Saree in Powder Blush',
    category: 'sarees',
    subcategory: 'Organza & Drapes',
    price: 5299,
    originalPrice: 6999,
    discountPercent: 24,
    isNewArrival: true,
    rating: 4.8,
    reviewCount: 64,
    primaryImage: 'https://images.unsplash.com/photo-1610030469850-717088b3ebdc?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1610030469850-717088b3ebdc?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Powder Blush', hex: '#fbcfe8' },
      { name: 'Seafoam Ivory', hex: '#ccfbf1' }
    ],
    variants: [
      { id: 'fs', name: 'Free Size (5.5m + Blouse)', inStock: true }
    ],
    variantType: 'standard',
    badge: 'Modern Drape',
    description: 'Sheer crisp organza painted with impressionist floral blooms, outlined with delicate hand-embroidered sequin scalloped borders.',
    details: [
      'Fabric: Premium Sheer Organza Silk',
      'Embellishment: Scalloped zari lace with micro-sequins',
      'Includes raw silk unstitched blouse piece'
    ],
    fabricCare: ['Dry clean only', 'Keep hung on padded hanger'],
    deliveryInfo: 'Express shipping available.'
  },

  // --- KURTIS & CO-ORDS ---
  {
    id: 'kur-01',
    name: 'Embroidered Chanderi Kurta Set with Scalloped Dupatta',
    category: 'kurtis',
    subcategory: 'Kurta Sets with Dupatta',
    price: 3999,
    originalPrice: 5499,
    discountPercent: 27,
    isNewArrival: true,
    isBestseller: true,
    isFestive: true,
    rating: 4.9,
    reviewCount: 189,
    primaryImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1596783049615-534d023f9909?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1596783049615-534d023f9909?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Pistachio Sage', hex: '#a7f3d0' },
      { name: 'Desert Coral', hex: '#fb923c' },
      { name: 'Ivory Gold', hex: '#fef08a' }
    ],
    variants: [
      { id: 'xs', name: 'XS (Bust 34")', inStock: true },
      { id: 's', name: 'S (Bust 36")', inStock: true },
      { id: 'm', name: 'M (Bust 38")', inStock: true },
      { id: 'l', name: 'L (Bust 40")', inStock: true },
      { id: 'xl', name: 'XL (Bust 42")', inStock: true },
      { id: 'xxl', name: 'XXL (Bust 44")', inStock: false }
    ],
    variantType: 'size',
    badge: 'Complete 3-Piece Set',
    description: 'A three-piece ensemble comprising a straight-fit Chanderi silk kurta with delicate zardozi yoke embroidery, tailored cigarette trousers with elasticated waistband, and an organza dupatta with hand-cut scallops.',
    details: [
      'Set includes: Kurta, Trousers & Dupatta',
      'Kurta length: 46 inches; Pant length: 38 inches',
      'Lining: 100% Cotton voile inner lining in kurta',
      'Side slits with in-seam pockets on pants'
    ],
    fabricCare: ['Dry clean first time; gentle hand wash cold subsequently'],
    deliveryInfo: 'Fast dispatch in 24 hours. COD available.'
  },
  {
    id: 'kur-02',
    name: 'Linen Slub Straight Kurti with Mother-of-Pearl Buttons',
    category: 'kurtis',
    subcategory: 'Straight Kurtis',
    price: 1899,
    originalPrice: 2499,
    discountPercent: 24,
    isTrending: true,
    rating: 4.7,
    reviewCount: 112,
    primaryImage: 'https://images.unsplash.com/photo-1596783049615-534d023f9909?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1596783049615-534d023f9909?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Warm Ecru', hex: '#e7e5e4' },
      { name: 'Olive Green', hex: '#3f6212' },
      { name: 'Rust Amber', hex: '#c2410c' }
    ],
    variants: [
      { id: 'xs', name: 'XS', inStock: true },
      { id: 's', name: 'S', inStock: true },
      { id: 'm', name: 'M', inStock: true },
      { id: 'l', name: 'L', inStock: true },
      { id: 'xl', name: 'XL', inStock: true }
    ],
    variantType: 'size',
    description: 'Tailored from breathable European flax linen slub. Designed with a Mandarin band collar, functional concealed side pockets, and neat side slits. An essential for office and casual days.',
    details: [
      'Material: 100% Breathable Flax Linen',
      'Fit: Regular Straight Cut',
      'Sleeve: 3/4th with turn-up cuffs'
    ],
    fabricCare: ['Machine wash cold gentle cycle', 'Iron damp on reverse'],
    deliveryInfo: 'Standard delivery in 3 days.'
  },
  {
    id: 'kur-03',
    name: 'Flared Angrakha Kalidar Kurta in Berry Wine',
    category: 'kurtis',
    subcategory: 'A-Line Kurtis',
    price: 2699,
    originalPrice: 3499,
    discountPercent: 22,
    isFestive: true,
    rating: 4.8,
    reviewCount: 78,
    primaryImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Berry Wine', hex: '#831843' },
      { name: 'Midnight Navy', hex: '#0f172a' }
    ],
    variants: [
      { id: 's', name: 'S', inStock: true },
      { id: 'm', name: 'M', inStock: true },
      { id: 'l', name: 'L', inStock: true },
      { id: 'xl', name: 'XL', inStock: true }
    ],
    variantType: 'size',
    description: 'A dramatic 12-kali flared silhouette inspired by Mughal court attire. Side tie-up with handmade silk thread tassels and gota patti borders along the hem.',
    details: [
      'Fabric: Pure Cotton Silk blend',
      'Flared hem with 3.2m sweep',
      'Side tie-up fastening with latkans'
    ],
    fabricCare: ['Dry clean recommended'],
    deliveryInfo: 'Ships tomorrow.'
  },
  {
    id: 'kur-04',
    name: 'Modern Silk-Cotton Co-ord Set in Terracotta Clay',
    category: 'clothing',
    subcategory: 'Co-ord Sets',
    price: 3299,
    originalPrice: 4200,
    discountPercent: 21,
    isNewArrival: true,
    isTrending: true,
    rating: 4.9,
    reviewCount: 52,
    primaryImage: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Terracotta Clay', hex: '#9a3412' },
      { name: 'Oatmeal Beige', hex: '#d6d3d1' },
      { name: 'Forest Moss', hex: '#14532d' }
    ],
    variants: [
      { id: 'xs', name: 'XS', inStock: true },
      { id: 's', name: 'S', inStock: true },
      { id: 'm', name: 'M', inStock: true },
      { id: 'l', name: 'L', inStock: true }
    ],
    variantType: 'size',
    badge: 'Co-ord Set',
    description: 'A modern monochromatic set featuring a collared tunic shirt with dropped shoulders and matching wide-leg cropped trousers. Minimalist tailoring with maximum polish.',
    details: [
      'Includes: Relaxed Tunic Top + Wide-leg Trousers',
      'Fabric: 70% Cotton, 30% Silk',
      'High-waisted pants with comfort elastic back'
    ],
    fabricCare: ['Cold machine wash', 'Line dry in shade'],
    deliveryInfo: 'Standard delivery in 2-4 days.'
  },

  // --- NIGHTWEAR ---
  {
    id: 'ngt-01',
    name: 'Mulberry Satin Classic Notch Collar Pajama Set',
    category: 'nightwear',
    subcategory: 'Satin Sleepwear',
    price: 2799,
    originalPrice: 3800,
    discountPercent: 26,
    isBestseller: true,
    isNewArrival: true,
    rating: 4.9,
    reviewCount: 164,
    primaryImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Champagne Pearl', hex: '#fef3c7' },
      { name: 'Midnight Navy', hex: '#0f172a' },
      { name: 'Blush Dahlia', hex: '#f43f5e' }
    ],
    variants: [
      { id: 's', name: 'S (UK 8-10)', inStock: true },
      { id: 'm', name: 'M (UK 12)', inStock: true },
      { id: 'l', name: 'L (UK 14)', inStock: true },
      { id: 'xl', name: 'XL (UK 16)', inStock: true }
    ],
    variantType: 'size',
    badge: 'Pure Satin Touch',
    description: 'Ultra-smooth fluid satin with contrast piped trims, mother-of-pearl buttons, and relaxed straight-leg pants with an adjustable drawstring waist.',
    details: [
      'Set includes button-down shirt and full-length pajamas',
      'Contrast piping on collar, cuffs and hem',
      'Non-cling, breathable weave'
    ],
    fabricCare: ['Gentle cycle cold wash', 'Use mild detergent', 'Do not tumble dry'],
    deliveryInfo: 'In Stock. Standard delivery in 3 days.'
  },
  {
    id: 'ngt-02',
    name: 'Pure Mulmul Cotton Hand-Block Print Night Suit',
    category: 'nightwear',
    subcategory: 'Cotton Night Suits',
    price: 1899,
    originalPrice: 2499,
    discountPercent: 24,
    isTrending: true,
    rating: 4.8,
    reviewCount: 138,
    primaryImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Sage Botanica', hex: '#65a30d' },
      { name: 'Lavender Sprig', hex: '#a855f7' }
    ],
    variants: [
      { id: 's', name: 'S', inStock: true },
      { id: 'm', name: 'M', inStock: true },
      { id: 'l', name: 'L', inStock: true },
      { id: 'xl', name: 'XL', inStock: true },
      { id: 'xxl', name: 'XXL', inStock: true }
    ],
    variantType: 'size',
    description: 'Made from 100% fine Indian mulmul that becomes softer with every wash. Printed with serene botanical motifs using skin-safe organic pigments.',
    details: [
      'Top with relaxed Cuban collar and chest pocket',
      'Pajamas with deep dual side pockets',
      '100% breathable natural cotton'
    ],
    fabricCare: ['Machine wash warm', 'Warm iron'],
    deliveryInfo: 'Delivered in 2-4 business days.'
  },
  {
    id: 'ngt-03',
    name: 'Modal Wrap Kimono Loungewear Robe with Sash',
    category: 'nightwear',
    subcategory: 'Robes & Kimonos',
    price: 2199,
    originalPrice: 2899,
    discountPercent: 24,
    isNewArrival: false,
    rating: 4.7,
    reviewCount: 88,
    primaryImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Dusty Rose', hex: '#fb7185' },
      { name: 'Smoky Charcoal', hex: '#334155' }
    ],
    variants: [
      { id: 's-m', name: 'S / M (Universal Relaxed)', inStock: true },
      { id: 'l-xl', name: 'L / XL (Universal Relaxed)', inStock: true }
    ],
    variantType: 'size',
    description: 'Silky micro-modal drape that cascades gracefully over the shoulders. Features internal security ties, wide bell sleeves, and a matching removable waist belt.',
    details: ['Length: 48 inches (Knee-skimming)', 'Fabric: 95% Lenzing Modal, 5% Elastane'],
    fabricCare: ['Gentle cycle cold wash'],
    deliveryInfo: 'Standard shipping 3-5 days.'
  },

  // --- JEWELLERY ---
  {
    id: 'jwl-01',
    name: 'Uncut Polki & Pearl Chandbali Statement Earrings',
    category: 'jewellery',
    subcategory: 'Chandbali & Earrings',
    price: 3499,
    originalPrice: 4800,
    discountPercent: 27,
    isNewArrival: true,
    isBestseller: true,
    isFestive: true,
    rating: 4.9,
    reviewCount: 175,
    primaryImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Antique Gold & Pearl', hex: '#d97706' },
      { name: 'Emerald Green Accent', hex: '#047857' },
      { name: 'Ruby Pink Accent', hex: '#be123c' }
    ],
    variants: [
      { id: 'std', name: 'Standard Pair (Earrings)', inStock: true }
    ],
    variantType: 'standard',
    badge: 'Artisanal Jadau',
    description: 'Sculpted with Jadau settings by Rajasthani karigars. Features shimmering uncut polki glass crystals framed by clustered freshwater seed pearls and hand-enameled meenakari backplates.',
    details: [
      'Base metal: High-grade brass with 22k antique gold micron plating',
      'Weight: 38 grams per pair (Balanced comfortably with clip support)',
      'Dimensions: 7.2 cm length × 4.5 cm width',
      'Hypoallergenic post with screw back closure'
    ],
    fabricCare: [
      'Keep away from direct perfume and moisture',
      'Store in the velvet DEEPAM SILKS jewelry pouch provided'
    ],
    deliveryInfo: 'Includes insured jewelry box. Dispatches in 24 hours.'
  },
  {
    id: 'jwl-02',
    name: '18K Gold Plated Heritage Temple Coin Necklace',
    category: 'jewellery',
    subcategory: 'Necklaces & Chokers',
    price: 4299,
    originalPrice: 5900,
    discountPercent: 27,
    isFestive: true,
    rating: 4.8,
    reviewCount: 94,
    primaryImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Antique Gold', hex: '#b45309' }
    ],
    variants: [
      { id: 'std', name: 'Adjustable Choker Length (14" - 18")', inStock: true }
    ],
    variantType: 'standard',
    badge: 'Temple Jewellery',
    description: 'An auspicious Laxmi kasu coin motif choker layered with fine kemp cabochon stones. Hand-buffed to a rich, warm antique gold luster.',
    details: [
      'Plating: 18K Yellow Gold with anti-tarnish coating',
      'Adjustable dori cord closure for customized fit',
      'Includes matching stud earrings'
    ],
    fabricCare: ['Wipe clean with a dry microfiber cloth after wear'],
    deliveryInfo: 'Delivered in tamper-proof security box.'
  },
  {
    id: 'jwl-03',
    name: 'Handcrafted Kundan Filigree Bangle Pair',
    category: 'jewellery',
    subcategory: 'Bangles & Kadas',
    price: 2899,
    originalPrice: 3800,
    discountPercent: 23,
    isTrending: true,
    rating: 4.7,
    reviewCount: 110,
    primaryImage: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1000&q=80'
    ],
    colors: [
      { name: 'Gold & Clear Kundan', hex: '#eab308' }
    ],
    variants: [
      { id: 'sz-24', name: 'Size 2.4 (Small - 2.25" dia)', inStock: true },
      { id: 'sz-26', name: 'Size 2.6 (Medium - 2.37" dia)', inStock: true },
      { id: 'sz-28', name: 'Size 2.8 (Large - 2.5" dia)', inStock: true }
    ],
    variantType: 'size',
    description: 'Set of two openable kadas with screw-lock clasps. Embellished with continuous floral kundan insets and delicate filigree side openwork.',
    details: ['Pair of 2 bangles with hinge mechanism', 'Lead and nickel free formulation'],
    fabricCare: ['Store separately from sharp items'],
    deliveryInfo: 'Ships within 24 hours.'
  },

];

export const EDITORIAL_CAMPAIGNS = [
  {
    id: 'saree-edit',
    title: 'The Saree Edit',
    subtitle: 'Heirloom weaves and fluid modern drapes for festive grandeur.',
    cta: 'DISCOVER SAREES',
    category: 'sarees' as CategoryId,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'everyday-elegance',
    title: 'Everyday Elegance',
    subtitle: 'Breathable pure linens and elevated kurtis tailored for everyday life.',
    cta: 'EXPLORE KURTIS',
    category: 'kurtis' as CategoryId,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'soft-nights',
    title: 'Soft Nights',
    subtitle: 'Mulmul sets, liquid satin robes, and uninterrupted serenity.',
    cta: 'SHOP NIGHTWEAR',
    category: 'nightwear' as CategoryId,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80'
  }
];

export const CURATED_COLLECTIONS = [
  { id: 'festive', label: 'Festive Dressing', filterTag: 'isFestive', desc: 'Opulent zari work and celebratory silhouettes' },
  { id: 'office', label: 'Office Essentials', filterCategory: 'kurtis', desc: 'Crisp linens and tailored tunics for the workplace' },
  { id: 'everyday', label: 'Everyday Kurtis', filterCategory: 'kurtis', desc: 'Breathable pure cottons and effortless styling' },
  { id: 'jewellery', label: 'Statement Jewellery', filterCategory: 'jewellery', desc: 'Artisanal Jadau and gold-plated conversation pieces' }
];
