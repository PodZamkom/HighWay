import type { SiteContent } from "@/types/site";
import { readSiteContent } from "@/lib/siteContentStore";
import { unstable_noStore as noStore } from "next/cache";

export async function getSiteContent(): Promise<SiteContent> {
    noStore();
    return readSiteContent();
}
