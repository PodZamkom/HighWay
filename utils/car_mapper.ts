import { CarModel } from '../types/car';
import { CarFamily, CarVariant } from '../data/cars';

export function groupCarsIntoFamilies(cars: CarModel[]): CarFamily[] {
    const familiesMap = new Map<string, CarFamily>();

    cars.forEach(car => {
        const familyId = `${car.brand}-${car.model}`.toLowerCase().replace(/\s+/g, '-');

        if (!familiesMap.has(familyId)) {
            // Find market name for display (e.g. "China" -> "Китай")
            const marketLabel = car.market === 'China' ? 'Китай' :
                car.market === 'USA' ? 'США' :
                    car.market === 'Europe' ? 'Европа' :
                        car.market === 'Korea' ? 'Корея' : car.market;

            familiesMap.set(familyId, {
                id: familyId,
                brand: car.brand,
                model: car.model,
                image: car.images[0] || '',
                start_price: car.price_value,
                market: car.market,
                description: car.description || `${car.brand} ${car.model}. Современный автомобиль из подразделения ${marketLabel}.`,
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
            specs: `${car.year}, ${car.mileage_km ? car.mileage_km.toLocaleString() + ' км' : 'Новый'}`,
            condition: car.condition === 'New' ? 'Новый' : 'С пробегом',
            price_usd: car.price_value,
            tags: [
                car.type === 'EV' ? 'Электро' : car.type === 'EREV' ? 'Гибрид' : 'ДВС',
                car.availability === 'InStock' ? 'В наличии' : 'Под заказ'
            ].filter(Boolean) as string[]
        };

        family.variants.push(variant);
    });

    return Array.from(familiesMap.values()).sort((a, b) => a.brand.localeCompare(b.brand));
}
