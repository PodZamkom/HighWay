# Project Rules for Highway Motors

## Delivery Gate (Mandatory)
Before sending results or links to the user:
1. Deploy to production.
2. Verify each new catalog URL returns HTTP 200.
3. Only then send links.

## Deploy Source
- Always deploy from `origin/main`.

## Verification
- Use `curl -I https://highwaymotors.site/catalog/<slug>` for each new item.

## Catalog Media (Mandatory)
- Причина прошлой проблемы с одним фото: в данных было до 12 изображений, но карточка товара выводила только `images[0]` без галереи/превью.
- Перед выдачей ссылок проверять, что в карточке товара отображается **не только одно фото**, а галерея/превью для всех доступных изображений (до 12).
- Если у машины `images.length > 1`, на проде должна быть видна галерея (и не должно быть только одного изображения).
