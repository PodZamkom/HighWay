#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="${APP_NAME:-etrade-app}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:8080/}"
HTTP_TIMEOUT="${HTTP_TIMEOUT:-10}"

log() {
  printf '[self-heal] %s\n' "$*"
}

container_exists() {
  docker ps -a --format '{{.Names}}' | grep -qx "$1"
}

if ! container_exists "$APP_NAME"; then
  log "Container ${APP_NAME} does not exist, nothing to heal"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$APP_NAME"; then
  log "Container ${APP_NAME} is stopped, starting"
  docker start "$APP_NAME" >/dev/null
  sleep 3
fi

health_status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$APP_NAME")"
if [[ "$health_status" == "unhealthy" ]]; then
  log "Container ${APP_NAME} is unhealthy, restarting"
  docker restart "$APP_NAME" >/dev/null
  sleep 5
fi

http_code="$(curl -sS -L --max-time "$HTTP_TIMEOUT" -o /dev/null -w '%{http_code}' "$HEALTHCHECK_URL" || true)"
if [[ ! "$http_code" =~ ^2[0-9][0-9]$ ]]; then
  log "Health URL returned HTTP ${http_code:-n/a}, restarting ${APP_NAME}"
  docker restart "$APP_NAME" >/dev/null
  sleep 5
fi

final_code="$(curl -sS -L --max-time "$HTTP_TIMEOUT" -o /dev/null -w '%{http_code}' "$HEALTHCHECK_URL" || true)"
if [[ ! "$final_code" =~ ^2[0-9][0-9]$ ]]; then
  log "Container still unhealthy after restart (HTTP ${final_code:-n/a})"
  exit 1
fi

log "Container ${APP_NAME} is healthy (HTTP ${final_code})"
