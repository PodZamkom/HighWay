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
BUILD_NO_CACHE="${BUILD_NO_CACHE:-0}"
DOCKER_CACHE_DIR="${DOCKER_CACHE_DIR:-/root/.cache/highway-buildx}"
DEPLOY_CACHE_MODE="${DEPLOY_CACHE_MODE:-warm}"
DEPLOY_METRICS_LOG="${DEPLOY_METRICS_LOG:-$ROOT_DIR/runtime/deploy-metrics.log}"
SMOKE_REQUIRE_CHAT="${SMOKE_REQUIRE_CHAT:-1}"
PRE_DEPLOY_TYPECHECK="${PRE_DEPLOY_TYPECHECK:-1}"

OLD_IMAGE=""
ROLLBACK_ALLOWED=0
NEW_IMAGE_TAG=""
RUNTIME_PREPARE_TOKEN=""
CACHE_FROM_ARGS=()
CACHE_TO_ARGS=()
BUILD_CACHE_TMP_DIR=""

log() {
  printf '[deploy] %s\n' "$*"
}

fail() {
  printf '[deploy][ERROR] %s\n' "$*" >&2
  exit 1
}

record_metric() {
  local stage="$1"
  local duration_ms="$2"
  mkdir -p "$(dirname "$DEPLOY_METRICS_LOG")"
  printf '%s stage=%s duration_ms=%s git_ref=%s image=%s\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    "$stage" \
    "$duration_ms" \
    "$(git rev-parse --short HEAD 2>/dev/null || echo unknown)" \
    "$NEW_IMAGE_TAG" >> "$DEPLOY_METRICS_LOG"
}

stage_start() {
  date +%s%3N
}

stage_end() {
  local stage="$1"
  local start_ms="$2"
  local end_ms
  end_ms="$(date +%s%3N)"
  local duration_ms=$((end_ms - start_ms))
  log "${stage} completed in ${duration_ms}ms"
  record_metric "$stage" "$duration_ms"
}

generate_runtime_prepare_token() {
  od -An -N 24 -tx1 /dev/urandom | tr -d ' \n'
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
    -e "RUNTIME_PREPARE_TOKEN=${RUNTIME_PREPARE_TOKEN}" \
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

if [[ "$BUILD_NO_CACHE" == "1" ]]; then
  DEPLOY_CACHE_MODE="off"
fi

case "$DEPLOY_CACHE_MODE" in
  warm)
    CACHE_EXPORT_MODE="min"
    ;;
  refresh)
    CACHE_EXPORT_MODE="max"
    ;;
  off)
    CACHE_EXPORT_MODE=""
    ;;
  *)
    fail "Unsupported DEPLOY_CACHE_MODE: ${DEPLOY_CACHE_MODE}. Use warm, refresh, or off."
    ;;
esac

if container_exists "$APP_NAME"; then
  OLD_IMAGE="$(docker inspect -f '{{.Image}}' "$APP_NAME" 2>/dev/null || true)"
  log "Detected currently running image ID: ${OLD_IMAGE}"
else
  log "Current container ${APP_NAME} not found (fresh deploy)"
fi

if [[ "$SKIP_GIT_SYNC" != "1" ]]; then
  sync_start="$(stage_start)"
  log "Syncing git to ${GIT_REF}"
  git fetch origin
  git reset --hard "$GIT_REF"
  git clean -fd
  stage_end "git_sync" "$sync_start"
else
  log "Skipping git sync (SKIP_GIT_SYNC=${SKIP_GIT_SYNC})"
fi

if [[ "$PRE_DEPLOY_TYPECHECK" == "1" ]]; then
  typecheck_start="$(stage_start)"
  log "Running pre-deploy typecheck"
  npm run typecheck
  stage_end "predeploy_typecheck" "$typecheck_start"
else
  log "Skipping pre-deploy typecheck (PRE_DEPLOY_TYPECHECK=${PRE_DEPLOY_TYPECHECK})"
fi

RUNTIME_PREPARE_TOKEN="$(generate_runtime_prepare_token)"
NEW_IMAGE_TAG="${IMAGE_NAME}:$(git rev-parse --short HEAD)-$(date -u +%Y%m%d%H%M%S)"
log "Building image ${NEW_IMAGE_TAG}"
log "Deploy cache mode: ${DEPLOY_CACHE_MODE}"
build_start="$(stage_start)"
if docker buildx version >/dev/null 2>&1; then
  if [[ "$DEPLOY_CACHE_MODE" != "off" ]]; then
    mkdir -p "$DOCKER_CACHE_DIR"
    if [[ -f "${DOCKER_CACHE_DIR}/index.json" ]]; then
      CACHE_FROM_ARGS=(--cache-from "type=local,src=${DOCKER_CACHE_DIR}")
    fi
    BUILD_CACHE_TMP_DIR="${DOCKER_CACHE_DIR}.tmp"
    rm -rf "$BUILD_CACHE_TMP_DIR"
    CACHE_TO_ARGS=(--cache-to "type=local,dest=${BUILD_CACHE_TMP_DIR},mode=${CACHE_EXPORT_MODE}")
  fi
  BUILD_ARGS=(
    buildx
    build
    --load
    --progress=plain
    -t "$NEW_IMAGE_TAG"
    -t "${IMAGE_NAME}:latest"
  )
  BUILD_ARGS+=("${CACHE_FROM_ARGS[@]}" "${CACHE_TO_ARGS[@]}")
  if [[ "$DEPLOY_CACHE_MODE" == "off" ]]; then
    BUILD_ARGS+=(--no-cache)
  fi
  BUILD_ARGS+=(.)
  docker "${BUILD_ARGS[@]}"
  if [[ -n "$BUILD_CACHE_TMP_DIR" && -d "$BUILD_CACHE_TMP_DIR" ]]; then
    rm -rf "$DOCKER_CACHE_DIR"
    mv "$BUILD_CACHE_TMP_DIR" "$DOCKER_CACHE_DIR"
  fi
else
  if [[ "$DEPLOY_CACHE_MODE" == "off" ]]; then
    docker build --no-cache -t "$NEW_IMAGE_TAG" -t "${IMAGE_NAME}:latest" .
  else
    docker build -t "$NEW_IMAGE_TAG" -t "${IMAGE_NAME}:latest" .
  fi
fi
stage_end "docker_build" "$build_start"

log "Starting candidate container on port ${CANDIDATE_PORT}"
candidate_start="$(stage_start)"
remove_container "$CANDIDATE_NAME"
start_container "$CANDIDATE_NAME" "$CANDIDATE_PORT" "${IMAGE_NAME}:latest" "unless-stopped"
wait_http_ok "http://127.0.0.1:${CANDIDATE_PORT}/" 45 2
stage_end "candidate_boot" "$candidate_start"

prepare_start="$(stage_start)"
log "Running candidate runtime prepare"
bash "$ROOT_DIR/scripts/prepare-runtime.sh" "http://127.0.0.1:${CANDIDATE_PORT}" "$RUNTIME_PREPARE_TOKEN"
stage_end "candidate_prepare" "$prepare_start"

log "Running candidate smoke-check"
candidate_smoke_start="$(stage_start)"
SMOKE_REQUIRE_CHAT="$SMOKE_REQUIRE_CHAT" \
NEXT_PUBLIC_CHAT_WIDGET_SRC="${NEXT_PUBLIC_CHAT_WIDGET_SRC:-}" \
NEXT_PUBLIC_JIVO_WIDGET_ID="${NEXT_PUBLIC_JIVO_WIDGET_ID:-}" \
bash "$ROOT_DIR/scripts/smoke-check.sh" "http://127.0.0.1:${CANDIDATE_PORT}" "$EXPECTED_SITE_URL"
stage_end "candidate_smoke" "$candidate_smoke_start"

log "Switching production container"
ROLLBACK_ALLOWED=1
switch_start="$(stage_start)"
remove_container "$APP_NAME"
start_container "$APP_NAME" "$PORT" "${IMAGE_NAME}:latest" "always"
remove_container "$CANDIDATE_NAME"
wait_http_ok "http://127.0.0.1:${PORT}/" 45 2
stage_end "production_switch" "$switch_start"

log "Running production smoke-check"
prod_smoke_start="$(stage_start)"
SMOKE_REQUIRE_CHAT="$SMOKE_REQUIRE_CHAT" \
NEXT_PUBLIC_CHAT_WIDGET_SRC="${NEXT_PUBLIC_CHAT_WIDGET_SRC:-}" \
NEXT_PUBLIC_JIVO_WIDGET_ID="${NEXT_PUBLIC_JIVO_WIDGET_ID:-}" \
bash "$ROOT_DIR/scripts/smoke-check.sh" "$PUBLIC_URL" "$EXPECTED_SITE_URL"
stage_end "production_smoke" "$prod_smoke_start"

ROLLBACK_ALLOWED=0
log "Deploy completed successfully"
log "Image in production: ${NEW_IMAGE_TAG}"
