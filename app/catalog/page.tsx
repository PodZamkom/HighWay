import type { Metadata } from "next";
import { CarCatalog } from "@/components/CarCatalog";
import { buildBreadcrumbJsonLd, resolveNavigationLabel, toAbsoluteUrl } from "@/lib/breadcrumbs";
import { listCatalogCarsLegacy } from "@/lib/catalogRepository";
import { readCatalogListSeo } from "@/lib/cmsRepository";
import { getSiteContent } from "@/lib/data";

const FALLBACK_USD_TO_EUR_RATE = 0.85844;

async function getUsdToEurRate(): Promise<number> {
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR", {
      next: { revalidate: 60 * 60 * 6 },
    });
    if (!response.ok) return FALLBACK_USD_TO_EUR_RATE;
    const payload = (await response.json()) as { rates?: { EUR?: unknown } };
    const rate = Number(payload?.rates?.EUR);
    if (!Number.isFinite(rate) || rate <= 0) return FALLBACK_USD_TO_EUR_RATE;
    return rate;
  } catch {
    return FALLBACK_USD_TO_EUR_RATE;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await readCatalogListSeo();
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: seo.canonical,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: toAbsoluteUrl(seo.canonical),
      images: seo.ogImage ? [seo.ogImage] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string }>;
}) {
  const { market } = await searchParams;
  const [siteContent, cars, catalogSeo, usdToEurRate] = await Promise.all([
    getSiteContent(),
    listCatalogCarsLegacy({ page: 1, pageSize: 5000 }),
    readCatalogListSeo(),
    getUsdToEurRate(),
  ]);

  const catalogLabel = siteContent.catalogSection.title?.trim() || "Каталог автомобилей";
  const breadcrumbLabel = resolveNavigationLabel(siteContent.navbar, "/catalog", catalogLabel);
  const breadcrumbSchema = buildBreadcrumbJsonLd(
    [
      { label: "Главная", href: "/" },
      { label: breadcrumbLabel },
    ],
    "/catalog",
  );
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: catalogSeo.schemaName,
    description: catalogSeo.schemaDescription,
    url: toAbsoluteUrl("/catalog"),
  };

  return (
    <>
      <CarCatalog initialMarket={market} catalogLabel={catalogLabel} cars={cars} usdToEurRate={usdToEurRate} />
      {breadcrumbSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
    </>
  );
}
