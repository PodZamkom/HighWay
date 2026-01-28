// Highway Motors - Car Database
// Prices reflect 2025 "New Tax Reality" for Hybrids (EREV) - VAT included
// Prices are approximately 25-30% higher than 2024

export interface CarVariant {
  id: string;
  name: string;
  specs: string;
  condition: string;
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
  {
    id: "li-l6-family",
    brand: "Li Auto",
    model: "L6",
    image: "/images/car-l9.jpg",
    start_price: 38500,
    description: "Ideal family SUV. EREV (Hybrid).",
    market: "China",
    variants: [
      {
        id: "l6-pro-2024",
        name: "L6 Pro (2024)",
        specs: "No Lidar, CDC Suspension",
        condition: "Used (<10k km)",
        price_usd: 38500,
        tags: ["Bestseller", "Value"]
      },
      {
        id: "l6-max-2024",
        name: "L6 Max (2024)",
        specs: "Lidar + Fridge + Platinum Audio",
        condition: "Used (<5k km)",
        price_usd: 43200,
        tags: ["Tech Choice"]
      },
      {
        id: "l6-pro-new",
        name: "L6 Pro (New 2025)",
        specs: "Factory Order",
        condition: "New",
        price_usd: 46500,
        tags: ["New"]
      }
    ]
  },
  {
    id: "voyah-free-family",
    brand: "Voyah",
    model: "Free",
    image: "/images/car-zeekr.jpg",
    start_price: 20500,
    description: "Sporty EREV Crossover. 3 Generations available.",
    market: "China",
    variants: [
      {
        id: "free-2021-rwd",
        name: "Free 2021 (RWD)",
        specs: "347 HP, Rear Wheel Drive",
        condition: "Used (60-80k km)",
        price_usd: 20500,
        tags: ["Budget King"]
      },
      {
        id: "free-2021-awd",
        name: "Free 2021 (AWD)",
        specs: "694 HP, Air Suspension",
        condition: "Used (50k km)",
        price_usd: 22800,
        tags: ["Power"]
      },
      {
        id: "free-2024-apollo",
        name: "Free 2024 (Restyling)",
        specs: "Apollo Tech, Sharp Design",
        condition: "Used (<15k km)",
        price_usd: 33500,
        tags: ["Fresh"]
      },
      {
        id: "free-318-rwd",
        name: "Free 318 (2025)",
        specs: "318km EV Range, RWD",
        condition: "Demo/New",
        price_usd: 36000,
        tags: ["Long Range"]
      }
    ]
  },
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
        condition: "Run&Drive (Repairable)",
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
        condition: "Used (Encar)",
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
