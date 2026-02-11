import { CarModel } from '../types/car';
import { CarFamily, CarVariant } from '../data/cars';

export function groupCarsIntoFamilies(cars: CarModel[]): CarFamily[] {
    const familiesMap = new Map<string, CarFamily>();

    cars.forEach(car => {
        const familyId = `${car.brand}-${car.model}`.toLowerCase().replace(/\s+/g, '-');

        if (!familiesMap.has(familyId)) {
            familiesMap.set(familyId, {
                id: familyId,
                brand: car.brand,
                model: car.model,
                image: car.images[0] || '',
                start_price: car.price_value,
                market: car.market,
                description: car.description?.slice(0, 100) + '...' || '',
                variants: []
            });
        }

        const family = familiesMap.get(familyId)!;

        // Update start price if lower
        if (car.price_value < family.start_price) {
            family.start_price = car.price_value;
        }

        const variant: CarVariant = {
            id: car.id,
            name: car.generation || `${car.model} ${car.year}`,
            specs: `${car.year}, ${car.mileage_km ? car.mileage_km + ' km' : 'New'}`,
            condition: car.condition,
            price_usd: car.price_value,
            tags: [car.market, car.availability].filter(Boolean) as string[]
        };

        family.variants.push(variant);
    });

    return Array.from(familiesMap.values());
}
