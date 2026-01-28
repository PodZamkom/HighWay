import siteContent from '@/data/site.json';
import { SiteContent } from '@/types/site';

export async function getSiteContent(): Promise<SiteContent> {
    return siteContent as SiteContent;
}
