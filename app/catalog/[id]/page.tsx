import { CarDetailClient } from '@/components/CarDetailClient';

export const dynamic = 'force-dynamic';

export default function CarPage({ params }: { params: { id: string } }) {
    return <CarDetailClient carId={params.id} />;
}
