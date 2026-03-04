import { dbQuery, isDatabaseConfigured } from "@/lib/db";
import { ensureDatabaseReady } from "@/lib/db/ready";
import type { AdminAuditEntry } from "@/types/admin";

export async function writeAdminAuditLog(params: {
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  await ensureDatabaseReady();

  await dbQuery(
    `
      INSERT INTO admin_audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [params.userId, params.action, params.entityType, params.entityId ?? null, JSON.stringify(params.details || {})],
  );
}

export async function listAdminAuditLogs(limit = 100): Promise<AdminAuditEntry[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  await ensureDatabaseReady();

  const safeLimit = Math.max(1, Math.min(500, limit));
  const response = await dbQuery<{
    id: number;
    user_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    details: Record<string, unknown>;
    created_at: string;
  }>(
    `
      SELECT id, user_id, action, entity_type, entity_id, details, created_at
      FROM admin_audit_logs
      ORDER BY created_at DESC, id DESC
      LIMIT $1
    `,
    [safeLimit],
  );

  return response.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details || {},
    createdAt: row.created_at,
  }));
}
