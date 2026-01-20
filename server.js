import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

const DATA_FILE = path.join(__dirname, 'data', 'cars.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initial data if file doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// API Endpoints
app.get('/api/cars', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        res.header('Content-Type', 'application/json');
        res.send(data);
    } catch (err) {
        res.status(500).send({ error: 'Failed to read data' });
    }
});

app.post('/api/cars', (req, res) => {
    try {
        const data = req.body;
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ error: 'Failed to save data' });
    }
});

// For any other request, serve index.html (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
