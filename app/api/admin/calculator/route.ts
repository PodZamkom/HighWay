import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'calculator-settings.json');

export async function GET() {
    try {
        const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading calculator settings:', error);
        return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const newSettings = await request.json();

        // Basic validation could be added here

        await fs.writeFile(SETTINGS_FILE, JSON.stringify(newSettings, null, 2), 'utf-8');
        return NextResponse.json({ success: true, settings: newSettings });
    } catch (error) {
        console.error('Error saving calculator settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
