# Architecture Rules

These rules are mandatory for all further changes in this repository.

## 1. Domain boundaries are explicit

Every new feature must belong to exactly one domain:

- `site`
- `admin`
- `catalog`
- `news`
- `media`
- `calculator`
- `auth`
- `cms`

Do not place mixed business logic into generic files like `lib/data.ts`.

## 2. Public read paths and admin write paths are separated

- Public pages must read through dedicated read services such as `lib/publicSiteService.ts`.
- Admin/API mutations must write through domain repositories or admin services.
- Public code must not import admin-only UI or write repositories directly.

## 3. No infrastructure mutations in request path

- Migrations, bootstrap, seed, and runtime preparation are forbidden inside normal page/API request handling.
- Runtime preparation must happen before traffic switch during deploy.

## 4. No blanket dynamic rendering on public pages

- `noStore()` on public pages is forbidden unless there is a documented reason.
- Prefer tagged cache + targeted revalidation.
- Any new admin mutation must define which tags/paths it invalidates.

## 5. New code must follow domain folders

- Domain code goes to `lib/<domain>*`, `types/<domain>*`, `components/<domain>*` or route folders dedicated to that domain.
- Cross-domain helpers are allowed only when they are infrastructure-level and business-neutral.

## 6. Repository size must not absorb runtime assets

- Large import dumps, parsing sources, archives, and generated files must not be committed into runtime paths.
- Product media should go to object storage, not git, unless there is a hard exception.

## 7. Any exception must be written down

If a change breaks one of these rules, the PR/commit must explain:

- why the exception is needed,
- why the safer option was rejected,
- how the exception will be removed later.
