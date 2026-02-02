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

const content = fs.readFileSync('Parcing/china-bu-mejdukoles-by-2026-02-01-4.csv', 'utf8');
const rows = parseCSV(content);
const headers = rows[0];

console.log('Headers length:', headers.length);

const row1 = rows[1];
if (row1) {
    console.log('--- Row 1 Mapping ---');
    row1.forEach((val, i) => {
        console.log(`${i}: [${headers[i] || 'UNDEFINED'}] = "${val}"`);
    });
}
