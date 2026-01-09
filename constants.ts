import { Market, Car, NavLink } from './types';

export const MARKETS: Market[] = [
  {
    id: 'china',
    name: 'КИТАЙ',
    description: 'Новые электрокары и гибриды. Прямые поставки с заводов.',
    imageUrl: 'https://picsum.photos/seed/china_car/800/600',
    tags: ['Li Auto', 'Zeekr', 'BYD', 'New Energy']
  },
  {
    id: 'usa',
    name: 'США',
    description: 'Страховые аукционы Copart и Manheim. Максимальная выгода.',
    imageUrl: 'https://picsum.photos/seed/usa_muscle/800/600',
    tags: ['Copart', 'Manheim', 'Muscle Cars', 'Pickups']
  },
  {
    id: 'korea',
    name: 'КОРЕЯ',
    description: 'Дизельные кроссоверы и седаны в идеальном состоянии.',
    imageUrl: 'https://picsum.photos/seed/korea_suv/800/600',
    tags: ['Encar', 'Hyundai', 'Kia', 'Diesel']
  },
  {
    id: 'europe',
    name: 'ЕВРОПА',
    description: 'Премиум сегмент и редкие комплектации от официальных дилеров.',
    imageUrl: 'https://picsum.photos/seed/euro_luxury/800/600',
    tags: ['BMW', 'Mercedes', 'VAT Refund', 'Audi']
  }
];

export const MOCK_CARS: Car[] = [
  {
    id: '1',
    vin: '***8932',
    model: 'Zeekr 001 You',
    price: 38500,
    status: 'transit',
    imageUrl: 'https://picsum.photos/seed/zeekr/600/400',
    region: 'China'
  },
  {
    id: '2',
    vin: '***1204',
    model: 'BMW X5 M50d',
    price: 62000,
    status: 'port',
    imageUrl: 'https://picsum.photos/seed/bmw/600/800',
    region: 'Europe'
  },
  {
    id: '3',
    vin: '***5591',
    model: 'Ford Mustang GT',
    price: 24500,
    status: 'auction',
    imageUrl: 'https://picsum.photos/seed/mustang/600/400',
    region: 'USA'
  },
  {
    id: '4',
    vin: '***7721',
    model: 'Li L9 Max',
    price: 54000,
    status: 'delivered',
    imageUrl: 'https://picsum.photos/seed/l9/600/400',
    region: 'China'
  },
  {
    id: '5',
    vin: '***3311',
    model: 'Santa Fe Calligraphy',
    price: 29000,
    status: 'transit',
    imageUrl: 'https://picsum.photos/seed/santafe/600/400',
    region: 'Korea'
  }
];

export const NAV_LINKS: NavLink[] = [
  { label: 'Каталог', href: '#catalog' },
  { label: 'Процесс', href: '#process' },
  { label: 'Гарантии', href: '#trust' },
  { label: 'Контакты', href: '#contact' },
];

export const MARQUEE_TEXT_1 = "ДАННЫЕ АУКЦИОНОВ США В РЕАЛЬНОМ ВРЕМЕНИ • ПРЯМОЙ ДОСТУП К ENCAR КОРЕЯ • ЭКСПОРТ ЭЛЕКТРОКАРОВ ИЗ КИТАЯ • ";
export const MARQUEE_TEXT_2 = "ФИКСИРОВАННАЯ ЦЕНА В ДОГОВОРЕ • БЕЗ СКРЫТЫХ ПЛАТЕЖЕЙ • ПОЛНАЯ СТРАХОВКА ГРУЗА • ";