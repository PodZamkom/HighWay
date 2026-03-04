export interface AdminSession {
  sessionId: string;
  userId: string;
  login: string;
  expiresAt: string;
}

export interface AdminAuditEntry {
  id: number;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}
