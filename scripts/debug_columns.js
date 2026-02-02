import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../Parcing/china-bu-mejdukoles-by-2026-02-01-4.csv');

function parseCSV(text) {
    const result = [];
    const lines = text.split(/\r?\n/);
    for (let line of lines) {
        if (!line.trim()) continue;
        const row = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
                if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
                else inQuote = !inQuote;
            } else if (c === ',' && !inQuote) { row.push(cur); cur = ''; }
            else cur += c;
        }
        row.push(cur);
        result.push(row);
    }
    return result;
}

async function main() {
    console.log('Reading CSV...');
    let content = fs.readFileSync(CSV_PATH, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);

    const rows = parseCSV(content);
    const headers = rows[0].map(h => h.trim());
    console.log('Headers (count=' + headers.length + '):', headers.join('|'));

    const row1 = rows[1];
    console.log('Row 1 (count=' + row1.length + '):', row1.join('|'));

    const yearIdx = headers.indexOf('Year_0');
    console.log('Year_0 Index:', yearIdx);
    console.log('Row 1 Year Value:', row1[yearIdx]);
}

main().catch(console.error);
