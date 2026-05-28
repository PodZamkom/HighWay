import fs from "fs/promises";
import path from "path";
import type { AmocrmSettings } from "@/types/amocrm";

const RUNTIME_DIR = process.env.APP_RUNTIME_DIR?.trim() || path.join(process.cwd(), "runtime");
const AMOCRM_SETTINGS_FILE = path.join(RUNTIME_DIR, "amocrm-settings.json");
const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 30000;

async function ensureRuntimeDir() {
  await fs.mkdir(RUNTIME_DIR, { recursive: true });
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toBooleanValue(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1") return true;
    if (v === "false" || v === "0") return false;
  }
  return fallback;
}

function toIntOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed) && parsed > 0) return Math.trunc(parsed);
  }
  return null;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const tag = typeof item === "string" ? item.trim().slice(0, 60) : "";
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= 20) break;
  }
  return out;
}

function normalizeSubdomain(value: unknown): string {
  let raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!raw) return "";
  raw = raw.replace(/^https?:\/\//, "");
  raw = raw.replace(/\/.*$/, "");
  // If user typed full host like "x.amocrm.ru" keep only the first label
  const firstLabel = raw.split(".")[0];
  return firstLabel.replace(/[^a-z0-9-]/g, "");
}

export function defaultAmocrmSettings(): AmocrmSettings {
  return {
    enabled: false,
    subdomain: process.env.AMOCRM_SUBDOMAIN?.trim() || "",
    accessToken: process.env.AMOCRM_ACCESS_TOKEN?.trim() || "",
    pipelineId: toIntOrNull(process.env.AMOCRM_PIPELINE_ID),
    statusId: toIntOrNull(process.env.AMOCRM_STATUS_ID),
    responsibleUserId: toIntOrNull(process.env.AMOCRM_RESPONSIBLE_USER_ID),
    leadNameTemplate: "{source}: {name}",
    noteTemplate:
      "Имя: {name}\nТелефон: {phone}\nСпособ связи: {contactMethod}\nСтраница: {pageUrl}\nКомментарий: {comment}",
    timeoutMs: 10000,
    dedupeByPhone: true,
    tags: ["highway-site"],
  };
}

export function normalizeAmocrmSettings(input: unknown): AmocrmSettings {
  const defaults = defaultAmocrmSettings();
  if (!input || typeof input !== "object") return defaults;
  const v = input as Record<string, unknown>;

  const timeoutValue = typeof v.timeoutMs === "number" ? v.timeoutMs : Number(v.timeoutMs);
  const timeoutMs =
    Number.isFinite(timeoutValue) && timeoutValue >= MIN_TIMEOUT_MS && timeoutValue <= MAX_TIMEOUT_MS
      ? Math.trunc(timeoutValue)
      : defaults.timeoutMs;

  return {
    enabled: toBooleanValue(v.enabled, defaults.enabled),
    subdomain: normalizeSubdomain(v.subdomain) || defaults.subdomain,
    accessToken: toStringValue(v.accessToken),
    pipelineId: toIntOrNull(v.pipelineId),
    statusId: toIntOrNull(v.statusId),
    responsibleUserId: toIntOrNull(v.responsibleUserId),
    leadNameTemplate: toStringValue(v.leadNameTemplate) || defaults.leadNameTemplate,
    noteTemplate: toStringValue(v.noteTemplate) || defaults.noteTemplate,
    timeoutMs,
    dedupeByPhone: toBooleanValue(v.dedupeByPhone, defaults.dedupeByPhone),
    tags: normalizeTags(v.tags),
  };
}

export async function readAmocrmSettings(): Promise<AmocrmSettings> {
  try {
    const raw = await fs.readFile(AMOCRM_SETTINGS_FILE, "utf-8");
    return normalizeAmocrmSettings(JSON.parse(raw));
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      console.error("Failed to read amocrm settings, fallback to defaults:", error);
    }
    const fallback = defaultAmocrmSettings();
    await writeAmocrmSettings(fallback);
    return fallback;
  }
}

export async function writeAmocrmSettings(next: unknown): Promise<AmocrmSettings> {
  const normalized = normalizeAmocrmSettings(next);
  await ensureRuntimeDir();
  await fs.writeFile(AMOCRM_SETTINGS_FILE, `${JSON.stringify(normalized, null, 2)}\n`, "utf-8");
  return normalized;
}

export function buildAmocrmHost(subdomain: string): string {
  const sd = normalizeSubdomain(subdomain);
  return sd ? `https://${sd}.amocrm.ru` : "";
}
