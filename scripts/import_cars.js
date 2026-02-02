import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../Parcing/china-bu-mejdukoles-by-2026-02-01-4.csv');
const OUTPUT_PATH = path.join(__dirname, '../data/cars_imported_db.ts');

function transliterate(text) {
    const map = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya' };
    return text.toLowerCase().split('').map(char => map[char] || char).join('');
}

// ULTIMATE CSV Parser (Handles newlines in quotes correctly)
function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const next = text[i + 1];
        if (inQuotes) {
            if (c === '"') {
                if (next === '"') { field += '"'; i++; }
                else { inQuotes = false; }
            } else { field += c; }
        } else {
            if (c === '"') { inQuotes = true; }
            else if (c === ',') { currentRow.push(field); field = ''; }
            else if (c === '\n' || c === '\r') {
                if (c === '\r' && next === '\n') i++;
                currentRow.push(field);
                if (currentRow.length > 5) rows.push(currentRow);
                currentRow = [];
                field = '';
            } else { field += c; }
        }
    }
    return rows;
}

async function main() {
    console.log('Starting content-aware import...');
    if (!fs.existsSync(CSV_PATH)) {
        console.error('CSV not found at ' + CSV_PATH);
        return;
    }

    let content = fs.readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
    const rows = parseCSV(content);
    console.log(`Analyzing ${rows.length} rows...`);

    const brands = ['geely', 'byd', 'zeekr', 'voyah', 'xiaomi', 'li', 'icar', 'denza', 'avatr', 'changan', 'dongfeng', 'buick', 'deepal'];
    const allCars = [];
    const sanitize = (str) => transliterate(str).replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase();

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        let brand = '', year = 0, name = '', price = 0, imageUrl = '';

        // Content-aware scanner for each row
        for (let j = 0; j < row.length; j++) {
            const v = (row[j] || '').trim();
            if (!v) continue;

            // Detect Year
            if (!year && /^202[3-6]$/.test(v)) year = parseInt(v);

            // Detect Brand
            if (!brand) {
                const lowerV = v.toLowerCase();
                const matchedBrand = brands.find(b => lowerV === b || lowerV === 'бренд' + b);
                if (matchedBrand) brand = matchedBrand.charAt(0).toUpperCase() + matchedBrand.slice(1);
            }

            // Detect Name (usually a long string with spaces and model info)
            if (!name && v.split(' ').length > 2 && v.length > 10 && !v.includes('http') && !v.includes('{')) {
                name = v;
            }

            // Detect Price (value with $ or large number)
            if (!price) {
                if (v.startsWith('$')) price = parseInt(v.replace(/[^0-9]/g, ''));
                else if (/^\d{5,6}$/.test(v)) price = parseInt(v);
            }

            // Detect Image
            if (!imageUrl && v.includes('mejdukoles.by/image/') && v.includes('http')) {
                imageUrl = v.split(/[\s\r\n]+/)[0].replace(/"/g, '');
            }
        }

        if (!brand || !name) continue;

        // Clean name and extract model
        let model = name.replace(new RegExp(brand, 'gi'), '').trim();
        let modelNorm = model.split(',')[0].split('(')[0].replace(/\s+\d+.*$/i, '').trim();
        if (modelNorm.length < 2) modelNorm = model;

        const carId = `${sanitize(brand)}-${sanitize(modelNorm)}`.replace(/_+/g, '-');
        let car = allCars.find(c => c.id === carId);

        if (!car) {
            const ext = imageUrl.includes('webp') ? '.webp' : '.jpg';
            car = {
                id: carId, brand, model: modelNorm, year: year || 2025, market: 'China',
                type: name.toLowerCase().includes('гибрид') ? 'EREV' : 'EV',
                price_fob: price, currency: 'USD', availability: 'On Order',
                images: imageUrl ? [`/images/cars/${sanitize(brand)}/${sanitize(modelNorm)}/main${ext}`] : ['/images/placeholder.jpg'],
                trims: [],
                specs: { range_km: 500, acceleration_0_100: 5.9, drive: 'RWD' }
            };
            allCars.push(car);
        }

        if (price > 0 && (car.price_fob === 0 || price < car.price_fob)) car.price_fob = price;
        car.trims.push({ name: name.replace(brand, '').replace(modelNorm, '').trim() || 'Standard', price_adjustment: 0, features: ['Standard'] });
    }

    const tsContent = `import { CarModel } from '../types/car';\n\nexport const importedCarsDb: CarModel[] = ${JSON.stringify(allCars, null, 2)};\n`;
    fs.writeFileSync(OUTPUT_PATH, tsContent);
    console.log(`Success! Exported ${allCars.length} models.`);
}

main().catch(console.error);
