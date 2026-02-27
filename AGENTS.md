# Project Rules for Highway Motors

## Delivery Gate (Mandatory)
Before sending results or links to the user:
1. Deploy to production.
2. Verify each new catalog URL returns HTTP 200.
3. Only then send links.

## Deploy Source
- Always deploy from `origin/main`.
- For calculator persistence, run container with volume: `-v highway-runtime:/app/runtime`.

## Verification
- Use `curl -I https://highwaymotors.site/catalog/<slug>` for each new item.

## Catalog Media (Mandatory)
- Причина прошлой проблемы с одним фото: в данных было до 12 изображений, но карточка товара выводила только `images[0]` без галереи/превью.
- Перед выдачей ссылок проверять, что в карточке товара отображается **не только одно фото**, а галерея/превью для всех доступных изображений (до 12).
- Если у машины `images.length > 1`, на проде должна быть видна галерея (и не должно быть только одного изображения).

## Catalog Detail Layout (Baseline)
- Текущая плотная компоновка карточки товара (галерея слева, инфо/CTA справа, детали ниже) считается валидной базовой версткой.
- Не возвращаться к «карточной» сетке на правой колонке, которая раздувает высоту и создает пустоты.

## Visual Palette (Mandatory)
- Базовая палитра сайта: темно-серые/графитовые фоны + оранжевый акцент.
- Не добавлять новые акцентные цвета (включая синий/фиолетовый/зеленый) и не менять утвержденную палитру без явного согласования пользователя в текущем диалоге.

## Menu Governance (Mandatory)
- Категорически запрещено добавлять, удалять, переименовывать или выделять пункты меню (включая бейджи, иконки и акцентное оформление) без явного согласования пользователя в текущем диалоге.
