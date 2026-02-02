// Highway Motors - Car Database
// Prices reflect 2025 "New Tax Reality" for Hybrids (EREV) - VAT included
// Prices are approximately 25-30% higher than 2024
import { importedCars } from './cars_imported';

export interface CarVariant {
  id: string;
  name: string;
  specs: string;
  condition: string; // 'new' | 'used' - currently string in data/cars.ts, strictly typed in usage
  price_usd: number;
  tags: string[];
}

export interface CarFamily {
  id: string;
  brand: string;
  model: string;
  image: string;
  start_price: number;
  description: string;
  market: 'China' | 'Korea' | 'USA' | 'Europe';
  variants: CarVariant[];
}

export const carDatabase: CarFamily[] = [
  ...importedCars,
  {
    id: "chevy-equinox-family",
    brand: "Chevrolet",
    model: "Equinox",
    image: "/images/car-mustang.jpg",
    start_price: 13500,
    description: "Classic American SUV. Reliable and spacious.",
    market: "USA",
    variants: [
      {
        id: "equinox-2020-lt",
        name: "2020 LT 1.5 AWD",
        specs: "AWD, Keyless Entry",
        condition: "used",
        price_usd: 13500,
        tags: ["Value", "Project"]
      }
    ]
  },
  {
    id: "santa-fe-tm-family",
    brand: "Hyundai",
    model: "Santa Fe",
    image: "/images/car-santafe.jpg",
    start_price: 21800,
    description: "Korean bestseller. Diesel power and comfort.",
    market: "Korea",
    variants: [
      {
        id: "santa-fe-2021-diesel",
        name: "2021 2.2 Diesel Premium",
        specs: "Diesel, Leather Interior",
        condition: "used",
        price_usd: 21800,
        tags: ["Bestseller", "Comfort"]
      }
    ]
  }
];

// Helper function to get all cars as flat list (for API compatibility)
export function getAllCars(): CarFamily[] {
  return carDatabase;
}

// Helper to find a specific variant
export function findVariant(familyId: string, variantId: string): CarVariant | undefined {
  const family = carDatabase.find(f => f.id === familyId);
  return family?.variants.find(v => v.id === variantId);
}

// Helper to get price range for a family
export function getPriceRange(family: CarFamily): { min: number; max: number } {
  const prices = family.variants.map(v => v.price_usd);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}
