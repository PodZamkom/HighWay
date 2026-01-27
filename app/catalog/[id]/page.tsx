import { cars_db } from '@/data/cars_db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Calendar, Activity, Zap } from 'lucide-react';
import { LandingPriceCalculator } from '@/components/calculator/LandingPriceCalculator'; // You might want to pass props to pre-fill it

// Generate static params for all known cars
export async function generateStaticParams() {
    return cars_db.map((car) => ({
        id: car.id,
    }));
}

export default function CarPage({ params }: { params: { id: string } }) {
    const car = cars_db.find((c) => c.id === params.id);

    if (!car) {
        notFound();
    }

    return (
        <div className="bg-zinc-950 min-h-screen pb-20 pt-24 text-white">
            <div className="max-w-7xl mx-auto px-6">

                {/* Breadcrumb */}
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={16} /> Назад в каталог
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Left: Images */}
                    <div className="space-y-4">
                        <div className="rounded-3xl overflow-hidden border border-white/10 aspect-[4/3] relative bg-zinc-900">
                            {car.images[0] ? (
                                <img src={car.images[0]} alt={car.model} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-zinc-600">Нет фото</div>
                            )}
                            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded text-xs font-bold border border-white/10 uppercase">
                                {car.market} Spec
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Spec Cards */}
                            <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center">
                                <Activity className="mx-auto text-red-500 mb-2" />
                                <div className="text-2xl font-bold font-mono">{car.specs.acceleration_0_100}s</div>
                                <div className="text-xs text-zinc-500">0-100 км/ч</div>
                            </div>
                            <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 text-center">
                                <Zap className="mx-auto text-yellow-500 mb-2" />
                                <div className="text-2xl font-bold font-mono">{car.specs.range_km} км</div>
                                <div className="text-xs text-zinc-500">Запас хода (CLTC)</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div>
                        <div className="mb-2 text-red-500 font-bold tracking-wider text-sm uppercase">{car.brand}</div>
                        <h1 className="text-5xl font-black tracking-tight mb-4">{car.model} <span className="text-zinc-600">{car.year}</span></h1>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-white/10 px-3 py-1 rounded-full text-sm font-medium">{car.type}</div>
                            <div className="bg-white/10 px-3 py-1 rounded-full text-sm font-medium">{car.specs.drive}</div>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${car.availability === 'In Stock (Minsk)' ? 'bg-green-500 text-black' : 'text-zinc-400 border border-white/20'}`}>
                                {car.availability}
                            </div>
                        </div>

                        <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10 mb-8">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-zinc-400">Цена в Китае (FOB)</span>
                                <span className="text-3xl font-bold text-white">${car.price_fob.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-zinc-500 text-right">Не включает доставку и таможню</p>
                        </div>

                        {/* Trims */}
                        <div className="mb-8">
                            <h3 className="font-bold mb-4 flex items-center gap-2">Комплектации <Calendar size={16} className="text-zinc-500" /></h3>
                            <div className="space-y-3">
                                {car.trims.map((trim) => (
                                    <div key={trim.name} className="flex justify-between items-center p-4 rounded-xl border border-white/10 hover:border-red-500/50 cursor-pointer transition-colors bg-white/5">
                                        <div>
                                            <div className="font-bold">{trim.name}</div>
                                            <div className="text-xs text-zinc-500 max-w-[250px]">{trim.features.join(', ')}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-lg">
                                                {trim.price_adjustment > 0 ? `+$${trim.price_adjustment}` : 'Base'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors">
                                Заказать расчет
                            </button>
                            <button className="flex-1 bg-transparent border border-white/20 text-white font-bold py-4 rounded-xl hover:bg-white/5 transition-colors">
                                Написать в WhatsApp
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
