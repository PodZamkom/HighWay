import { LandingPriceCalculator } from "@/components/calculator/LandingPriceCalculator";
import { Hero } from "@/components/Hero";
import { MarketGrid } from "@/components/MarketGrid";
import { HomeCatalogBlocks } from "@/components/HomeCatalogBlocks";
import { getSiteContent } from "@/lib/data";

export default async function Home() {
    const siteContent = await getSiteContent();

    return (
        <div className="pb-20">
            <Hero />

            <MarketGrid content={siteContent.marketSection} />

            {/* Calculator Section */}
            <section id="calculator" className="max-w-7xl mx-auto px-4 relative z-20 py-24">
                <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-2xl shadow-black/5 dark:border-white/10 dark:bg-zinc-900 dark:shadow-black/30">
                    <h2 className="mb-8 text-center text-3xl font-bold text-zinc-900 dark:text-white">
                        Честный калькулятор <span className="text-red-500">под ключ</span>
                    </h2>
                    <p className="mx-auto mb-12 max-w-2xl text-center text-zinc-600 dark:text-zinc-400">
                        Выберите параметры автомобиля и получите точную цену в Минске с учетом таможенных платежей, утильсбора и нашей комиссии.
                    </p>
                    <LandingPriceCalculator />
                </div>
            </section>

            <HomeCatalogBlocks content={siteContent.marketSection} />
        </div>
    );
}
