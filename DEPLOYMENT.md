# Деплой для Highway Motors (robust flow)

Цель: после деплоя и после перезагрузки сервера контейнер должен автоматически подниматься, а выкладка должна откатываться при провале smoke-check.

## Что используется
- `scripts/deploy.sh` — выкладка через candidate-контейнер + rollback.
- `scripts/smoke-check.sh` — обязательная проверка ключевых маршрутов, `sitemap.xml` и чата.
- `scripts/self-heal.sh` — watchdog: авто-старт/рестарт контейнера при деградации.
- `--restart always` + volume `highway-runtime:/app/runtime`.

## Обязательные env
В `.env` должны быть:
- `SITE_URL=https://highwaymotors.site`
- `NEXT_PUBLIC_SITE_URL=https://highwaymotors.site`
- Для чата (один вариант):
- `NEXT_PUBLIC_CHAT_WIDGET_SRC=<валидный JS URL>`
- или `NEXT_PUBLIC_JIVO_WIDGET_ID=<id>`

## Локальный запуск деплоя на сервере
```bash
cd ~/HighWay
bash scripts/deploy.sh
```

## Удалённый деплой по SSH
```bash
ssh -o StrictHostKeyChecking=no root@82.40.37.223 "cd ~/HighWay && bash scripts/deploy.sh"
```

## Что делает `scripts/deploy.sh`
1. Синхронизирует репозиторий с `origin/main` (`git fetch/reset/clean`).
2. Собирает новый Docker image (`latest` + уникальный тег).
3. Поднимает candidate-контейнер на отдельном порту.
4. Выполняет smoke-check на candidate.
5. Переключает production-контейнер.
6. Выполняет smoke-check на публичном домене.
7. При ошибке автоматически откатывает на предыдущий image.

## Полезные флаги
- `SKIP_GIT_SYNC=1` — не трогать git.
- `BUILD_NO_CACHE=0` — разрешить кэш docker build.
- `SMOKE_REQUIRE_CHAT=0` — временно пропустить проверку чата (не рекомендуется).
- `PUBLIC_URL=https://highwaymotors.site` — домен для пост-проверки.
- `EXPECTED_SITE_URL=https://highwaymotors.site` — домен в sitemap.

## Автовосстановление после ребута/сбоев
Проверка раз в минуту через cron:

```bash
* * * * * cd ~/HighWay && bash scripts/self-heal.sh >> /var/log/highway-self-heal.log 2>&1
```
