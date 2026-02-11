import { LandingPriceCalculator } from "@/components/calculator/LandingPriceCalculator";
import { Hero } from "@/components/Hero";
import { MarketGrid } from "@/components/MarketGrid";
import { getSiteContent } from "@/lib/data";

export default async function Home() {
    const siteContent = await getSiteContent();

    return (
        <div className="pb-16">
            <Hero />

            <MarketGrid content={siteContent.marketSection} />

            {/* Calculator Section */}
            <section id="calculator" className="relative z-20 mx-auto max-w-7xl px-4 py-20">
                <div className="rounded-2xl border border-[#d8dce3] bg-[#f6f7f9] p-8 shadow-sm">
                    <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
                        Честный калькулятор <span className="text-orange-600">под ключ</span>
                    </h2>
                    <p className="mx-auto mb-10 max-w-2xl text-center text-gray-500">
                        Выберите параметры автомобиля и получите точную цену в Минске с учетом таможенных платежей, утильсбора и нашей комиссии.
                    </p>
                    <LandingPriceCalculator />
                </div>
            </section>
        </div>
    );
}
