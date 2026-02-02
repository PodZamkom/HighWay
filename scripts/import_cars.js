import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../Parcing/china-bu-mejdukoles-by-2026-02-01-4.csv');
const OUTPUT_PATH = path.join(__dirname, '../data/cars_imported_db.ts');
const IMAGES_DIR = path.join(__dirname, '../public/images/cars');

// Helper to download image w/ redirect support
async function downloadImage(url, filepath) {
    if (!url) return false;
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const request = https.get(url, (response) => {
            if (response.statusCode > 300 && response.statusCode < 400 && response.headers.location) {
                file.close();
                downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(filepath, () => { });
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
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
    if (currentRow.length > 0) rows.push(currentRow);
    return rows;
}

const transliterate = (str) => {
    const ru = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
        'е': 'e', 'ё': 'e', 'ж': 'j', 'з': 'z', 'и': 'i',
        'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh',
        'щ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'ъ': '', 'ь': '', 'й': 'y'
    };
    return str.toLowerCase().split('').map(char => ru[char] || char).join('');
};

async function main() {
    console.log('Reading CSV...');
    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const rows = parseCSV(content);

    const headers = rows[0];
    const getIdx = (name) => headers.indexOf(name);

    const idx = {
        brand: getIdx('Brand_0') > -1 ? getIdx('Brand_0') : getIdx('brand_0'),
        name: getIdx('name_0'),
        price: getIdx('price_0'),
        year: 15,
        condition: 14,
        image1: 25,
        image2: 26,
        desc: getIdx('description_0'),
        specs: 18
    };

    const allCars = [];
    const sanitize = (str) => transliterate(str).replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase();

    const processRows = rows.slice(1);
    for (const row of processRows) {
        if (!row[idx.brand]) continue;

        let brand = row[idx.brand].replace(/^Бренд/i, '').trim();
        brand = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
        let rawName = row[idx.name] || '';
        let nameClean = rawName.replace(new RegExp(brand, 'gi'), '').trim();
        nameClean = nameClean.replace(/Бренд/gi, '').trim();
        const nameParts = nameClean.split(/\s+/);
        let model = nameParts[0] || 'Unknown';

        if (nameParts.length > 1) {
            const p1 = nameParts[0].toLowerCase();
            const p2 = nameParts[1].toLowerCase();
            if (p1.length < 4 || /^[a-z0-9]+$/.test(p1)) {
                if (p2.length > 1 && !p2.includes('км')) {
                    model += ' ' + nameParts[1];
                }
            }
        }
        model = model.replace(/['"“”]/g, '').trim();

        const year = parseInt(row[idx.year]) || 2025;
        const rawCond = (row[idx.condition] || '').toLowerCase();
        const isNew = year >= 2025 || rawCond.includes('new') || rawCond.includes('нов');

        if (!isNew) continue;

        const carId = `${sanitize(brand)}-${sanitize(model)}`.replace(/_+/g, '-');
        let car = allCars.find(c => c.id === carId);

        if (!car) {
            const imgDir = path.join(IMAGES_DIR, sanitize(brand), sanitize(model));
            if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

            let imageUrl = '/images/placeholder.jpg';
            let rawImgUrl = row[idx.image1] || row[idx.image2];

            if (rawImgUrl) {
                rawImgUrl = rawImgUrl.split(/[\r\n]+/)[0].trim().replace(/^['"]+|['"]+$/g, '');
            }

            if (rawImgUrl && (rawImgUrl.startsWith('http') || rawImgUrl.startsWith('https'))) {
                let ext = '.jpg';
                try {
                    const urlObj = new URL(rawImgUrl);
                    ext = path.extname(urlObj.pathname) || '.jpg';
                    if (ext.includes('webp')) ext = '.webp';
                } catch (e) { }

                const imgName = `main${ext}`;
                const localPath = path.join(imgDir, imgName);
                const publicPath = `/images/cars/${sanitize(brand)}/${sanitize(model)}/${imgName}`;

                if (fs.existsSync(localPath)) {
                    imageUrl = publicPath;
                } else {
                    try {
                        console.log(`Downloading: ${rawImgUrl}`);
                        await downloadImage(rawImgUrl, localPath);
                        imageUrl = publicPath;
                    } catch (e) {
                        console.error(`Error downloading ${rawImgUrl}: ${e.message}`);
                    }
                }
            }

            const specsText = ((row[idx.specs] || '') + ' ' + (row[idx.desc] || '')).replace(/\s+/g, ' ');
            let accel = 0;
            let range = 0;
            const accelMatch = specsText.match(/(\d+[.,]\d+)\s*(?:с|сек|s)/i);
            const rangeMatch = specsText.match(/(\d{3,4})\s*(?:км|km)/i);

            if (accelMatch) accel = parseFloat(accelMatch[1].replace(',', '.'));
            if (rangeMatch) range = parseInt(rangeMatch[1]);

            let carType = 'EV';
            if (specsText.toLowerCase().includes('гибрид') || specsText.toLowerCase().includes('erev')) carType = 'EREV';
            if (specsText.toLowerCase().includes('бензин') || specsText.toLowerCase().includes('дизель')) carType = 'ICE';

            car = {
                id: carId,
                brand: brand,
                model: model,
                year: year,
                market: 'China',
                type: carType,
                price_fob: 0,
                currency: 'USD',
                availability: 'On Order',
                images: [imageUrl],
                trims: [],
                specs: {
                    range_km: range || 500,
                    acceleration_0_100: accel || 5.9,
                    drive: specsText.toLowerCase().includes('4wd') || specsText.toLowerCase().includes('awd') ? 'AWD' : 'RWD'
                }
            };
            allCars.push(car);
        }

        const price = parseInt((row[idx.price] || '').replace(/[^0-9.]/g, '')) || 0;
        if (car.price_fob === 0 || (price > 0 && price < car.price_fob)) {
            car.price_fob = price;
        }

        let trimName = rawName.replace(brand, '').replace(model, '').replace(/Бренд/gi, '').trim();
        if (trimName.length < 2) trimName = "Standard";

        car.trims.push({
            name: trimName.slice(0, 40),
            price_adjustment: price - car.price_fob,
            features: [row[idx.specs]?.slice(0, 50) || 'Standard features']
        });
    }

    const tsContent = `// Auto-generated by scripts/import_cars.js
import { CarModel } from '../types/car';

export const importedCarsDb: CarModel[] = ${JSON.stringify(allCars, null, 2)};
`;

    fs.writeFileSync(OUTPUT_PATH, tsContent);
    console.log(`Done! Exported ${allCars.length} models to ${OUTPUT_PATH}`);
}

main().catch(console.error);
