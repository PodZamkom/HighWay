# Правила деплоя для Highway Motors

Этот проект критически чувствителен к ресурсам сервера и стабильности сети. Чтобы деплой проходил быстро и без ошибок, следуй этим правилам:

### 1. Лимиты памяти (Обязательно)
- Процесс сборки (`npm run build`) ВСЕГДА должен быть ограничен: `NODE_OPTIONS="--max-old-space-size=1536"`.
- Это уже прописано в `Dockerfile`, не удалять.

### 2. Очистка перед билдом
- Всегда проверяй отсутствие временных файлов `temp_*.tsx`. Они ломают типизацию и билд.
- В `deploy.sh` (или команде деплоя) всегда должен быть `git reset --hard` и `git clean -fd`.

### 3. Стабильность SSH
- При деплое всегда используй флаги `-o StrictHostKeyChecking=no` и `-o UserKnownHostsFile=/dev/null`, так как сервер часто меняет ключи или сбрасывается.

### 4. Робастная команда деплоя
Для деплоя используй эту "золотую" цепочку (деплой из `origin/main`):
```bash
ssh -o StrictHostKeyChecking=no root@82.40.37.223 "nohup sh -c 'cd HighWay && git fetch origin && git reset --hard origin/main && git clean -fd && docker build --no-cache -t highway-motors:latest . && docker stop highway-highway-1 || true && docker rm highway-highway-1 || true && docker run -d --name highway-highway-1 -p 8080:3000 --restart always highway-motors:latest' > deploy.log 2>&1 &"
```

### Причины задержек в прошлые разы:
- **Нестабильность сервера**: Постоянные обрывы SSH (`Connection closed`).
- **Изменение Host Key**: Приходилось вручную чистить `known_hosts`.
- **Временные файлы**: Случайные `temp_catalog.tsx` попали в гит и не давали скомпилировать проект.
- **Кэш Docker**: Билд пытался использовать старые слои с ошибками.
