import { CarModel } from '../types/car';
import { importedCarsDb } from './cars_imported_db';

export const cars_db: CarModel[] = [
    ...importedCarsDb
];
