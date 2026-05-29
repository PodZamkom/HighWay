import type {
  AmocrmMeta,
  AmocrmPipeline,
  AmocrmSettings,
  AmocrmStatus,
  AmocrmUser,
} from "@/types/amocrm";
import { buildAmocrmHost } from "@/lib/amocrmSettingsStore";

export class AmocrmError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "AmocrmError";
    this.status = status;
  }
}

interface FetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  timeoutMs: number;
}

async function amoFetch(
  settings: Pick<AmocrmSettings, "subdomain" | "accessToken" | "timeoutMs">,
  pathname: string,
  options: FetchOptions = { timeoutMs: 10000 },
): Promise<{ status: number; data: any }> {
  const host = buildAmocrmHost(settings.subdomain);
  if (!host) throw new AmocrmError("Не указан поддомен amoCRM", 400);
  if (!settings.accessToken) throw new AmocrmError("Не указан токен amoCRM", 400);

  const url = `${host}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Bearer ${settings.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    const rawText = await response.text();
    let data: any = {};
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { raw: rawText };
      }
    }

    if (response.status === 401) {
      throw new AmocrmError("Токен amoCRM недействителен или истёк", 401);
    }
    if (response.status === 403) {
      throw new AmocrmError("Нет прав на эту операцию в amoCRM", 403);
    }
    if (!response.ok) {
      const errDetail =
        data?.["validation-errors"]?.[0]?.errors?.[0]?.detail ||
        data?.detail ||
        data?.title ||
        data?.error ||
        `HTTP ${response.status}`;
      throw new AmocrmError(`amoCRM: ${errDetail}`, 502);
    }

    return { status: response.status, data };
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new AmocrmError("Таймаут запроса к amoCRM", 504);
    }
    if (error instanceof AmocrmError) throw error;
    throw new AmocrmError(`Сбой запроса к amoCRM: ${error?.message || "unknown"}`, 502);
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ----------------------------- META ENDPOINTS ----------------------------- */

export async function fetchAccountInfo(
  settings: Pick<AmocrmSettings, "subdomain" | "accessToken" | "timeoutMs">,
) {
  const { data } = await amoFetch(settings, "/api/v4/account", { timeoutMs: settings.timeoutMs });
  return data as { id: number; name: string; subdomain: string };
}

export async function fetchPipelines(
  settings: Pick<AmocrmSettings, "subdomain" | "accessToken" | "timeoutMs">,
): Promise<AmocrmPipeline[]> {
  const { data } = await amoFetch(settings, "/api/v4/leads/pipelines?with=statuses", {
    timeoutMs: settings.timeoutMs,
  });
  const list: AmocrmPipeline[] = [];
  const items = data?._embedded?.pipelines ?? [];
  for (const p of items) {
    const statuses: AmocrmStatus[] = (p?._embedded?.statuses ?? []).map((s: any) => ({
      id: Number(s.id),
      name: String(s.name ?? ""),
      color: s.color ?? undefined,
      sort: typeof s.sort === "number" ? s.sort : undefined,
      type: typeof s.type === "number" ? s.type : undefined,
    }));
    list.push({
      id: Number(p.id),
      name: String(p.name ?? ""),
      isMain: Boolean(p.is_main),
      statuses,
    });
  }
  return list;
}

export async function fetchUsers(
  settings: Pick<AmocrmSettings, "subdomain" | "accessToken" | "timeoutMs">,
): Promise<AmocrmUser[]> {
  const { data } = await amoFetch(settings, "/api/v4/users?limit=250", {
    timeoutMs: settings.timeoutMs,
  });
  const users: AmocrmUser[] = [];
  const items = data?._embedded?.users ?? [];
  for (const u of items) {
    users.push({
      id: Number(u.id),
      name: String(u.name ?? u.email ?? "Пользователь"),
      email: typeof u.email === "string" ? u.email : undefined,
    });
  }
  return users;
}

export async function fetchAmocrmMeta(
  settings: Pick<AmocrmSettings, "subdomain" | "accessToken" | "timeoutMs">,
): Promise<AmocrmMeta> {
  const [account, pipelines, users] = await Promise.all([
    fetchAccountInfo(settings).catch(() => null),
    fetchPipelines(settings),
    fetchUsers(settings),
  ]);
  return {
    pipelines,
    users,
    accountSubdomain: account?.subdomain,
    accountName: account?.name,
  };
}

/* ------------------------------ LEAD CREATE ------------------------------- */

export interface CreateLeadInput {
  name: string;
  phone: string;
  source: string;
  pageUrl: string;
  comment: string;
  preferredMessenger: string;
}

function applyTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => variables[key] ?? "");
}

export async function findContactByPhone(
  settings: AmocrmSettings,
  phone: string,
): Promise<number | null> {
  const q = encodeURIComponent(phone);
  const { data } = await amoFetch(
    settings,
    `/api/v4/contacts?query=${q}&limit=1`,
    { timeoutMs: settings.timeoutMs },
  );
  const item = data?._embedded?.contacts?.[0];
  return item?.id ? Number(item.id) : null;
}

export async function createContact(
  settings: AmocrmSettings,
  input: { name: string; phone: string; responsibleUserId: number | null },
): Promise<number> {
  const customFieldsValues = [
    {
      field_code: "PHONE",
      values: [{ value: input.phone, enum_code: "WORK" }],
    },
  ];

  const body = [
    {
      name: input.name,
      ...(input.responsibleUserId ? { responsible_user_id: input.responsibleUserId } : {}),
      custom_fields_values: customFieldsValues,
    },
  ];

  const { data } = await amoFetch(settings, "/api/v4/contacts", {
    method: "POST",
    body,
    timeoutMs: settings.timeoutMs,
  });
  const id = data?._embedded?.contacts?.[0]?.id;
  if (!id) throw new AmocrmError("amoCRM не вернул id созданного контакта", 502);
  return Number(id);
}

export async function createLead(
  settings: AmocrmSettings,
  input: CreateLeadInput,
): Promise<{ leadId: number; contactId: number }> {
  const vars: Record<string, string> = {
    source: input.source,
    name: input.name,
    phone: input.phone,
    messenger: input.preferredMessenger,
    contactMethod: input.preferredMessenger,
    pageUrl: input.pageUrl,
    comment: input.comment,
  };

  const leadName = applyTemplate(settings.leadNameTemplate, vars).trim() || `Заявка: ${input.name}`;

  // Branch: "Неразобранное" inbox via unsorted/forms endpoint
  if (settings.useUnsorted) {
    return createUnsortedFormLead(settings, input, vars, leadName);
  }

  // Regular lead creation in a specific pipeline status
  let contactId: number | null = null;
  if (settings.dedupeByPhone) {
    contactId = await findContactByPhone(settings, input.phone).catch(() => null);
  }
  if (!contactId) {
    contactId = await createContact(settings, {
      name: input.name,
      phone: input.phone,
      responsibleUserId: settings.responsibleUserId,
    });
  }

  const leadBody: any = {
    name: leadName,
  };
  if (settings.pipelineId) leadBody.pipeline_id = settings.pipelineId;
  if (settings.statusId) leadBody.status_id = settings.statusId;
  if (settings.responsibleUserId) leadBody.responsible_user_id = settings.responsibleUserId;
  if (settings.tags.length > 0) {
    leadBody._embedded = {
      tags: settings.tags.map((name) => ({ name })),
    };
  }
  leadBody._embedded = {
    ...(leadBody._embedded ?? {}),
    contacts: [{ id: contactId }],
  };

  const { data } = await amoFetch(settings, "/api/v4/leads", {
    method: "POST",
    body: [leadBody],
    timeoutMs: settings.timeoutMs,
  });
  const leadId = data?._embedded?.leads?.[0]?.id;
  if (!leadId) throw new AmocrmError("amoCRM не вернул id созданной сделки", 502);

  // Attach note
  const note = applyTemplate(settings.noteTemplate, vars).trim();
  if (note) {
    await amoFetch(settings, `/api/v4/leads/${leadId}/notes`, {
      method: "POST",
      body: [
        {
          note_type: "common",
          params: { text: note },
        },
      ],
      timeoutMs: settings.timeoutMs,
    }).catch((err) => {
      console.error("amoCRM note attach failed:", err?.message);
    });
  }

  return { leadId: Number(leadId), contactId };
}

/* --------------------------- UNSORTED INBOX FLOW -------------------------- */

async function createUnsortedFormLead(
  settings: AmocrmSettings,
  input: CreateLeadInput,
  vars: Record<string, string>,
  leadName: string,
): Promise<{ leadId: number; contactId: number }> {
  const now = Math.floor(Date.now() / 1000);
  const note = applyTemplate(settings.noteTemplate, vars).trim();

  const leadEntity: Record<string, unknown> = { name: leadName };
  if (settings.responsibleUserId) leadEntity.responsible_user_id = settings.responsibleUserId;
  if (settings.tags.length > 0) {
    leadEntity._embedded = {
      tags: settings.tags.map((name) => ({ name })),
    };
  }

  const contactEntity: Record<string, unknown> = {
    name: input.name,
    custom_fields_values: [
      {
        field_code: "PHONE",
        values: [{ value: input.phone, enum_code: "WORK" }],
      },
    ],
  };

  const sourceUid = `highway-site-${now}-${Math.random().toString(36).slice(2, 8)}`;
  const sourceName = settings.sourceName || "Сайт Highway";

  const body: Record<string, unknown>[] = [
    {
      source_uid: sourceUid,
      source_name: sourceName,
      created_at: now,
      ...(settings.pipelineId ? { pipeline_id: settings.pipelineId } : {}),
      metadata: {
        form_id: "highway-leadform",
        form_name: input.source || "Заказать звонок",
        form_page: input.pageUrl,
        form_sent_at: now,
        ip: "0.0.0.0",
        referer: input.pageUrl,
      },
      _embedded: {
        contacts: [contactEntity],
        leads: [leadEntity],
      },
    },
  ];

  const { data } = await amoFetch(settings, "/api/v4/leads/unsorted/forms", {
    method: "POST",
    body,
    timeoutMs: settings.timeoutMs,
  });

  const unsorted = data?._embedded?.unsorted?.[0];
  const leadId = Number(unsorted?._embedded?.leads?.[0]?.id || unsorted?.lead_id || 0);
  const contactId = Number(unsorted?._embedded?.contacts?.[0]?.id || unsorted?.contact_id || 0);

  if (!leadId) {
    throw new AmocrmError("amoCRM не вернул id неразобранной заявки", 502);
  }

  // Attach note to the lead
  if (note) {
    await amoFetch(settings, `/api/v4/leads/${leadId}/notes`, {
      method: "POST",
      body: [
        {
          note_type: "common",
          params: { text: note },
        },
      ],
      timeoutMs: settings.timeoutMs,
    }).catch((err) => {
      console.error("amoCRM note attach failed:", err?.message);
    });
  }

  return { leadId, contactId };
}
