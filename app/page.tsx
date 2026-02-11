import { LandingPriceCalculator } from "@/components/calculator/LandingPriceCalculator";
import { Hero } from "@/components/Hero";
import { MarketGrid } from "@/components/MarketGrid";
import { CarCatalog } from "@/components/CarCatalog";
import { getSiteContent } from "@/lib/data";

export default async function Home() {
    const siteContent = await getSiteContent();

    return (
        <div className="pb-0">
            <Hero />

            <MarketGrid content={siteContent.marketSection} />

            {/* Calculator Section */}
            <section id="calculator" className="max-w-7xl mx-auto px-4 relative z-20 py-20">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-sm">
                    <h2 className="text-3xl font-bold mb-4 text-center text-gray-900">
                        Честный калькулятор <span className="text-orange-600">под ключ</span>
                    </h2>
                    <p className="text-center text-gray-500 max-w-2xl mx-auto mb-10">
                        Выберите параметры автомобиля и получите точную цену в Минске с учетом таможенных платежей, утильсбора и нашей комиссии.
                    </p>
                    <LandingPriceCalculator />
                </div>
            </section>

            <CarCatalog />
        </div>
    );
}
