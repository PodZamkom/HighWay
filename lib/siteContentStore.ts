import fs from "fs/promises";
import path from "path";
import type { SiteContent } from "@/types/site";

const SITE_CONTENT_FILE = path.join(process.cwd(), "data", "site.json");

export async function readSiteContent(): Promise<SiteContent> {
  const raw = await fs.readFile(SITE_CONTENT_FILE, "utf-8");
  return JSON.parse(raw) as SiteContent;
}

export async function writeSiteContent(nextContent: SiteContent): Promise<void> {
  await fs.writeFile(SITE_CONTENT_FILE, `${JSON.stringify(nextContent, null, 2)}\n`, "utf-8");
}

export function getSiteContentFilePath() {
  return SITE_CONTENT_FILE;
}
