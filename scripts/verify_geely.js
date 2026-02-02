import { importedCarsDb } from './data/cars_imported_db.js';
const g = importedCarsDb.filter(c => c.brand.toLowerCase() === 'geely');
console.log('Geely count:', g.length);
if (g.length > 0) console.log('First Geely ID:', g[0].id);
