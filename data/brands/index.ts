// Auto-generated index of car brands
import { CarModel } from '../../types/car';

import avatrCars from './avatr.json';
import buickCars from './buick.json';
import bydCars from './byd.json';
import changanCars from './changan.json';
import denzaCars from './denza.json';
import dongfengCars from './dongfeng.json';
import geelyCars from './geely.json';
import icarCars from './icar.json';
import voyahCars from './voyah.json';
import xiaomiCars from './xiaomi.json';
import zeekrCars from './zeekr.json';

export const allCars: CarModel[] = [
  ...(avatrCars as unknown as CarModel[]),
  ...(buickCars as unknown as CarModel[]),
  ...(bydCars as unknown as CarModel[]),
  ...(changanCars as unknown as CarModel[]),
  ...(denzaCars as unknown as CarModel[]),
  ...(dongfengCars as unknown as CarModel[]),
  ...(geelyCars as unknown as CarModel[]),
  ...(icarCars as unknown as CarModel[]),
  ...(voyahCars as unknown as CarModel[]),
  ...(xiaomiCars as unknown as CarModel[]),
  ...(zeekrCars as unknown as CarModel[]),
];

export const carsByBrand: Record<string, CarModel[]> = {
  avatr: avatrCars as unknown as CarModel[],
  buick: buickCars as unknown as CarModel[],
  byd: bydCars as unknown as CarModel[],
  changan: changanCars as unknown as CarModel[],
  denza: denzaCars as unknown as CarModel[],
  dongfeng: dongfengCars as unknown as CarModel[],
  geely: geelyCars as unknown as CarModel[],
  icar: icarCars as unknown as CarModel[],
  voyah: voyahCars as unknown as CarModel[],
  xiaomi: xiaomiCars as unknown as CarModel[],
  zeekr: zeekrCars as unknown as CarModel[],
};
