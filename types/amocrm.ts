export interface AmocrmSettings {
  enabled: boolean;
  subdomain: string;
  accessToken: string;
  pipelineId: number | null;
  statusId: number | null;
  responsibleUserId: number | null;
  leadNameTemplate: string;
  noteTemplate: string;
  timeoutMs: number;
  /** Treat phone as duplicate check key */
  dedupeByPhone: boolean;
  /** Tags to attach to created lead */
  tags: string[];
  /** If true, leads go via `/leads/unsorted/forms` into the "Неразобранное" inbox. */
  useUnsorted: boolean;
  /** Public source identifier shown in amoCRM unsorted card */
  sourceName: string;
}

export interface AmocrmPipeline {
  id: number;
  name: string;
  isMain: boolean;
  statuses: AmocrmStatus[];
}

export interface AmocrmStatus {
  id: number;
  name: string;
  color?: string;
  sort?: number;
  type?: number;
}

export interface AmocrmUser {
  id: number;
  name: string;
  email?: string;
}

export interface AmocrmMeta {
  pipelines: AmocrmPipeline[];
  users: AmocrmUser[];
  accountSubdomain?: string;
  accountName?: string;
}

export const AMOCRM_TEMPLATE_VARIABLES = [
  "source",
  "name",
  "phone",
  "messenger",
  "contactMethod",
  "pageUrl",
  "comment",
] as const;

export type CrmProvider = "bitrix" | "amocrm" | "both";

export interface CrmProviderSettings {
  provider: CrmProvider;
}
