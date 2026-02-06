import argparse
import json
from pathlib import Path

from normalize_cars import normalize_rows, filter_image_urls, download_images

PROJECT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT / 'data' / 'cars_imported_db.ts'
IMAGES_DIR = PROJECT / 'public' / 'images' / 'cars'


def load_existing():
    if not DATA_PATH.exists():
        return []
    text = DATA_PATH.read_text(encoding='utf-8')
    idx = text.find('=')
    start = text.find('[', idx)
    end = text.rfind(']')
    if start == -1 or end == -1:
        return []
    return json.loads(text[start:end + 1])


def write_ts(cars):
    ts_content = 'import { CarModel } from \'../types/car\';\n\n'
    ts_content += 'export const importedCarsDb: CarModel[] = ' + json.dumps(cars, ensure_ascii=False, indent=2) + ';\n'
    DATA_PATH.write_text(ts_content, encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description='Import next batch of cars with images.')
    parser.add_argument('--market', type=str, default=None, help='Filter by market (China, Europe, USA, Korea)')
    parser.add_argument('--condition', type=str, default=None, help='Filter by condition (New, Used, Crashed)')
    parser.add_argument('--batch-size', type=int, default=10, help='How many cars to import in this batch')
    parser.add_argument('--images-per-car', type=int, default=12, help='Max images per car')
    parser.add_argument('--reset', action='store_true', help='Start catalog from zero')
    args = parser.parse_args()

    all_cars, missing_year, skipped = normalize_rows()

    if args.market:
        all_cars = [c for c in all_cars if c.get('market') == args.market]
    if args.condition:
        all_cars = [c for c in all_cars if c.get('condition') == args.condition]

    all_cars.sort(key=lambda c: (c['brand'], c['model'], c['year']))

    existing = [] if args.reset else load_existing()
    existing_ids = {c['id'] for c in existing}

    batch = []
    for car in all_cars:
        if car['id'] in existing_ids:
            continue
        urls = filter_image_urls(car.get('images') or [])
        local_paths = download_images(urls, car['brand'], car['slug'], args.images_per_car, IMAGES_DIR)
        if not local_paths:
            continue
        car = dict(car)
        car['images'] = local_paths
        batch.append(car)
        if len(batch) >= args.batch_size:
            break

    if not batch:
        print('No cars imported. Check filters or image sources.')
        return

    updated = existing + batch
    write_ts(updated)

    print(f'Imported: {len(batch)}')
    print('IDs:')
    for car in batch:
        print(car['id'])


if __name__ == '__main__':
    main()
