import { CarDetailClient } from '@/components/CarDetailClient';
import { importedCarsDb } from '@/data/cars_imported_db';
import { buildBreadcrumbJsonLd, resolveNavigationLabel } from '@/lib/breadcrumbs';
import { getSiteContent } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function CarPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const siteContent = await getSiteContent();
    const catalogFallback = siteContent.catalogSection.title?.trim() || 'Каталог автомобилей';
    const catalogLabel = resolveNavigationLabel(siteContent.navbar, '/catalog', catalogFallback);
    const car = importedCarsDb.find((item) => item.id === id);
    const detailLabel = car ? `${car.brand} ${car.model}` : 'Автомобиль';
    const breadcrumbSchema = buildBreadcrumbJsonLd(
        [
            { label: 'Главная', href: '/' },
            { label: catalogLabel, href: '/catalog' },
            { label: detailLabel },
        ],
        `/catalog/${encodeURIComponent(id)}`
    );

    return (
        <>
            <CarDetailClient carId={id} catalogLabel={catalogLabel} />
            {breadcrumbSchema ? (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            ) : null}
        </>
    );
}
