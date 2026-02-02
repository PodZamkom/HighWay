import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../Parcing/china-bu-mejdukoles-by-2026-02-01-4.csv');
const OUTPUT_PATH = path.join(__dirname, '../data/cars_imported.ts');
const IMAGES_DIR = path.join(__dirname, '../public/images/cars');

// Helper to download image w/ redirect support
async function downloadImage(url, filepath) {
    if (!url) return false;
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const request = https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode > 300 && response.statusCode < 400 && response.headers.location) {
                file.close();
                downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(filepath, () => { }); // Delete partial
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

// Simple CSV Parser handling quotes
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
                i++; // Skip escaped quote
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

// Helper to transliterate Cyrillic
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

// Main processing
async function main() {
    console.log('Reading CSV...');
    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const rows = parseCSV(content);

    // Header map
    const headers = rows[0];
    const getIdx = (name) => headers.indexOf(name);

    const idx = {
        brand: getIdx('Brand_0') > -1 ? getIdx('Brand_0') : getIdx('brand_0'),
        model: getIdx('model_0'),
        name: getIdx('name_0'),
        price: getIdx('price_0'),
        year: 15,
        condition: 14,
        image1: 25,
        image2: 26,
        desc: getIdx('description_0'),
        specs: 18
    };

    console.log('Headers found:', headers);
    console.log('Indices:', idx);

    if (idx.brand === -1) {
        throw new Error('Brand column not found!');
    }

    const carFamilies = [];

    // Helper to sanitize filenames/ids
    const sanitize = (str) => {
        return transliterate(str).replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase();
    };

    const processRows = rows.slice(1);
    let skippedCount = 0;

    for (const row of processRows) {
        if (!row[idx.brand]) {
            skippedCount++;
            continue;
        }

        if (skippedCount === 0 && carFamilies.length === 0) {
            console.log('Debug Row 1:');
            console.log('Brand raw:', row[idx.brand]);
            console.log('Image1 raw:', row[idx.image1]);
            console.log('Image2 raw:', row[idx.image2]);
            console.log('Row len:', row.length, 'Header len:', headers.length);
        }

        // Clean Brand: "БрендGeely" -> "Geely"
        let brand = row[idx.brand].replace(/^Бренд/i, '').trim();
        // Capitalize Brand
        brand = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();

        let rawName = row[idx.name] || '';

        // Extract Model:
        // 1. Remove Brand from name (case insensitive)
        let nameClean = rawName.replace(new RegExp(brand, 'gi'), '').trim();
        // 2. Remove "Бренд" garbage if left
        nameClean = nameClean.replace(/Бренд/gi, '').trim();

        const nameParts = nameClean.split(/\s+/);

        // Custom Heuristics for common models
        let model = nameParts[0] || 'Unknown';

        // If first part is just a number/letter like "e" or "001", take second part too
        if (nameParts.length > 1) {
            const p1 = nameParts[0].toLowerCase();
            const p2 = nameParts[1].toLowerCase();
            // e.g. "Galaxy E5", "Star Wish"
            if (p1.length < 4 || /^[a-z0-9]+$/.test(p1)) {
                if (p2.length > 1 && !p2.includes('км')) {
                    model += ' ' + nameParts[1];
                }
            }
        }

        // Fix specific dirty cases observed
        model = model.replace(/['"“”]/g, '').trim();
        if (model.toLowerCase() === 'e') model = 'E-Series'; // Fallback

        // Condition check
        let condition = 'used';
        const rawCond = (row[idx.condition] || '').toLowerCase();
        let year = parseInt(row[idx.year]) || 0;

        if (year < 2000) year = 2025;

        if (year >= 2025 || rawCond.includes('new') || rawCond.includes('нов')) {
            condition = 'new';
        }

        if (condition !== 'new') {
            skippedCount++;
            continue;
        }

        const familyId = `${sanitize(brand)}-${sanitize(model)}-family`;

        let family = carFamilies.find(f => f.id === familyId);
        if (!family) {
            // Create Folder
            const imgDir = path.join(IMAGES_DIR, sanitize(brand), sanitize(model));
            if (!fs.existsSync(imgDir)) {
                fs.mkdirSync(imgDir, { recursive: true });
            }

            // Download Image
            let imageUrl = '/images/placeholder.jpg';
            let rawImgUrl = row[idx.image1] || row[idx.image2];

            // Fix: Handle multiline URLs in CSV
            if (rawImgUrl) {
                rawImgUrl = rawImgUrl.split(/[\r\n]+/)[0].trim();
                rawImgUrl = rawImgUrl.replace(/^['"]+|['"]+$/g, '');
            }

            if (rawImgUrl && (rawImgUrl.startsWith('http') || rawImgUrl.startsWith('https'))) {
                // Safe extension extraction
                let ext = '.jpg';
                try {
                    const urlObj = new URL(rawImgUrl);
                    ext = path.extname(urlObj.pathname) || '.jpg';
                    if (ext.includes('webp')) ext = '.webp';
                } catch (e) { }

                const imgName = `main${ext}`;
                const localPath = path.join(imgDir, imgName);
                const publicPath = `/images/cars/${sanitize(brand)}/${sanitize(model)}/${imgName}`;

                // Only download if not exists
                if (!fs.existsSync(localPath)) {
                    try {
                        console.log(`Downloading: ${rawImgUrl} -> ${localPath}`);
                        await downloadImage(rawImgUrl, localPath);
                        imageUrl = publicPath;
                        console.log(`Downloaded image for ${brand} ${model}`);
                    } catch (e) {
                        console.error(`Failed to download image for ${brand} ${model} (${rawImgUrl}):`, e.message);
                    }
                } else {
                    imageUrl = publicPath;
                }
            }

            // Description extraction
            let desc = (row[idx.desc] || '').slice(0, 150) + '...';
            if (desc.includes('{') || desc.length < 10) {
                desc = `${brand} ${model} - Modern Chinese Electric Vehicle provided by Highway Motors.`;
            }

            family = {
                id: familyId,
                brand: brand,
                model: model,
                image: imageUrl,
                start_price: 0,
                description: desc,
                market: 'China',
                variants: []
            };
            carFamilies.push(family);
        }

        // Parse Price
        let price = 0;
        const priceStr = (row[idx.price] || '').replace(/[^0-9.]/g, '');
        if (priceStr) price = parseInt(priceStr);

        // Update Family Start Price
        if (family.start_price === 0 || (price > 0 && price < family.start_price)) {
            family.start_price = price;
        }

        // Create Variant
        let trimName = rawName.replace(brand, '').replace(model, '').trim();
        // Remove brand repeats in trim name
        trimName = trimName.replace(new RegExp(brand, 'gi'), '').replace(/Бренд/gi, '').trim();
        if (trimName.length < 2) trimName = "Standard Edition";

        let specs = row[idx.specs] || 'Standard Specs';
        specs = specs.replace(/['"“”]/g, '').slice(0, 60);

        family.variants.push({
            id: `${familyId}-${family.variants.length + 1}`,
            name: trimName,
            specs: specs,
            condition: condition,
            price_usd: price,
            tags: ['New', 'Ev']
        });
    }

    console.log(`Skipped ${skippedCount} items (Used or Invalid).`);

    // Generate TS File
    const tsContent = `// Auto-generated by scripts/import_cars.js
import { CarFamily } from './cars';

export const importedCars: CarFamily[] = ${JSON.stringify(carFamilies, null, 2)};
`;

    fs.writeFileSync(OUTPUT_PATH, tsContent);
    console.log(`Done! Exported ${carFamilies.length} families to ${OUTPUT_PATH}`);
}

main().catch(console.error);
