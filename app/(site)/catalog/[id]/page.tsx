import type { Metadata } from "next";
import { CarDetailClient } from "@/components/CarDetailClient";
import { buildBreadcrumbJsonLd, resolveNavigationLabel, toAbsoluteUrl } from "@/lib/breadcrumbs";
import {
  entityToLegacyCar,
  getPublicCatalogCar,
  getPublicCatalogDetailSeoTemplate,
} from "@/lib/catalog/catalogPublicReadService";
import { getSiteContent } from "@/lib/site/siteContentReadService";

function applyTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => values[key] ?? "");
}

function normalizeDescription(value: string, maxLength = 220): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 1)}…`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const [carEntity, seoTemplate] = await Promise.all([
    getPublicCatalogCar(id),
    getPublicCatalogDetailSeoTemplate(),
  ]);

  if (!carEntity) {
    return {
      title: "Автомобиль не найден",
      description: "Запрошенная карточка автомобиля не найдена.",
      robots: "noindex,follow",
    };
  }

  const car = entityToLegacyCar(carEntity);
  const values = {
    id: car.id,
    brand: car.brand,
    model: car.model,
    year: String(car.year),
    price: `${car.price_value} ${car.price_currency}`,
    description: normalizeDescription(car.description || ""),
  };

  const title = applyTemplate(seoTemplate.titleTemplate, values);
  const description = applyTemplate(seoTemplate.descriptionTemplate, values);
  const canonicalPath = applyTemplate(seoTemplate.canonicalTemplate, values);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: toAbsoluteUrl(canonicalPath),
      images: seoTemplate.ogImage ? [seoTemplate.ogImage] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: seoTemplate.ogImage ? [seoTemplate.ogImage] : undefined,
    },
    robots: seoTemplate.robots || "index,follow",
  };
}

export default async function CarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [siteContent, catalogCar] = await Promise.all([
    getSiteContent(),
    getPublicCatalogCar(id),
  ]);

  const catalogFallback = siteContent.catalogSection.title?.trim() || "Каталог автомобилей";
  const catalogLabel = resolveNavigationLabel(siteContent.navbar, "/catalog", catalogFallback);
  const car = catalogCar ? entityToLegacyCar(catalogCar) : null;
  const detailLabel = car ? `${car.brand} ${car.model}` : "Автомобиль";
  const breadcrumbSchema = buildBreadcrumbJsonLd(
    [
      { label: "Главная", href: "/" },
      { label: catalogLabel, href: "/catalog" },
      { label: detailLabel },
    ],
    `/catalog/${encodeURIComponent(id)}`,
  );
  const productSchema = car
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `${car.brand} ${car.model} ${car.year}`,
        description: normalizeDescription(car.description || ""),
        sku: car.id,
        image: car.images || [],
        offers: {
          "@type": "Offer",
          priceCurrency: car.price_currency,
          price: car.price_value,
          availability: "https://schema.org/InStock",
          url: toAbsoluteUrl(`/catalog/${encodeURIComponent(id)}`),
        },
      }
    : null;

  return (
    <>
      <CarDetailClient car={car} catalogLabel={catalogLabel} whatsappLink={siteContent.navbar.whatsapp} />
      {breadcrumbSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      ) : null}
      {productSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      ) : null}
    </>
  );
}
