import { NextResponse } from 'next/server';
import { cars_db } from '../../../data/cars_db';

export async function GET() {
    return NextResponse.json(cars_db);
}
