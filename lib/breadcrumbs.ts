import type { NavbarContent } from "@/types/site";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

const DEFAULT_SITE_URL = "https://edelivery.by";

function normalizePath(pathOrUrl: string | undefined | null): string {
  if (!pathOrUrl) return "/";
  const raw = pathOrUrl.trim();
  if (!raw) return "/";

  const withoutOrigin = raw.replace(/^https?:\/\/[^/]+/i, "");
  const withLeadingSlash = withoutOrigin.startsWith("/") ? withoutOrigin : `/${withoutOrigin}`;
  const clean = withLeadingSlash.split("#")[0]?.split("?")[0] || "/";
  const normalized = clean.replace(/\/+$/, "");
  return normalized || "/";
}

function normalizeLabel(value: string | undefined | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function resolveSiteUrl(): string {
  const raw = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

export function toAbsoluteUrl(pathOrUrl: string | undefined | null): string | undefined {
  if (!pathOrUrl) return undefined;
  const value = pathOrUrl.trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${resolveSiteUrl()}${normalizePath(value)}`;
}

export function resolveNavigationLabel(
  navbar: NavbarContent | undefined,
  path: string,
  fallback: string
): string {
  const fallbackLabel = normalizeLabel(fallback);
  if (!navbar) return fallbackLabel;

  const normalizedPath = normalizePath(path);

  const directLinks = [...(navbar.links || []), ...(navbar.secondaryLinks || [])];
  const directMatch = directLinks.find((link) => normalizePath(link.href) === normalizedPath);
  if (directMatch?.label) {
    return directMatch.label;
  }

  const menuMatches = (navbar.secondaryMenus || []).flatMap((menu) =>
    menu.items
      .filter((item) => normalizePath(item.href) === normalizedPath)
      .map((item) => ({ menuLabel: menu.label, itemLabel: item.label }))
  );

  if (menuMatches.length === 1) {
    return menuMatches[0].itemLabel;
  }

  if (menuMatches.length > 1) {
    const uniqueMenus = [...new Set(menuMatches.map((item) => normalizeLabel(item.menuLabel)).filter(Boolean))];
    if (uniqueMenus.length === 1) {
      return uniqueMenus[0];
    }
    if (fallbackLabel) {
      return fallbackLabel;
    }
    return menuMatches[0].itemLabel;
  }

  return fallbackLabel;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[], currentPath: string) {
  const cleanItems = items
    .map((item) => ({ label: normalizeLabel(item.label), href: item.href }))
    .filter((item) => item.label.length > 0);

  if (!cleanItems.length) {
    return null;
  }

  const currentUrl = toAbsoluteUrl(currentPath);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: cleanItems.map((item, index) => {
      const isLast = index === cleanItems.length - 1;
      const url = item.href ? toAbsoluteUrl(item.href) : isLast ? currentUrl : undefined;

      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        ...(url ? { item: url } : {}),
      };
    }),
  };
}
