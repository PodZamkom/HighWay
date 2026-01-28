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

## Architecture
- `app/` - Next.js App Router (Pages & Layouts)
- `components/` - Functional UI components
- `data/` - Static data (cars, markets)
- `store/` - Global state (Zustand)
- `public/images/` - High-quality car assets

---
*Version: 1.1.0*
