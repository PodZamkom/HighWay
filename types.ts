export interface Car {
  id: string;
  vin: string;
  model: string;
  price: number;
  status: 'transit' | 'port' | 'auction' | 'delivered';
  imageUrl: string;
  region: 'USA' | 'China' | 'Korea' | 'Europe';
}

export interface Market {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  tags: string[];
}

export interface NavLink {
  label: string;
  href: string;
}

export enum AdminTab {
  DASHBOARD = 'DASHBOARD',
  CONTENT = 'CONTENT',
  MEDIA = 'MEDIA',
  SEO = 'SEO',
  CONTACTS = 'CONTACTS'
}

export interface LeadFormData {
  name: string;
  phone: string;
  preferredMessenger: 'telegram' | 'whatsapp';
}