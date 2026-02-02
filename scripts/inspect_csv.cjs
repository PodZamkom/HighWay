const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
    const fileStream = fs.createReadStream('d:\\Oryntix\\Git\\HighWay\\Parcing\\china-bu-mejdukoles-by-2026-02-01-4.csv');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lines = [];
    let count = 0;
    // Simple hacky CSV parser for this specific task
    // Since real CSV parsing is complex with newlines, we will try to just dump the first chunk of text
    // Actually, let's just read the file content as a string and use a library or regex if possible, 
    // but here we don't have libraries.
    // So let's just read the first 2000 characters.
}

// Easier: just read file start
const content = fs.readFileSync('d:\\Oryntix\\Git\\HighWay\\Parcing\\china-bu-mejdukoles-by-2026-02-01-4.csv', 'utf8');
console.log(content.slice(0, 3000));
