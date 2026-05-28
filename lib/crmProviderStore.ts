import fs from "fs/promises";
import path from "path";
import type { CrmProvider, CrmProviderSettings } from "@/types/amocrm";

const RUNTIME_DIR = process.env.APP_RUNTIME_DIR?.trim() || path.join(process.cwd(), "runtime");
const CRM_PROVIDER_FILE = path.join(RUNTIME_DIR, "crm-provider.json");

async function ensureRuntimeDir() {
  await fs.mkdir(RUNTIME_DIR, { recursive: true });
}

function normalizeProvider(value: unknown): CrmProvider {
  if (typeof value !== "string") return defaultProvider();
  const v = value.trim().toLowerCase();
  if (v === "amocrm" || v === "amo") return "amocrm";
  if (v === "both" || v === "all" || v === "all-of-them") return "both";
  if (v === "bitrix" || v === "bitrix24") return "bitrix";
  return defaultProvider();
}

function defaultProvider(): CrmProvider {
  const env = process.env.CRM_PROVIDER?.trim().toLowerCase();
  if (env === "amocrm") return "amocrm";
  if (env === "both") return "both";
  return "bitrix";
}

export function normalizeCrmProviderSettings(input: unknown): CrmProviderSettings {
  if (!input || typeof input !== "object") {
    return { provider: defaultProvider() };
  }
  const v = input as Record<string, unknown>;
  return { provider: normalizeProvider(v.provider) };
}

export async function readCrmProviderSettings(): Promise<CrmProviderSettings> {
  try {
    const raw = await fs.readFile(CRM_PROVIDER_FILE, "utf-8");
    return normalizeCrmProviderSettings(JSON.parse(raw));
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      console.error("Failed to read crm provider, fallback to defaults:", error);
    }
    const fallback: CrmProviderSettings = { provider: defaultProvider() };
    await writeCrmProviderSettings(fallback);
    return fallback;
  }
}

export async function writeCrmProviderSettings(next: unknown): Promise<CrmProviderSettings> {
  const normalized = normalizeCrmProviderSettings(next);
  await ensureRuntimeDir();
  await fs.writeFile(CRM_PROVIDER_FILE, `${JSON.stringify(normalized, null, 2)}\n`, "utf-8");
  return normalized;
}
