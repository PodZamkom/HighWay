import fs from 'fs';

function debugParse(text) {
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;
    let charCount = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (charCount < 2000) {
            // console.log(`[${i}] char='${char}' iQ=${insideQuotes}`);
        }
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
            currentRow.push(currentField);
            console.log('--- END OF ROW ---');
            console.log('Fields count:', currentRow.length);
            currentRow.forEach((f, idx) => console.log(`${idx}: ${f.slice(0, 50)}`));
            return; // Just dev one row
        } else {
            currentField += char;
        }
        charCount++;
    }
}

const fd = fs.openSync('Parcing/china-bu-mejdukoles-by-2026-02-01-4.csv', 'r');
const buf = Buffer.alloc(10000);
fs.readSync(fd, buf, 0, 10000, 0);
const text = buf.toString('utf8').replace(/^\uFEFF/, '');

console.log('Headers Debug:');
debugParse(text);

const text2 = text.slice(text.indexOf('\n') + 1);
console.log('\nRow 1 Debug:');
debugParse(text2);
