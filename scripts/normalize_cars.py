import argparse
import csv
import json
import re
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

import requests

PROJECT = Path(__file__).resolve().parents[1]

SOURCES = [
    {
        'path': PROJECT / 'Parcing' / 'china-bu-mejdukoles-by-2026-02-01-4.csv',
        'market': 'China',
        'default_condition': 'Used',
        'force_condition': 'Used',
        'availability': 'OnOrder',
        'price_type': 'FOB',
    },
    {
        'path': PROJECT / 'Parcing' / 'hubrids-mejdukoles-by-2026-02-01-3.csv',
        'market': 'China',
        'default_condition': 'New',
        'availability': 'OnOrder',
        'price_type': 'FOB',
    },
    {
        'path': PROJECT / 'Parcing' / 'mejdukoles-by-2026-02-01-2.csv',
        'market': 'China',
        'default_condition': 'New',
        'availability': 'OnOrder',
        'price_type': 'FOB',
    },
    {
        'path': PROJECT / 'Parcing' / 'China-new-westmotors-by-2026-02-01-3.csv',
        'market': 'China',
        'default_condition': 'New',
        'availability': 'OnOrder',
        'price_type': 'FOB',
    },
    {
        'path': PROJECT / 'Parcing' / 'Europe1-westmotors-by-2026-02-01-4.csv',
        'market': 'Europe',
        'default_condition': 'Used',
        'availability': 'OnOrder',
        'price_type': 'EXW',
    },
]

KNOWN_BRANDS = {
    'Geely', 'BYD', 'Zeekr', 'Voyah', 'Xiaomi', 'Li', 'Icar', 'Denza', 'Avatr',
    'Changan', 'Dongfeng', 'Buick', 'Deepal', 'Volkswagen', 'Mazda', 'Toyota',
    'Honda', 'BMW', 'Mercedes', 'Audi', 'Kia', 'Hyundai', 'Skoda', 'Nissan',
    'Renault', 'Peugeot', 'Citroen', 'Opel', 'Ford', 'Chevrolet', 'Tesla', 'Aito'
}

YEAR_MIN = 1990
YEAR_MAX = 2027
PAGE_IMAGE_CACHE = {}


def normalize_space(text):
    return re.sub(r'\s+', ' ', text or '').strip()


def slugify(text):
    text = normalize_space(text)
    text = text.lower()
    text = re.sub(r'["“”]', '', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = re.sub(r'-+', '-', text).strip('-')
    return text


def extract_urls(value):
    if not value:
        return []
    urls = re.findall(r'https?://[^\s"\']+\.(?:jpg|jpeg|png|webp)', value, flags=re.I)
    return urls


def parse_price(value):
    if not value:
        return None
    candidates = re.findall(r'\d[\d\s,.]*', value)
    if not candidates:
        return None
    digits = re.sub(r'\D', '', candidates[0])
    if not digits:
        return None
    try:
        return int(digits)
    except ValueError:
        return None


def extract_currency(row, fallback, price_text):
    if row:
        for key in row:
            if 'currency' in key.lower():
                v = normalize_space(row.get(key))
                if v:
                    v = v.upper()
                    if v in {'USD', 'EUR', 'CNY', 'KRW'}:
                        return v
    if price_text:
        if '€' in price_text or 'EUR' in price_text.upper():
            return 'EUR'
        if '¥' in price_text or 'CNY' in price_text.upper():
            return 'CNY'
        if '₩' in price_text or 'KRW' in price_text.upper():
            return 'KRW'
    return fallback


def extract_year(row):
    priority_keys = [
        'year_0', 'Year_0', 'vehicleModelDate_0', 'Other_Offer_Year_0', 'title_0',
        'name_0', 'data_4'
    ]
    for key in priority_keys:
        if key in row and row[key]:
            m = re.search(r'\b(20\d{2})\b', row[key])
            if m:
                year = int(m.group(1))
                if YEAR_MIN <= year <= YEAR_MAX:
                    return year
    years = []
    for v in row.values():
        if not v:
            continue
        for m in re.findall(r'\b(20\d{2})\b', v):
            year = int(m)
            if YEAR_MIN <= year <= YEAR_MAX:
                years.append(year)
    return max(years) if years else None


def extract_condition(row, default_condition):
    for key, val in row.items():
        if 'condition' in key.lower() and val:
            v = val.lower()
            if 'нов' in v or 'new' in v:
                return 'New'
            if 'бит' in v or 'crash' in v or 'авар' in v:
                return 'Crashed'
            if 'бу' in v or 'used' in v or 'с пробег' in v:
                return 'Used'
    return default_condition


def extract_mileage(row):
    for key, val in row.items():
        if val and ('mileage' in key.lower() or 'пробег' in key.lower()):
            num = parse_price(val)
            if num is not None:
                return num
    return None


def extract_brand(row, name_text):
    brand_candidates = []
    for key, val in row.items():
        if not val:
            continue
        if 'brand' in key.lower() or 'make' in key.lower() or key in {'item_1', 'name_1'}:
            brand_candidates.append(val)
    for candidate in brand_candidates:
        clean = normalize_space(candidate)
        clean = re.sub(r'(?i)^бренд', '', clean).strip()
        if re.match(r'^\d', clean):
            continue
        for brand in KNOWN_BRANDS:
            if re.search(rf'\b{re.escape(brand)}\b', clean, flags=re.I):
                return brand
        if clean:
            return clean.split()[0].title()
    if name_text:
        for brand in KNOWN_BRANDS:
            if re.search(rf'\b{re.escape(brand)}\b', name_text, flags=re.I):
                return brand
        words = normalize_space(name_text).split()
        if words:
            if not re.match(r'^\d', words[0]):
                return words[0].title()
    return None


def extract_name(row):
    for key in ['name_0', 'Car_Name_0', 'title_0', 'name_2', 'name_1', 'model_0']:
        val = row.get(key)
        if val:
            return normalize_space(val)
    for val in row.values():
        if val:
            return normalize_space(val)
    return None


def extract_model_and_generation(row, name_text, brand, year):
    model = None
    generation = None
    if row.get('model_0'):
        model = normalize_space(row.get('model_0'))
    elif row.get('name_2'):
        model = normalize_space(row.get('name_2'))
    elif row.get('item_2'):
        model = normalize_space(row.get('item_2'))

    if not name_text:
        return model, generation

    working = name_text
    if brand:
        working = re.sub(rf'\b{re.escape(brand)}\b', '', working, flags=re.I)
    if year:
        working = re.sub(rf'\b{year}\b', '', working)
    working = normalize_space(working)

    quoted = re.search(r'["“”](.+?)["“”]', working)
    if quoted:
        generation = normalize_space(quoted.group(1))
        working = normalize_space(re.sub(r'["“”].+?["“”]', '', working))

    if not model:
        words = working.split()
        if len(words) <= 2:
            model = working
        else:
            model = ' '.join(words[:2])
            tail = normalize_space(' '.join(words[2:]))
            if tail:
                generation = generation or tail
    else:
        temp = normalize_space(re.sub(rf'\b{re.escape(model)}\b', '', working, flags=re.I))
        if temp:
            generation = generation or temp

    if generation:
        generation = re.sub(r'(?i)\bв\s+(китае|европе|сша|корее)\b', '', generation).strip()
        generation = re.sub(r'(?i)\bиз\s+(китая|европы|сша|кореи)\b', '', generation).strip()
    if generation and len(generation) > 80:
        generation = None

    return model, generation


def extract_description(row):
    candidates = []
    for key in ['description_0', 'Description_0', 'data_1', 'data_2', 'data_3', 'data_4']:
        val = row.get(key)
        if val:
            candidates.append(val)
    candidates += [v for v in row.values() if v]

    best = ''
    for val in candidates:
        text = val.strip()
        if not text:
            continue
        if 'http://' in text or 'https://' in text:
            continue
        if text.startswith('{') and '@context' in text:
            try:
                data = json.loads(text)
                desc = data.get('description') or data.get('name') or ''
                desc = normalize_space(desc)
                if len(desc) > len(best):
                    best = desc
                continue
            except Exception:
                pass
        cleaned = normalize_space(text)
        if not re.search(r'[A-Za-zА-Яа-я]', cleaned):
            continue
        if len(cleaned) > len(best):
            best = cleaned
    return best or None


def extract_images(row):
    images = []
    for val in row.values():
        if not val:
            continue
        images.extend(extract_urls(val))
    if not images:
        page_url = (
            row.get('data-page-selector')
            or row.get('data_page_selector')
            or row.get('data-page-selector')
        )
        if page_url:
            images.extend(extract_images_from_page(page_url))
    seen = set()
    unique = []
    for url in images:
        if url not in seen:
            seen.add(url)
            unique.append(url)
    return unique


def extract_images_from_page(page_url):
    cached = PAGE_IMAGE_CACHE.get(page_url)
    if cached is not None:
        return cached

    images = []
    try:
        resp = requests.get(page_url, timeout=15, headers={'User-Agent': 'Mozilla/5.0'})
        if resp.status_code != 200:
            PAGE_IMAGE_CACHE[page_url] = []
            return []
        html = resp.text
    except Exception:
        PAGE_IMAGE_CACHE[page_url] = []
        return []

    if 'westmotors.by' in page_url:
        urls = re.findall(r"https?://[^\s\"']+\.(?:jpg|jpeg|png|webp)", html, flags=re.I)
        for url in urls:
            if 'uploads/public' in url:
                images.append(url)
    elif 'mejdukoles.by' in page_url:
        scripts = re.findall(r'<script type=\"application/ld\\+json\">(.*?)</script>', html, flags=re.S)
        for raw in scripts:
            try:
                data = json.loads(raw)
            except Exception:
                continue
            items = data if isinstance(data, list) else [data]
            for item in items:
                if not isinstance(item, dict):
                    continue
                if item.get('@type') != 'Product':
                    continue
                imgs = item.get('image') or []
                if isinstance(imgs, str):
                    imgs = [imgs]
                images.extend([u for u in imgs if isinstance(u, str)])
        if not images:
            urls = re.findall(r"https?://[^\s\"']+\.(?:jpg|jpeg|png|webp)", html, flags=re.I)
            for url in urls:
                if '/image/cache/catalog/' in url:
                    images.append(url)

    # Deduplicate
    seen = set()
    unique = []
    for url in images:
        if url not in seen:
            seen.add(url)
            unique.append(url)

    PAGE_IMAGE_CACHE[page_url] = unique
    return unique


def filter_image_urls(urls):
    filtered = []
    for url in urls:
        if not url.startswith('http'):
            continue
        lower = url.lower()
        if 'no_image' in lower or 'placeholder' in lower:
            continue
        filtered.append(url)
    return filtered


def expand_image_candidates(url):
    candidates = []

    def add(value):
        if value and value not in candidates:
            candidates.append(value)

    lower = url.lower()

    if '100x100' in lower:
        add(re.sub(r'(?i)100x100', '1000x1000', url))
        add(re.sub(r'(?i)100x100', '500x500', url))
        add(url)
        return candidates

    if 'csecollege-1000x1000' in lower:
        add(url)
        add(url.replace('csecollege-1000x1000', 'csecollege-500x500'))
        return candidates

    add(url)
    return candidates


def download_images(urls, brand, slug, max_images, images_dir):
    safe_brand = slugify(brand)
    dest_dir = images_dir / safe_brand / slug
    dest_dir.mkdir(parents=True, exist_ok=True)
    local_paths = []

    for idx, url in enumerate(urls, start=1):
        if len(local_paths) >= max_images:
            break
        parsed = urlparse(url)
        ext = Path(parsed.path).suffix.lower()
        if ext not in {'.jpg', '.jpeg', '.png', '.webp'}:
            ext = '.jpg'
        filename = f'main{ext}' if idx == 1 else f'image_{idx}{ext}'
        dest = dest_dir / filename
        if not dest.exists():
            fetched = False
            for candidate in expand_image_candidates(url):
                try:
                    resp = requests.get(candidate, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
                    if resp.status_code != 200 or not resp.content:
                        continue
                    dest.write_bytes(resp.content)
                    fetched = True
                    break
                except Exception:
                    continue
            if not fetched:
                continue
        local_paths.append(f'/images/cars/{safe_brand}/{slug}/{filename}')

    return local_paths


def extract_price(row):
    for key in ['price_0', 'Price_0', 'Car_Price_0', 'Other_Offer_Price_0', 'Other_Offer_Price_USD_0', 'price']:
        val = row.get(key)
        if val:
            price = parse_price(val)
            if price is not None:
                return price, val
    for val in row.values():
        if not val:
            continue
        if '$' in val or 'USD' in val.upper() or '€' in val or 'EUR' in val.upper():
            price = parse_price(val)
            if price is not None:
                return price, val
    return None, None


def normalize_rows():
    cars_by_id = {}
    missing_year = 0
    skipped = 0

    for source in SOURCES:
        path = source['path']
        if not path.exists():
            continue
        with path.open('r', encoding='utf-8', errors='ignore') as fh:
            reader = csv.DictReader(fh)
            for row in reader:
                name_text = extract_name(row)
                brand = extract_brand(row, name_text)
                if not brand:
                    skipped += 1
                    continue

                year = extract_year(row)
                if not year:
                    year = datetime.utcnow().year
                    missing_year += 1

                condition = source.get('force_condition') or extract_condition(row, source['default_condition'])
                price_value, price_text = extract_price(row)
                if price_value is None:
                    skipped += 1
                    continue

                currency = extract_currency(row, 'USD', price_text)
                model, generation = extract_model_and_generation(row, name_text, brand, year)
                if condition == 'New' and not generation:
                    generation = 'Base'
                if not model:
                    skipped += 1
                    continue

                mileage_km = extract_mileage(row)
                description = extract_description(row)
                images = extract_images(row)

                slug_parts = [brand, model]
                if generation:
                    slug_parts.append(generation)
                slug_parts.append(str(year))
                slug_parts.append(condition)
                slug = slugify(' '.join(slug_parts))

                car_id = slug

                record = cars_by_id.get(car_id)
                if not record:
                    record = {
                        'id': car_id,
                        'slug': slug,
                        'brand': brand,
                        'model': model,
                        'year': year,
                        'condition': condition,
                        'price_value': price_value,
                        'price_currency': currency,
                        'price_type': source['price_type'],
                        'availability': source['availability'],
                        'market': source['market'],
                        'images': images,
                    }
                    if generation:
                        record['generation'] = generation
                    if mileage_km is not None:
                        record['mileage_km'] = mileage_km
                    if description:
                        record['description'] = description
                    cars_by_id[car_id] = record
                else:
                    if price_value and (record['price_value'] == 0 or price_value < record['price_value']):
                        record['price_value'] = price_value
                        record['price_currency'] = currency
                    if description and (not record.get('description') or len(description) > len(record.get('description') or '')):
                        record['description'] = description
                    if generation and not record.get('generation'):
                        record['generation'] = generation
                    if mileage_km is not None and not record.get('mileage_km'):
                        record['mileage_km'] = mileage_km
                    if images:
                        existing = set(record.get('images') or [])
                        for img in images:
                            if img not in existing:
                                record['images'].append(img)
                                existing.add(img)

    cars = list(cars_by_id.values())
    cars.sort(key=lambda c: (c['brand'], c['model'], c['year']))
    return cars, missing_year, skipped


def write_ts(cars):
    out_path = PROJECT / 'data' / 'cars_imported_db.ts'
    ts_content = 'import { CarModel } from \'../types/car\';\n\n'
    ts_content += 'export const importedCarsDb: CarModel[] = ' + json.dumps(cars, ensure_ascii=False, indent=2) + ';\n'
    out_path.write_text(ts_content, encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description='Normalize and import cars from CSV sources.')
    parser.add_argument('--market', type=str, default=None, help='Filter by market (e.g., China)')
    parser.add_argument('--condition', type=str, default=None, help='Filter by condition (New, Used, Crashed)')
    parser.add_argument('--offset', type=int, default=0, help='Offset for batch import')
    parser.add_argument('--limit', type=int, default=0, help='Limit for batch import (0 = all)')
    parser.add_argument('--download-images', action='store_true', help='Download images and rewrite paths to local')
    parser.add_argument('--images-per-car', type=int, default=8, help='Max images per car')
    args = parser.parse_args()

    cars, missing_year, skipped = normalize_rows()

    if args.market:
        cars = [c for c in cars if c.get('market') == args.market]
    if args.condition:
        cars = [c for c in cars if c.get('condition') == args.condition]

    cars.sort(key=lambda c: (c['brand'], c['model'], c['year']))

    if args.offset:
        cars = cars[args.offset:]

    if args.download_images:
        images_dir = PROJECT / 'public' / 'images' / 'cars'
        enriched = []
        target = args.limit if args.limit and args.limit > 0 else None
        for car in cars:
            if target is not None and len(enriched) >= target:
                break
            urls = filter_image_urls(car.get('images') or [])
            local_paths = download_images(urls, car['brand'], car['slug'], args.images_per_car, images_dir)
            if not local_paths:
                continue
            car = dict(car)
            car['images'] = local_paths
            enriched.append(car)
        cars = enriched
    elif args.limit and args.limit > 0:
        cars = cars[:args.limit]

    write_ts(cars)
    print(f'Normalized cars: {len(cars)}')
    print(f'Missing year defaulted: {missing_year}')
    print(f'Skipped rows: {skipped}')


if __name__ == '__main__':
    main()
