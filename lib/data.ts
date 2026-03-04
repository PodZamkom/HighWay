import type { SiteContent } from "@/types/site";
import { unstable_noStore as noStore } from "next/cache";
import {
  readCatalogLabels,
  readFooter,
  readGlobalSeo,
  readHomeContent,
  readNavigation,
} from "@/lib/cmsRepository";

export async function getSiteContent(): Promise<SiteContent> {
  noStore();

  const [homeContent, navigation, footer, globalSeo, catalogLabels] = await Promise.all([
    readHomeContent(),
    readNavigation(),
    readFooter(),
    readGlobalSeo(),
    readCatalogLabels(),
  ]);

  return {
    seo: globalSeo,
    navbar: navigation,
    hero: homeContent.hero,
    promoBanners: homeContent.promoBanners,
    calculator: homeContent.calculator,
    marketSection: homeContent.marketSection,
    teamSection: homeContent.teamSection,
    catalogSection: catalogLabels.catalogSection,
    carDetail: catalogLabels.carDetail,
    footer,
  };
}
