import { CarDetailClient } from '@/components/CarDetailClient';

export default function CarPage({ params }: { params: { id: string } }) {
    return <CarDetailClient carId={params.id} />;
}
