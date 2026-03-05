import { Fragment } from "react";
import { LandingPriceCalculator } from "@/components/calculator/LandingPriceCalculator";
import { Hero } from "@/components/Hero";
import { MarketGrid } from "@/components/MarketGrid";
import { PromoBanners } from "@/components/PromoBanners";
import { TeamSection } from "@/components/TeamSection";
import { getSiteContent } from "@/lib/data";
import { readHomeLayout } from "@/lib/cmsRepository";

export default async function Home() {
  const [siteContent, homeLayout] = await Promise.all([getSiteContent(), readHomeLayout()]);

  const blockMap = {
    hero: <Hero content={siteContent.hero} />,
    promo: <PromoBanners content={siteContent.promoBanners} />,
    market: <MarketGrid content={siteContent.marketSection} />,
    calculator: (
      <section id="calculator" className="relative z-20 mx-auto max-w-7xl px-4 py-20">
        <div className="rounded-2xl border border-[#d8dce3] bg-[#f6f7f9] p-8 shadow-sm">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
            {siteContent.calculator.sectionTitle}{" "}
            <span className="text-orange-600">{siteContent.calculator.sectionHighlight}</span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-gray-500">
            {siteContent.calculator.sectionDescription}
          </p>
          <LandingPriceCalculator content={siteContent.calculator.form} />
        </div>
      </section>
    ),
    team: <TeamSection content={siteContent.teamSection} />,
  };

  return (
    <div className="pb-16">
      {homeLayout.blocks
        .filter((block) => block.enabled)
        .map((block) => (
          <Fragment key={block.key}>{blockMap[block.key]}</Fragment>
        ))}
    </div>
  );
}
