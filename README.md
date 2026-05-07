# E-trade

Premium car import services (China, USA, Korea, Europe) — domain: https://edelivery.by

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **State**: Zustand
- **Server**: Docker + Nginx (reverse proxy + Let's Encrypt)

## Deployment
1. `docker compose build app && docker compose up -d` (production)
2. Or use `bash scripts/deploy.sh` (candidate→production with smoke-check + rollback)

## Bitrix CRM (Lead Forms)
All feedback forms submit through `POST /api/leads`, then the server forwards the lead to Bitrix REST (`crm.deal.add`).

Settings managed via `/admin/bitrix` (persists to `runtime/bitrix-settings.json`). Required env fallback:
- `BITRIX_WEBHOOK_URL` (example: `https://<portal>.bitrix24.ru/rest/<user_id>/<webhook_key>`)
  or `BITRIX_LEAD_ADD_URL` (full method URL).

Optional env vars:
- `BITRIX_LEAD_TITLE_PREFIX` (default: `Заявка с сайта`)
- `BITRIX_SOURCE_ID` (default: `WEB`)
- `BITRIX_ASSIGNED_BY_ID` (CRM user ID for responsible manager)

## Architecture
- `app/` — Next.js App Router (pages, layouts, API routes)
- `components/` — UI components (`features/`, `ui/`, `admin/`)
- `data/` — static data (cars, markets, fallback content)
- `lib/` — services (db, cms, calculator, bitrix, auth)
- `store/` — Zustand global state
- `public/` — static assets (images, fonts, favicons)
- `runtime/` — runtime-only state (server volume): `bitrix-settings.json`, `calculator.db`

---
*Version: 1.3.25*
