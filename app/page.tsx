import { LandingPriceCalculator } from "@/components/calculator/LandingPriceCalculator";
import { Hero } from "@/components/Hero";
import { MarketGrid } from "@/components/MarketGrid";
import { CarCatalog } from "@/components/CarCatalog";

export default function Home() {
    return (
        <div className="pb-20">
            <Hero />

            <MarketGrid />

            {/* Calculator Section */}
            <section id="calculator" className="max-w-7xl mx-auto px-4 relative z-20 py-24">
                <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-3xl font-bold mb-8 text-center text-white">
                        Честный калькулятор <span className="text-red-500">под ключ</span>
                    </h2>
                    <p className="text-center text-zinc-400 max-w-2xl mx-auto mb-12">
                        Выберите параметры автомобиля и получите точную цену в Минске с учетом таможенных платежей, утильсбора и нашей комиссии.
                    </p>
                    <LandingPriceCalculator />
                </div>
            </section>

            <CarCatalog />
        </div>
    );
}
