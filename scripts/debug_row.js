import fs from 'fs';

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
            currentRow.push(currentField);
            rows.push(currentRow);
            if (rows.length > 2) return rows;
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    return rows;
}

const fd = fs.openSync('Parcing/china-bu-mejdukoles-by-2026-02-01-4.csv', 'r');
const buf = Buffer.alloc(100000);
fs.readSync(fd, buf, 0, 100000, 0);
const text = buf.toString('utf8').replace(/^\uFEFF/, '');
const rows = parseCSV(text);

const headers = rows[0];
const r1 = rows[1];

if (headers && r1) {
    console.log('Headers count:', headers.length);
    console.log('Row 1 count:', r1.length);
    for (let i = 0; i < Math.max(headers.length, r1.length); i++) {
        console.log(`${i}: [${headers[i] || 'NONE'}] = "${r1[i] || 'NULL'}"`);
    }
} else {
    console.log('Failed to parse rows.');
}
