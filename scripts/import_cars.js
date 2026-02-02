import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../Parcing/china-bu-mejdukoles-by-2026-02-01-4.csv');
const OUTPUT_PATH = path.join(__dirname, '../data/cars_imported_db.ts');
const IMAGES_DIR = path.join(__dirname, '../public/images/cars');

function transliterate(text) {
    const map = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya' };
    return text.toLowerCase().split('').map(char => map[char] || char).join('');
}

// FULL FILE CSV Parser (handles newlines in quotes)
function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        if (char === '"') {
            if (insideQuotes && nextChar === '"') { currentField += '"'; i++; }
            else { insideQuotes = !insideQuotes; }
        } else if (char === ',' && !insideQuotes) {
            currentRow.push(currentField);
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !insideQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            if (currentRow.length > 0 || currentField.length > 0) {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            }
        } else {
            currentField += char;
        }
    }
    if (currentRow.length > 0 || currentField.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }
    return rows;
}

async function main() {
    console.log('Reading CSV...');
    let content = fs.readFileSync(CSV_PATH, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);

    const rows = parseCSV(content);
    if (rows.length < 2) throw new Error('No data rows found');

    const headers = rows[0].map(h => h.trim());
    const getIdx = (name) => headers.indexOf(name);

    const idx = {
        brand: getIdx('Brand_0') > -1 ? getIdx('Brand_0') : getIdx('brand_0'),
        name: getIdx('name_0'),
        price: getIdx('price_0'),
        year: getIdx('Year_0'),
        condition: getIdx('Condition_0'),
        image1: getIdx('image_21'),
        image2: getIdx('image_22'),
        desc: getIdx('description_0'),
        specs: getIdx('Description_0') > -1 ? getIdx('Description_0') : getIdx('description_0')
    };

    console.log('Detected Indices:', idx);
    if (idx.brand === -1) throw new Error('Brand column not found');

    const allCars = [];
    const sanitize = (str) => transliterate(str).replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase();

    for (const row of rows.slice(1)) {
        if (!row[idx.brand]) continue;

        let brand = row[idx.brand].replace(/^Бренд/i, '').trim();
        brand = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
        let rawName = row[idx.name] || '';

        let year = parseInt(row[idx.year]) || 0;
        const rawCond = (row[idx.condition] || '').toLowerCase();
        const isNew = (year >= 2024 && year <= 2026) || rawCond.includes('new') || rawCond.includes('нов');

        if (!isNew || year < 1900) continue;

        let nameClean = rawName.replace(new RegExp(brand, 'gi'), '').trim();
        const nameParts = nameClean.split(/\s+/);
        let model = nameParts[0] || 'Unknown';
        if (nameParts.length > 1 && (nameParts[0].length < 4 || /^[a-z0-9]+$/.test(nameParts[0]))) {
            if (!nameParts[1].includes('км')) model += ' ' + nameParts[1];
        }
        model = model.replace(/['"“”]/g, '').trim();
        let modelNorm = model.split(',')[0].split('(')[0].replace(/\s+\d+.*$/i, '').trim();
        if (modelNorm.length < 2) modelNorm = model;

        const carId = `${sanitize(brand)}-${sanitize(modelNorm)}`.replace(/_+/g, '-');
        let car = allCars.find(c => c.id === carId);

        if (!car) {
            const specsP = ((row[idx.specs] || '') + ' ' + (row[idx.desc] || '')).replace(/\s+/g, ' ');
            let accel = 0, range = 0;
            const am = specsP.match(/(\d+[.,]\d+)\s*(?:с|сек|s)/i);
            const rm = specsP.match(/(\d{3,4})\s*(?:км|km)/i);
            if (am) accel = parseFloat(am[1].replace(',', '.'));
            if (rm) range = parseInt(rm[1]);

            car = {
                id: carId, brand, model: modelNorm, year, market: 'China',
                type: specsP.toLowerCase().includes('гибрид') ? 'EREV' : 'EV',
                price_fob: 0, currency: 'USD', availability: 'On Order',
                images: ['/images/placeholder.jpg'], trims: [],
                specs: { range_km: range || 500, acceleration_0_100: accel || 5.9, drive: specsP.toLowerCase().includes('4wd') ? 'AWD' : 'RWD' }
            };

            const rawImgUrl = (row[idx.image1] || row[idx.image2] || '').split(/[\r\n]+/)[0].trim().replace(/^['"]+|['"]+$/g, '');
            if (rawImgUrl.startsWith('http')) {
                const ext = rawImgUrl.includes('webp') ? '.webp' : '.jpg';
                const imgPath = `/images/cars/${sanitize(brand)}/${sanitize(modelNorm)}/main${ext}`;
                car.images = [imgPath];
            }
            allCars.push(car);
        }

        const price = parseInt((row[idx.price] || '').replace(/[^0-9.]/g, '')) || 0;
        if (car.price_fob === 0 || (price > 5000 && price < car.price_fob)) car.price_fob = price;
        let trim = rawName.replace(brand, '').replace(modelNorm, '').trim();
        if (car.trims.length < 8) car.trims.push({ name: trim || 'Standard', price_adjustment: price > car.price_fob ? price - car.price_fob : 0, features: [row[idx.specs]?.slice(0, 50) || 'Standard'] });
    }

    const tsContent = `import { CarModel } from '../types/car';\n\nexport const importedCarsDb: CarModel[] = ${JSON.stringify(allCars, null, 2)};\n`;
    fs.writeFileSync(OUTPUT_PATH, tsContent);
    console.log(`Done! Exported ${allCars.length} models.`);
}

main().catch(console.error);
