import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../Parcing/china-bu-mejdukoles-by-2026-02-01-4.csv');

function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            currentRow.push(currentField);
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !insideQuotes) {
            if (char === '\r' && text[i + 1] === '\n') i++;
            if (currentRow.length > 0) rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    if (currentRow.length > 0) rows.push(currentRow);
    return rows;
}

const content = fs.readFileSync(CSV_PATH, 'utf8');
const rows = parseCSV(content);
const headers = rows[0];
const img1Idx = headers.indexOf('image_21');
const img2Idx = headers.indexOf('image_22');

console.log(`Headers: image_21 index=${img1Idx}, image_22 index=${img2Idx}`);

// Print first 5 rows' image data
for (let i = 1; i < 6; i++) {
    const row = rows[i];
    if (row) {
        console.log(`Row ${i}: Image1="${row[img1Idx]}", Image2="${row[img2Idx]}"`);
    }
}
