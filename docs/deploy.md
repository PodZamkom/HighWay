# Deploy

## Targets

- Warm deploy target: up to `90s`
- Cold deploy target: up to `8m`

Current measured baseline after deploy/cache changes:

- Cold deploy: about `613s`
- Warm deploy: about `74s`

## Deploy flow

Production deploy keeps the same safe sequence:

1. build image
2. start candidate container
3. run runtime prepare
4. run candidate smoke-check
5. switch production container
6. run production smoke-check
7. rollback automatically on failure before final success

## Cache mode

`scripts/deploy.sh` supports `DEPLOY_CACHE_MODE`:

- `warm` default mode for daily deploys
- `refresh` for manual cache refresh with heavier export
- `off` for emergency no-cache fallback
- `PRE_DEPLOY_TYPECHECK=1` runs `npm run typecheck` before Docker build and blocks deploy early on validation failure

Related env vars:

- `DEPLOY_CACHE_MODE`
- `DOCKER_CACHE_DIR`
- `DEPLOY_METRICS_LOG`
- `SMOKE_REQUIRE_CHAT`
- `PRE_DEPLOY_TYPECHECK`

Legacy `BUILD_NO_CACHE=1` is still treated as a hard fallback and disables build cache usage.

Routine production deploys should stay on `warm`. Use `refresh` only after dependency-layer changes, cache invalidation, or explicit cache maintenance.

## CI gate

The repository now includes CI validation in `.github/workflows/ci.yml`:

1. `npm ci`
2. `npm run typecheck`
3. `npm run build`

Deploy should happen only after CI is green.

## Runtime prepare

Runtime prepare is a pre-traffic step. Migrations and bootstrap must not run from normal public requests.

Candidate prepare endpoint is internal-only and protected by `RUNTIME_PREPARE_TOKEN`.
