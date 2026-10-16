export type MaterialTag =
  | 'tile'
  | 'wood'
  | 'concrete'
  | 'paint'
  | 'glass'
  | 'steel'
  | 'stone'
  | 'fabric'
  | 'electrical'
  | 'plumbing';

export type ServiceUnit = 'sqft' | 'unit' | 'room' | 'point' | 'running_ft' | 'day';

// Extra facts about a PRODUCT shown in the same card/panel layout as a service. While services are
// switched off the vendor pages list products through `categories[].services[]` (see the server's
// services/shopCatalogue.ts), and this block is what marks an item as a product.
export interface ProductExtras {
  slot: string;
  // null = not tracked (treated as in stock) or sold on the vendor's own store.
  stock: number | null;
  purchaseMode: "on-platform" | "external-store";
  externalStoreUrl?: string;
  dimensionsCm?: { w?: number; h?: number; d?: number };
}

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price: number;
  // Services only: the fields below are absent on a product.
  unit?: ServiceUnit;
  materialTag?: MaterialTag;
  estimatedDays?: number;
  popular?: boolean;
  imageUrl?: string;
  images?: string[];
  includes?: string[];
  isAvailable?: boolean;
  // Present only on a product.
  product?: ProductExtras;
}

export function isProduct(
  service: ServiceOption,
): service is ServiceOption & { product: ProductExtras } {
  return service.product !== undefined;
}

// True when a vendor's catalogue is products (shop mode) rather than services.
export function isShopVendor(vendor: { categories?: ServiceCategory[] }): boolean {
  return (vendor.categories ?? []).some((category) => category.services.some(isProduct));
}

export interface ServiceCategory {
  id: string;
  label: string;
  icon: string;
  services: ServiceOption[];
}

export interface Vendor {
  id: string;
  name: string;
  tagline: string;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  yearsActive: number;
  location: string;
  responseTime: string;
  verified: boolean;
  badges: string[];
  categories: ServiceCategory[];
}

export interface CartItem {
  service: ServiceOption;
  categoryLabel: string;
  quantity: number;
}