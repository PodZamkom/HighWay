export type BitrixPhoneType = 'WORK' | 'MOBILE' | 'HOME' | 'FAX' | 'OTHER';

export interface BitrixHeaderSetting {
  id: string;
  name: string;
  value: string;
  enabled: boolean;
}

export interface BitrixSettings {
  enabled: boolean;
  webhookUrl: string;
  timeoutMs: number;
  headers: BitrixHeaderSetting[];
  titlePrefix: string;
  titleTemplate: string;
  sourceId: string;
  assignedById: number | null;
  phoneType: BitrixPhoneType;
  sourceDescriptionTemplate: string;
  commentsTemplate: string;
  additionalFieldsJson: string;
  registerSonetEvent: boolean;
}

export const BITRIX_PHONE_TYPES: BitrixPhoneType[] = ['WORK', 'MOBILE', 'HOME', 'FAX', 'OTHER'];

export const BITRIX_TEMPLATE_VARIABLES = [
  'titlePrefix',
  'source',
  'name',
  'phone',
  'messenger',
  'contactMethod',
  'pageUrl',
  'comment',
] as const;
