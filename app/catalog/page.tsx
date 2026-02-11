import { CarCatalog } from "@/components/CarCatalog";

export default async function CatalogPage({
    searchParams,
}: {
    searchParams: Promise<{ market?: string }>;
}) {
    const { market } = await searchParams;
    return <CarCatalog />;
}
