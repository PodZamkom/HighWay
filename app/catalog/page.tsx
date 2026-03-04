import { CarCatalog } from "@/components/CarCatalog";
import { buildBreadcrumbJsonLd, resolveNavigationLabel } from "@/lib/breadcrumbs";
import { getSiteContent } from "@/lib/data";

export default async function CatalogPage({
    searchParams,
}: {
    searchParams: Promise<{ market?: string }>;
}) {
    const { market } = await searchParams;
    const siteContent = await getSiteContent();
    const catalogLabel = siteContent.catalogSection.title?.trim() || "Каталог автомобилей";
    const breadcrumbLabel = resolveNavigationLabel(siteContent.navbar, "/catalog", catalogLabel);
    const breadcrumbSchema = buildBreadcrumbJsonLd(
        [
            { label: "Главная", href: "/" },
            { label: breadcrumbLabel },
        ],
        "/catalog"
    );

    return (
        <>
            <CarCatalog initialMarket={market} catalogLabel={catalogLabel} />
            {breadcrumbSchema ? (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            ) : null}
        </>
    );
}
