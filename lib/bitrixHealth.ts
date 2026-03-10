import type { BitrixSettings } from "@/types/bitrix";
import { resolveBitrixMethodUrl } from "@/lib/bitrixSettingsStore";

type AnyObject = Record<string, unknown>;

export class BitrixHealthError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "BitrixHealthError";
    this.status = status;
  }
}

function resolveCustomHeaders(headers: Array<{ name: string; value: string; enabled: boolean }>) {
  const result: Record<string, string> = {};

  for (const item of headers) {
    const name = item.name.trim();
    if (!item.enabled || !name) continue;
    if (name.toLowerCase() === "content-type") continue;
    result[name] = item.value ?? "";
  }

  return result;
}

function validateAdditionalFields(rawJson: string) {
  try {
    const parsed = JSON.parse(rawJson || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new BitrixHealthError("Дополнительные поля должны быть объектом ключ-значение", 400);
    }
  } catch (error) {
    if (error instanceof BitrixHealthError) {
      throw error;
    }
    throw new BitrixHealthError("Дополнительные поля заполнены некорректно", 400);
  }
}

export async function runBitrixHealthCheck(settings: BitrixSettings) {
  if (!settings.enabled) {
    throw new BitrixHealthError("Интеграция отключена (enabled=false)", 503);
  }

  if (!settings.webhookUrl) {
    throw new BitrixHealthError("Webhook URL не заполнен", 503);
  }

  validateAdditionalFields(settings.additionalFieldsJson);

  const fieldsMethodUrl = resolveBitrixMethodUrl(settings.webhookUrl, "crm.deal.fields");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), settings.timeoutMs);

  let response: Response;
  try {
    response = await fetch(fieldsMethodUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...resolveCustomHeaders(settings.headers),
      },
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new BitrixHealthError("Таймаут запроса к Bitrix", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const rawBody = await response.text();
  let data: AnyObject = {};
  if (rawBody) {
    try {
      data = JSON.parse(rawBody) as AnyObject;
    } catch {
      data = { rawBody };
    }
  }

  const apiError = typeof data.error === "string" ? data.error : "";
  const apiErrorDescription = typeof data.error_description === "string" ? data.error_description : "";
  if (!response.ok || apiError) {
    throw new BitrixHealthError(apiErrorDescription || apiError || `Ошибка webhook (${response.status})`, 502);
  }

  return {
    ok: true,
    message: "Webhook доступен, метод crm.deal.fields отвечает корректно.",
  };
}
