import type { Metadata } from "next";
import { CarCatalog } from "@/components/CarCatalog";
import { buildBreadcrumbJsonLd, resolveNavigationLabel, toAbsoluteUrl } from "@/lib/breadcrumbs";
import { getPublicCatalogCars, getPublicCatalogListSeo } from "@/lib/catalog/catalogPublicReadService";
import { getSiteContent } from "@/lib/site/siteContentReadService";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPublicCatalogListSeo();
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
  searchParams: Promise<{ market?: string; availability?: string; engine?: string; body?: string }>;
}) {
  const { market, availability, engine, body } = await searchParams;
  const [siteContent, cars, catalogSeo] = await Promise.all([
    getSiteContent(),
    getPublicCatalogCars(),
    getPublicCatalogListSeo(),
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
      <CarCatalog
        initialMarket={market}
        initialAvailability={availability}
        initialEngine={engine}
        initialBodyType={body}
        catalogLabel={catalogLabel}
        cars={cars}
      />
      {breadcrumbSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
    </>
  );
}
