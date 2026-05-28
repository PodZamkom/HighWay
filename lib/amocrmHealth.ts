import type { AmocrmSettings } from "@/types/amocrm";
import { AmocrmError, fetchAccountInfo } from "@/lib/amocrmClient";

export class AmocrmHealthError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "AmocrmHealthError";
    this.status = status;
  }
}

export async function runAmocrmHealthCheck(settings: AmocrmSettings) {
  if (!settings.enabled) {
    throw new AmocrmHealthError("Интеграция отключена (enabled=false)", 503);
  }
  if (!settings.subdomain) {
    throw new AmocrmHealthError("Не указан поддомен amoCRM", 503);
  }
  if (!settings.accessToken) {
    throw new AmocrmHealthError("Не указан токен amoCRM", 503);
  }

  try {
    const account = await fetchAccountInfo(settings);
    return {
      ok: true,
      message: `amoCRM отвечает: аккаунт «${account.name}» (${account.subdomain})`,
    };
  } catch (error) {
    if (error instanceof AmocrmError) {
      throw new AmocrmHealthError(error.message, error.status);
    }
    throw error;
  }
}
