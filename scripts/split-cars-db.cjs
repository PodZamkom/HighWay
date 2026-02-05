/**
 * Script to split cars_imported_db.ts into separate JSON files per brand
 * Run with: node scripts/split-cars-db.js
 */

const fs = require('fs');
const path = require('path');

// Read the TypeScript file
const content = fs.readFileSync(path.join(__dirname, '../data/cars_imported_db.ts'), 'utf8');

// Extract the array content (everything between [ and ])
const arrayMatch = content.match(/export const importedCarsDb: CarModel\[\] = (\[[\s\S]*\]);/);
if (!arrayMatch) {
    console.error('Could not parse cars array');
    process.exit(1);
}

// Use eval to parse (since it's valid JS)
let cars;
try {
    cars = eval(arrayMatch[1]);
} catch (e) {
    console.error('Failed to parse cars:', e);
    process.exit(1);
}

console.log(`Total cars: ${cars.length}`);

// Group by brand
const byBrand = {};
cars.forEach(car => {
    const brand = car.brand.toLowerCase().replace(/\s+/g, '_');
    if (!byBrand[brand]) byBrand[brand] = [];
    byBrand[brand].push(car);
});

// Create output directory
const outDir = path.join(__dirname, '../data/brands');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// Write each brand to a separate JSON file
const brands = Object.keys(byBrand).sort();
console.log(`Brands found: ${brands.length}`);

brands.forEach(brand => {
    const filePath = path.join(outDir, `${brand}.json`);
    fs.writeFileSync(filePath, JSON.stringify(byBrand[brand], null, 2));
    console.log(`  ${brand}: ${byBrand[brand].length} cars`);
});

// Create index file that exports all brands
const indexContent = `// Auto-generated index of car brands
import { CarModel } from '../../types/car';

${brands.map(b => `import ${b}Cars from './${b}.json';`).join('\n')}

export const allCars: CarModel[] = [
${brands.map(b => `  ...${b}Cars,`).join('\n')}
];

export const carsByBrand: Record<string, CarModel[]> = {
${brands.map(b => `  ${b}: ${b}Cars,`).join('\n')}
};
`;

fs.writeFileSync(path.join(outDir, 'index.ts'), indexContent);
console.log('\nCreated index.ts');
console.log('Done!');
