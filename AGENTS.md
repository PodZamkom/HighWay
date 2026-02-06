# Project Rules for Highway Motors

## Delivery Gate (Mandatory)
Before sending results or links to the user:
1. Deploy to production.
2. Verify each new catalog URL returns HTTP 200.
3. Only then send links.

## Deploy Source
- Always deploy from `origin/main`.

## Verification
- Use `curl -I https://highwaymotors.site/catalog/<slug>` for each new item.
