/**
 * Main car database - imports from split brand JSON files
 * Each brand is in a separate file for easy AI editing
 * 
 * To add a new car: Edit data/brands/{brand}.json
 * To add a new brand: Create data/brands/{brand}.json and update brands/index.ts
 */
import { CarModel } from '../types/car';
import { importedCarsDb } from './cars_imported_db';

// Re-export the combined car database
export const cars_db: CarModel[] = importedCarsDb;

// Also export by-brand access for filtered queries
export { carsByBrand } from './brands';
