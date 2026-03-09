#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:?Base URL is required}"
PREPARE_TOKEN="${2:?Runtime prepare token is required}"

TMP_BODY="$(mktemp)"
trap 'rm -f "$TMP_BODY"' EXIT

HTTP_CODE="$(
  curl -sS \
    -o "$TMP_BODY" \
    -w '%{http_code}' \
    -X POST \
    -H "x-runtime-prepare-token: ${PREPARE_TOKEN}" \
    "${BASE_URL%/}/api/internal/runtime/prepare"
)"

if [[ "$HTTP_CODE" != "200" ]]; then
  printf '[prepare-runtime][ERROR] HTTP %s\n' "$HTTP_CODE" >&2
  cat "$TMP_BODY" >&2
  exit 1
fi

printf '[prepare-runtime] %s\n' "$(cat "$TMP_BODY")"
