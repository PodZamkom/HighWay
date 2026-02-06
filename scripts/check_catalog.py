import json
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT / 'data' / 'cars_imported_db.ts'
PUBLIC_DIR = PROJECT / 'public'

ALLOWED_CONDITIONS = {'New', 'Used', 'Crashed'}


def load_db():
    text = DATA_PATH.read_text(encoding='utf-8')
    idx = text.find('=')
    start = text.find('[', idx)
    end = text.rfind(']')
    return json.loads(text[start:end + 1])


def main():
    cars = load_db()
    ids = set()
    duplicate_ids = []
    missing_images = []
    bad_condition = []

    for car in cars:
        car_id = car.get('id')
        if car_id in ids:
            duplicate_ids.append(car_id)
        ids.add(car_id)

        if car.get('condition') not in ALLOWED_CONDITIONS:
            bad_condition.append(car_id)

        for img in car.get('images', []):
            if img.startswith('/'):
                path = PUBLIC_DIR / img.lstrip('/')
                if not path.exists():
                    missing_images.append((car_id, img))

    print(f'Total cars: {len(cars)}')
    if duplicate_ids:
        print('Duplicate IDs:', ', '.join(duplicate_ids))
    if bad_condition:
        print('Invalid condition:', ', '.join(bad_condition))
    if missing_images:
        print('Missing images:')
        for car_id, img in missing_images:
            print(f'  {car_id}: {img}')


if __name__ == '__main__':
    main()
