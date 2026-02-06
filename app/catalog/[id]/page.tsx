import Link from 'next/link';
import { CarDetailClient } from '@/components/CarDetailClient';
import { importedCarsDb } from '@/data/cars_imported_db';

export const dynamic = 'force-dynamic';

export default function CarPage({ params }: { params: { id: string } }) {
    const car = importedCarsDb.find((c) => c.id === params.id);

    if (!car) {
        return (
            <div className="bg-zinc-950 min-h-screen pb-20 pt-24 text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
                        Назад в каталог
                    </Link>
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8">
                        <h1 className="text-2xl font-bold mb-2">Авто не найдено</h1>
                        <p className="text-zinc-400">Проверьте ссылку или вернитесь в каталог.</p>
                    </div>
                </div>
            </div>
        );
    }

    return <CarDetailClient car={car} />;
}
