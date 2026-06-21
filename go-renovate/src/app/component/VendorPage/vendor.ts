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

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: ServiceUnit;
  materialTag: MaterialTag;
  estimatedDays: number;
  popular?: boolean;
  imageUrl?: string;
  includes: string[];
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