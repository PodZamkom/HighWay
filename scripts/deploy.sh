#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

APP_NAME="${APP_NAME:-highway-highway-1}"
CANDIDATE_NAME="${CANDIDATE_NAME:-${APP_NAME}-candidate}"
IMAGE_NAME="${IMAGE_NAME:-highway-motors}"
RUNTIME_VOLUME="${RUNTIME_VOLUME:-highway-runtime}"
PORT="${PORT:-8080}"
CANDIDATE_PORT="${CANDIDATE_PORT:-18080}"
PUBLIC_URL="${PUBLIC_URL:-https://highwaymotors.site}"
EXPECTED_SITE_URL="${EXPECTED_SITE_URL:-https://highwaymotors.site}"
ENV_FILE="${ENV_FILE:-.env}"
APP_NETWORK="${APP_NETWORK:-highway-net}"
GIT_REF="${GIT_REF:-origin/main}"
SKIP_GIT_SYNC="${SKIP_GIT_SYNC:-0}"
BUILD_NO_CACHE="${BUILD_NO_CACHE:-1}"
SMOKE_REQUIRE_CHAT="${SMOKE_REQUIRE_CHAT:-1}"

OLD_IMAGE=""
ROLLBACK_ALLOWED=0
NEW_IMAGE_TAG=""

log() {
  printf '[deploy] %s\n' "$*"
}

fail() {
  printf '[deploy][ERROR] %s\n' "$*" >&2
  exit 1
}

container_exists() {
  local name="$1"
  docker ps -a --format '{{.Names}}' | grep -qx "$name"
}

network_exists() {
  local name="$1"
  docker network ls --format '{{.Name}}' | grep -qx "$name"
}

remove_container() {
  local name="$1"
  if container_exists "$name"; then
    docker rm -f "$name" >/dev/null 2>&1 || true
  fi
}

wait_http_ok() {
  local url="$1"
  local retries="${2:-45}"
  local sleep_seconds="${3:-2}"
  local code=""

  for _ in $(seq 1 "$retries"); do
    code="$(curl -sS -L --max-time 10 -o /dev/null -w '%{http_code}' "$url" || true)"
    if [[ "$code" =~ ^2[0-9][0-9]$ ]]; then
      log "HTTP OK ${url} -> ${code}"
      return 0
    fi
    sleep "$sleep_seconds"
  done

  fail "Service did not become healthy on ${url} (last HTTP ${code:-n/a})"
}

start_container() {
  local name="$1"
  local host_port="$2"
  local image="$3"
  local restart_policy="$4"

  docker run -d \
    --name "$name" \
    --network "$APP_NETWORK" \
    -p "${host_port}:3000" \
    --restart "$restart_policy" \
    --env-file "$ENV_FILE" \
    -v "${RUNTIME_VOLUME}:/app/runtime" \
    "$image" >/dev/null
}

rollback() {
  if [[ "$ROLLBACK_ALLOWED" != "1" || -z "$OLD_IMAGE" ]]; then
    return 0
  fi

  log "Rolling back to previous image: ${OLD_IMAGE}"
  remove_container "$APP_NAME"
  start_container "$APP_NAME" "$PORT" "$OLD_IMAGE" "always"
  wait_http_ok "http://127.0.0.1:${PORT}/" 45 2
}

on_error() {
  local exit_code=$?
  log "Deploy failed with exit code ${exit_code}"
  remove_container "$CANDIDATE_NAME"
  rollback || true
  exit "$exit_code"
}

trap on_error ERR

command -v docker >/dev/null || fail "docker is required"
command -v curl >/dev/null || fail "curl is required"
[[ -f "$ENV_FILE" ]] || fail "Environment file not found: ${ENV_FILE}"
network_exists "$APP_NETWORK" || fail "Docker network not found: ${APP_NETWORK}"

if container_exists "$APP_NAME"; then
  OLD_IMAGE="$(docker inspect -f '{{.Image}}' "$APP_NAME" 2>/dev/null || true)"
  log "Detected currently running image ID: ${OLD_IMAGE}"
else
  log "Current container ${APP_NAME} not found (fresh deploy)"
fi

if [[ "$SKIP_GIT_SYNC" != "1" ]]; then
  log "Syncing git to ${GIT_REF}"
  git fetch origin
  git reset --hard "$GIT_REF"
  git clean -fd
else
  log "Skipping git sync (SKIP_GIT_SYNC=${SKIP_GIT_SYNC})"
fi

NEW_IMAGE_TAG="${IMAGE_NAME}:$(git rev-parse --short HEAD)-$(date -u +%Y%m%d%H%M%S)"
log "Building image ${NEW_IMAGE_TAG}"
if [[ "$BUILD_NO_CACHE" == "1" ]]; then
  docker build --no-cache -t "$NEW_IMAGE_TAG" -t "${IMAGE_NAME}:latest" .
else
  docker build -t "$NEW_IMAGE_TAG" -t "${IMAGE_NAME}:latest" .
fi

log "Starting candidate container on port ${CANDIDATE_PORT}"
remove_container "$CANDIDATE_NAME"
start_container "$CANDIDATE_NAME" "$CANDIDATE_PORT" "${IMAGE_NAME}:latest" "unless-stopped"
wait_http_ok "http://127.0.0.1:${CANDIDATE_PORT}/" 45 2

log "Running candidate smoke-check"
SMOKE_REQUIRE_CHAT="$SMOKE_REQUIRE_CHAT" \
NEXT_PUBLIC_CHAT_WIDGET_SRC="${NEXT_PUBLIC_CHAT_WIDGET_SRC:-}" \
NEXT_PUBLIC_JIVO_WIDGET_ID="${NEXT_PUBLIC_JIVO_WIDGET_ID:-}" \
bash "$ROOT_DIR/scripts/smoke-check.sh" "http://127.0.0.1:${CANDIDATE_PORT}" "$EXPECTED_SITE_URL"

log "Switching production container"
ROLLBACK_ALLOWED=1
remove_container "$APP_NAME"
start_container "$APP_NAME" "$PORT" "${IMAGE_NAME}:latest" "always"
remove_container "$CANDIDATE_NAME"
wait_http_ok "http://127.0.0.1:${PORT}/" 45 2

log "Running production smoke-check"
SMOKE_REQUIRE_CHAT="$SMOKE_REQUIRE_CHAT" \
NEXT_PUBLIC_CHAT_WIDGET_SRC="${NEXT_PUBLIC_CHAT_WIDGET_SRC:-}" \
NEXT_PUBLIC_JIVO_WIDGET_ID="${NEXT_PUBLIC_JIVO_WIDGET_ID:-}" \
bash "$ROOT_DIR/scripts/smoke-check.sh" "$PUBLIC_URL" "$EXPECTED_SITE_URL"

ROLLBACK_ALLOWED=0
log "Deploy completed successfully"
log "Image in production: ${NEW_IMAGE_TAG}"
