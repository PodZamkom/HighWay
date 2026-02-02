const fs = require('fs');
const path = require('path');
const https = require('https');

const CSV_PATH = path.join(__dirname, '../Parcing/china-bu-mejdukoles-by-2026-02-01-4.csv');
const OUTPUT_PATH = path.join(__dirname, '../data/cars_imported_db.ts');

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
        } else { currentField += char; }
    }
    if (currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
    return rows;
}

function transliterate(text) {
    const map = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya' };
    return text.toLowerCase().split('').map(char => map[char] || char).join('');
}

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
        year: getIdx('Year_0'),
        condition: getIdx('Condition_0')
    };

    console.log('Indices:', idx);

    const allCars = [];
    for (const row of rows.slice(1, 10)) {
        const brandRaw = row[idx.brand];
        const yearRaw = row[idx.year];
        const condRaw = row[idx.condition];
        const year = parseInt(yearRaw) || 0;
        const isNew = (year >= 2024 && year <= 2026) || (condRaw && (condRaw.toLowerCase().includes('new') || condRaw.toLowerCase().includes('нов')));

        console.log(`Debug Row: Brand=${brandRaw}, Year=${yearRaw}(${year}), Cond=${condRaw}, isNew=${isNew}`);

        if (!brandRaw) continue;
        if (!isNew || year < 1900) continue;

        allCars.push({ brand: brandRaw, year });
    }
    console.log(`Result: ${allCars.length} models processed in debug.`);
}

main().catch(console.error);
