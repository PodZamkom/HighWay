# Highway Motors

Premium car import services (China, USA, Korea, Europe).

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4.0 (Native Import)
- **Language**: TypeScript
- **State**: Zustand
- **Server**: Node.js (PM2) + Nginx

## Deployment
1. `npm run build`
2. `pm2 start ecosystem.config.cjs` (or `pm2 restart highway-motors`)

## Bitrix CRM (Lead Forms)
All feedback forms submit through `POST /api/leads`, then the server forwards the lead to Bitrix REST (`crm.lead.add`).

Required env vars:
- `BITRIX_WEBHOOK_URL` (example: `https://<portal>.bitrix24.ru/rest/<user_id>/<webhook_key>`)
  or `BITRIX_LEAD_ADD_URL` (full method URL).

Optional env vars:
- `BITRIX_LEAD_TITLE_PREFIX` (default: `Заявка с сайта`)
- `BITRIX_SOURCE_ID` (default: `WEB`)
- `BITRIX_ASSIGNED_BY_ID` (CRM user ID for responsible manager)

## Architecture
- `app/` - Next.js App Router (Pages & Layouts)
- `components/` - Functional UI components
- `data/` - Static data (cars, markets)
- `store/` - Global state (Zustand)
- `public/images/` - High-quality car assets

---
*Version: 1.1.0*
