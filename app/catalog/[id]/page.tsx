import { CarDetailClient } from '@/components/CarDetailClient';

export const dynamic = 'force-dynamic';

export default async function CarPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <CarDetailClient carId={id} />;
}
