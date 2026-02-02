import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../Parcing/china-bu-mejdukoles-by-2026-02-01-4.csv');

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
                rows.push(currentRow);
                currentRow = [];
                field = '';
            } else { field += c; }
        }
    }
    return rows;
}

const content = fs.readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
const rows = parseCSV(content);

console.log('Total rows:', rows.length);
const brands = ['geely', 'byd', 'zeekr', 'voyah', 'xiaomi', 'li', 'chery', 'avatr', 'deepal', 'exeed'];

for (let r = 0; r < 20; r++) {
    const row = rows[r];
    if (!row) continue;
    let foundYear = -1, foundBrand = -1;
    for (let c = 0; c < row.length; c++) {
        const v = (row[c] || '').trim();
        if (/^202\d$/.test(v)) foundYear = c;
        if (brands.some(b => v.toLowerCase().includes(b))) foundBrand = c;
    }
    console.log(`Row ${r}: BrandIdx=${foundBrand}, YearIdx=${foundYear}, RowLen=${row.length}`);
    if (foundBrand > -1) console.log(`  Brand: "${row[foundBrand]}", Year: "${foundYear > -1 ? row[foundYear] : '?'}"`);
}
