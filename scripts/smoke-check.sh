#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-${SMOKE_BASE_URL:-https://highwaymotors.site}}"
EXPECTED_SITE_URL="${2:-${SMOKE_EXPECTED_SITE_URL:-https://highwaymotors.site}}"
REQUIRE_CHAT="${SMOKE_REQUIRE_CHAT:-1}"
TIMEOUT_SECONDS="${SMOKE_TIMEOUT_SECONDS:-20}"

log() {
  printf '[smoke] %s\n' "$*"
}

fail() {
  printf '[smoke][ERROR] %s\n' "$*" >&2
  exit 1
}

normalize_url() {
  local value="$1"
  value="${value%/}"
  printf '%s' "$value"
}

http_status() {
  local url="$1"
  curl -sS -L --max-time "$TIMEOUT_SECONDS" -o /dev/null -w '%{http_code}' "$url"
}

contains_case_insensitive() {
  local haystack="$1"
  local needle="$2"
  printf '%s' "$haystack" | grep -Fqi "$needle"
}

BASE_URL="$(normalize_url "$BASE_URL")"
EXPECTED_SITE_URL="$(normalize_url "$EXPECTED_SITE_URL")"

CHAT_WIDGET_SRC="${NEXT_PUBLIC_CHAT_WIDGET_SRC:-}"
CHAT_WIDGET_SRC="$(printf '%s' "$CHAT_WIDGET_SRC" | tr -d '\r\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
if [[ -z "$CHAT_WIDGET_SRC" && -n "${NEXT_PUBLIC_JIVO_WIDGET_ID:-}" ]]; then
  CHAT_WIDGET_SRC="https://code.jivo.ru/widget/${NEXT_PUBLIC_JIVO_WIDGET_ID}"
fi

ROUTES=(
  "/"
  "/catalog"
  "/calculator"
  "/kontakty"
  "/admin/login"
  "/api/cars"
  "/sitemap.xml"
)

log "Base URL: $BASE_URL"
for route in "${ROUTES[@]}"; do
  code="$(http_status "${BASE_URL}${route}")"
  if [[ ! "$code" =~ ^2[0-9][0-9]$ ]]; then
    fail "Route ${route} returned HTTP ${code}"
  fi
  log "OK ${route} -> ${code}"
done

homepage_html="$(curl -sS -L --max-time "$TIMEOUT_SECONDS" "${BASE_URL}/")"
if [[ "$REQUIRE_CHAT" == "1" ]]; then
  if [[ -z "$CHAT_WIDGET_SRC" ]]; then
    fail "Chat is required, but NEXT_PUBLIC_CHAT_WIDGET_SRC/NEXT_PUBLIC_JIVO_WIDGET_ID is not configured"
  fi

  if ! contains_case_insensitive "$homepage_html" "$CHAT_WIDGET_SRC"; then
    fail "Homepage does not include expected chat script src: ${CHAT_WIDGET_SRC}"
  fi

  tmp_headers="$(mktemp)"
  tmp_body="$(mktemp)"
  trap 'rm -f "$tmp_headers" "$tmp_body"' EXIT

  curl -sS -L --max-time "$TIMEOUT_SECONDS" -D "$tmp_headers" "$CHAT_WIDGET_SRC" -o "$tmp_body"

  content_type="$(awk 'BEGIN{IGNORECASE=1} /^Content-Type:/ {print tolower($0)}' "$tmp_headers" | tail -n1)"
  first_bytes="$(head -c 128 "$tmp_body" | tr '[:upper:]' '[:lower:]')"

  if [[ "$content_type" != *"javascript"* && "$content_type" != *"ecmascript"* ]]; then
    if [[ "$first_bytes" == *"<!doctype html"* || "$first_bytes" == *"<html"* ]]; then
      fail "Chat script endpoint returned HTML instead of JS: ${CHAT_WIDGET_SRC}"
    fi
  fi

  rm -f "$tmp_headers" "$tmp_body"
  trap - EXIT

  log "OK chat script src -> ${CHAT_WIDGET_SRC}"
else
  log "Chat check skipped (SMOKE_REQUIRE_CHAT=${REQUIRE_CHAT})"
fi

sitemap_xml="$(curl -sS -L --max-time "$TIMEOUT_SECONDS" "${BASE_URL}/sitemap.xml")"
if [[ "$sitemap_xml" != *"<loc>${EXPECTED_SITE_URL}/"* ]]; then
  fail "Sitemap does not use expected domain: ${EXPECTED_SITE_URL}"
fi

log "OK sitemap domain -> ${EXPECTED_SITE_URL}"
log "Smoke check passed"
