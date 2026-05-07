import { dbQuery, isDatabaseConfigured } from "@/lib/db";

const GLOBAL_READY_KEY = "__etrade_db_ready__";

declare global {
  // eslint-disable-next-line no-var
  var __etrade_db_ready__: Promise<void> | undefined;
}

export async function ensureDatabaseReady(): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (!globalThis[GLOBAL_READY_KEY]) {
    globalThis[GLOBAL_READY_KEY] = (async () => {
      await dbQuery("SELECT 1");
    })();
  }

  try {
    await (globalThis[GLOBAL_READY_KEY] as Promise<void>);
  } catch (error) {
    globalThis[GLOBAL_READY_KEY] = undefined;
    throw error;
  }
}
