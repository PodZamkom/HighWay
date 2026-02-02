import { CarModel } from '../types/car';
import { importedCarsDb } from './cars_imported_db';

export const cars_db: CarModel[] = [
    ...importedCarsDb,
    {
        id: 'li-auto-l6',
        brand: 'Li Auto',
        model: 'L6',
        year: 2024,
        market: 'China',
        type: 'EREV',
        price_fob: 34000, // Base Pro price estimate in USD equivalent
        currency: 'USD',
        availability: 'En Route',
        images: ['/images/cars/li-l6.jpg'],
        trims: [
            { name: 'Pro', price_adjustment: 0, features: ['AD Pro', 'SS Max Audio'] },
            { name: 'Max', price_adjustment: 4000, features: ['AD Max (Lidar)', 'Platinum Audio', 'Fridge'] }
        ],
        specs: { range_km: 1390, acceleration_0_100: 5.4, drive: 'AWD' }
    },
    {
        id: 'li-auto-l7',
        brand: 'Li Auto',
        model: 'L7',
        year: 2024,
        market: 'China',
        type: 'EREV',
        price_fob: 41000,
        currency: 'USD',
        availability: 'In Stock (Minsk)',
        images: ['/images/cars/li-l7.jpg'],
        trims: [
            { name: 'Pro', price_adjustment: 0, features: ['Air Suspension', 'AD Pro'] },
            { name: 'Max', price_adjustment: 5000, features: ['Lidar', 'Rear Screen', '21" Wheels'] },
            { name: 'Ultra', price_adjustment: 8000, features: ['Larger Battery', '22" Wheels'] }
        ],
        specs: { range_km: 1360, acceleration_0_100: 5.3, drive: 'AWD' }
    },
    {
        id: 'li-auto-l9',
        brand: 'Li Auto',
        model: 'L9',
        year: 2024,
        market: 'China',
        type: 'EREV',
        price_fob: 58000,
        currency: 'USD',
        availability: 'On Order',
        images: ['/images/cars/li-l9.jpg'],
        trims: [
            { name: 'Pro', price_adjustment: 0, features: ['No Lidar', 'Air Susp'] },
            { name: 'Ultra', price_adjustment: 6000, features: ['Lidar', 'OLED Screens', 'Fragrance'] }
        ],
        specs: { range_km: 1412, acceleration_0_100: 5.3, drive: 'AWD' }
    },
    {
        id: 'voyah-free-2024',
        brand: 'Voyah',
        model: 'Free',
        year: 2024,
        market: 'China',
        type: 'EREV',
        price_fob: 32500,
        currency: 'USD',
        availability: 'En Route',
        images: ['/images/cars/voyah-free.jpg'],
        trims: [
            { name: 'EVR (Restyling)', price_adjustment: 0, features: ['Apollo Tech', 'Air Suspension'] },
            { name: '318 (Long Range)', price_adjustment: 3000, features: ['RWD Only', '318km Electric Range'] } // Note: 318 might be RWD or AWD depending on specific spec, simplifying here
        ],
        specs: { range_km: 1200, acceleration_0_100: 4.8, drive: 'AWD' }
    },
    {
        id: 'geely-monjaro',
        brand: 'Geely',
        model: 'Monjaro',
        year: 2024,
        market: 'China',
        type: 'ICE',
        price_fob: 24000,
        currency: 'USD',
        availability: 'In Stock (Minsk)',
        images: ['/images/cars/geely-monjaro.jpg'],
        trims: [
            { name: 'Exclusive', price_adjustment: 0, features: ['Green Color', 'Suede Interior'] },
            { name: 'Flagship', price_adjustment: -1500, features: ['Leather'] }
        ],
        specs: { engine: '2.0T 238hp', acceleration_0_100: 7.7, drive: 'AWD' }
    },
    {
        id: 'zeekr-001-2024',
        brand: 'Zeekr',
        model: '001',
        year: 2024,
        market: 'China',
        type: 'EV',
        price_fob: 37500,
        currency: 'USD',
        availability: 'On Order',
        images: ['/images/cars/zeekr-001.jpg'],
        trims: [
            { name: 'WE RWD', price_adjustment: 0, features: ['100kWh', '750km Range'] },
            { name: 'WE AWD', price_adjustment: 0, features: ['95kWh', '675km Range', '3.5s 0-100'] },
            { name: 'ME', price_adjustment: 4500, features: ['Air Suspension', 'Auto Doors'] },
            { name: 'YOU', price_adjustment: 9000, features: ['Z-Sport Package', 'Sunroof Dimming'] }
        ],
        specs: { range_km: 750, acceleration_0_100: 3.8, drive: 'AWD' } // Base specs, varies by trim
    },
    {
        id: 'zeekr-007',
        brand: 'Zeekr',
        model: '007',
        year: 2024,
        market: 'China',
        type: 'EV',
        price_fob: 29000,
        currency: 'USD',
        availability: 'On Order',
        images: ['/images/cars/zeekr-007.jpg'],
        trims: [
            { name: 'RWD Enhanced', price_adjustment: 0, features: ['75kWh LFP'] },
            { name: 'AWD Smart', price_adjustment: 3500, features: ['100kWh NMC'] },
            { name: 'Performance', price_adjustment: 8000, features: ['Yellow Accents', '2.84s 0-100'] }
        ],
        specs: { range_km: 688, acceleration_0_100: 5.6, drive: 'RWD' }
    },
    {
        id: 'byd-song-plus',
        brand: 'BYD',
        model: 'Song Plus',
        year: 2024,
        market: 'China',
        type: 'EV',
        price_fob: 20500,
        currency: 'USD',
        availability: 'In Stock (Minsk)',
        images: ['/images/cars/byd-song.jpg'],
        trims: [
            { name: 'Flagship', price_adjustment: 0, features: ['520km Range', 'Rotation Screen'] },
            { name: 'Flagship Plus', price_adjustment: 2000, features: ['605km Range', 'HUD'] }
        ],
        specs: { range_km: 520, acceleration_0_100: 8.5, drive: 'FWD' }
    }
];
