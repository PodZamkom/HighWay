import { bootstrapDatabase } from "@/lib/db/bootstrap";
import { isDatabaseConfigured } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrations";

const GLOBAL_READY_KEY = "__highway_db_ready__";

declare global {
  // eslint-disable-next-line no-var
  var __highway_db_ready__: Promise<void> | undefined;
}

export async function ensureDatabaseReady(): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (!globalThis[GLOBAL_READY_KEY]) {
    globalThis[GLOBAL_READY_KEY] = (async () => {
      await runMigrations();
      await bootstrapDatabase();
    })();
  }

  return globalThis[GLOBAL_READY_KEY] as Promise<void>;
}
