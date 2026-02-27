import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { DEFAULT_CALCULATOR_CONFIG } from '@/lib/calculatorDefaults';
import type {
  CalculatorConfig,
  ParseFileKind,
  PortRuleInput,
  RateRuleInput,
  UploadedDocument,
} from '@/types/calculator';

const DB_PATH = path.join(process.cwd(), 'runtime', 'calculator.db');
const LEGACY_PATH = path.join(process.cwd(), 'data', 'calculator-settings.json');

let dbInstance: Database.Database | null = null;

function ensureDbDir() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

function createDb() {
  ensureDbDir();
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS calculator_config (
      section TEXT PRIMARY KEY,
      value_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS delivery_margins (
      destination_key TEXT PRIMARY KEY,
      margin_value REAL NOT NULL,
      currency TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS uploaded_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      path TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'uploaded',
      parsed_at TEXT,
      error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rate_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auction TEXT NOT NULL,
      platform TEXT NOT NULL,
      min_price REAL NOT NULL,
      max_price REAL NOT NULL,
      route TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      source_file_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS port_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      route_type TEXT NOT NULL,
      cost REAL NOT NULL,
      currency TEXT NOT NULL,
      source_file_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS platforms (
      name TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parse_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER,
      status TEXT NOT NULL,
      summary TEXT,
      error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedConfig(db);
  return db;
}

function seedConfig(db: Database.Database) {
  const row = db.prepare('SELECT section FROM calculator_config WHERE section = ?').get('rates');
  if (row) return;

  const config = loadLegacyConfig();
  const insert = db.prepare('INSERT INTO calculator_config(section, value_json) VALUES(?, ?)');
  const tx = db.transaction(() => {
    for (const [section, value] of Object.entries(config)) {
      insert.run(section, JSON.stringify(value));
    }
  });
  tx();

  const marginInsert = db.prepare(
    'INSERT OR REPLACE INTO delivery_margins(destination_key, margin_value, currency) VALUES(?, ?, ?)',
  );
  marginInsert.run('minsk', config.margins.minsk_byn, 'BYN');
  marginInsert.run('klaipeda', config.margins.klaipeda_byn, 'BYN');
  marginInsert.run('georgia', config.margins.georgia_byn, 'BYN');
}

function loadLegacyConfig(): CalculatorConfig {
  try {
    if (!fs.existsSync(LEGACY_PATH)) {
      return DEFAULT_CALCULATOR_CONFIG;
    }
    const raw = JSON.parse(fs.readFileSync(LEGACY_PATH, 'utf-8'));
    return {
      rates: {
        usd_byn: Number(raw?.rates?.usd_byn) || DEFAULT_CALCULATOR_CONFIG.rates.usd_byn,
        eur_usd: Number(raw?.rates?.eur_usd) || DEFAULT_CALCULATOR_CONFIG.rates.eur_usd,
      },
      fallback: {
        ...DEFAULT_CALCULATOR_CONFIG.fallback,
        auction_fee_usd: Number(raw?.fees?.auction_fee) || DEFAULT_CALCULATOR_CONFIG.fallback.auction_fee_usd,
        customs_fee_byn:
          Number(raw?.fees?.customs_processing) || DEFAULT_CALCULATOR_CONFIG.fallback.customs_fee_byn,
        recycling_0_3_byn:
          Number(raw?.recycling?.under_3_years) || DEFAULT_CALCULATOR_CONFIG.fallback.recycling_0_3_byn,
        recycling_3_5_byn:
          Number(raw?.recycling?.over_3_years) || DEFAULT_CALCULATOR_CONFIG.fallback.recycling_3_5_byn,
        recycling_5_7_byn:
          Number(raw?.recycling?.over_3_years) || DEFAULT_CALCULATOR_CONFIG.fallback.recycling_5_7_byn,
        recycling_7_plus_byn:
          Number(raw?.recycling?.over_3_years) || DEFAULT_CALCULATOR_CONFIG.fallback.recycling_7_plus_byn,
      },
      costs: {
        our_services_byn:
          Number(raw?.fees?.our_commission) || DEFAULT_CALCULATOR_CONFIG.costs.our_services_byn,
        svh_byn: DEFAULT_CALCULATOR_CONFIG.costs.svh_byn,
      },
      margins: {
        minsk_byn:
          Number(raw?.margins?.sea_freight_markup) || DEFAULT_CALCULATOR_CONFIG.margins.minsk_byn,
        klaipeda_byn: DEFAULT_CALCULATOR_CONFIG.margins.klaipeda_byn,
        georgia_byn: DEFAULT_CALCULATOR_CONFIG.margins.georgia_byn,
      },
      policies: {
        ai_model: DEFAULT_CALCULATOR_CONFIG.policies.ai_model,
      },
    };
  } catch {
    return DEFAULT_CALCULATOR_CONFIG;
  }
}

export function getCalculatorDb() {
  if (!dbInstance) {
    dbInstance = createDb();
  }
  return dbInstance;
}

export function readCalculatorConfig(): CalculatorConfig {
  const db = getCalculatorDb();
  const rows = db.prepare('SELECT section, value_json FROM calculator_config').all() as {
    section: keyof CalculatorConfig;
    value_json: string;
  }[];

  const mapped = JSON.parse(JSON.stringify(DEFAULT_CALCULATOR_CONFIG)) as CalculatorConfig;
  for (const row of rows) {
    mapped[row.section] = JSON.parse(row.value_json);
  }

  const margins = db
    .prepare('SELECT destination_key, margin_value FROM delivery_margins')
    .all() as { destination_key: string; margin_value: number }[];

  for (const margin of margins) {
    if (margin.destination_key === 'minsk') mapped.margins.minsk_byn = Number(margin.margin_value) || 0;
    if (margin.destination_key === 'klaipeda') mapped.margins.klaipeda_byn = Number(margin.margin_value) || 0;
    if (margin.destination_key === 'georgia') mapped.margins.georgia_byn = Number(margin.margin_value) || 0;
  }

  return mapped;
}

export function writeCalculatorConfig(nextConfig: CalculatorConfig) {
  const db = getCalculatorDb();
  const insert = db.prepare(
    'INSERT INTO calculator_config(section, value_json) VALUES(?, ?) ON CONFLICT(section) DO UPDATE SET value_json = excluded.value_json',
  );
  const marginInsert = db.prepare(
    'INSERT INTO delivery_margins(destination_key, margin_value, currency) VALUES(?, ?, ?) ON CONFLICT(destination_key) DO UPDATE SET margin_value = excluded.margin_value, currency = excluded.currency',
  );

  const tx = db.transaction(() => {
    insert.run('rates', JSON.stringify(nextConfig.rates));
    insert.run('fallback', JSON.stringify(nextConfig.fallback));
    insert.run('costs', JSON.stringify(nextConfig.costs));
    insert.run('margins', JSON.stringify(nextConfig.margins));
    insert.run('policies', JSON.stringify(nextConfig.policies));

    marginInsert.run('minsk', Number(nextConfig.margins.minsk_byn) || 0, 'BYN');
    marginInsert.run('klaipeda', Number(nextConfig.margins.klaipeda_byn) || 0, 'BYN');
    marginInsert.run('georgia', Number(nextConfig.margins.georgia_byn) || 0, 'BYN');
  });
  tx();
}

export function createUploadedDocument(input: {
  kind: ParseFileKind;
  path: string;
  originalName: string;
  mime: string;
}) {
  const db = getCalculatorDb();
  const stmt = db.prepare(
    'INSERT INTO uploaded_documents(kind, path, original_name, mime, status) VALUES(?, ?, ?, ?, ?)',
  );
  const result = stmt.run(input.kind, input.path, input.originalName, input.mime, 'uploaded');
  return Number(result.lastInsertRowid);
}

export function listUploadedDocuments() {
  const db = getCalculatorDb();
  const rows = db
    .prepare(
      'SELECT id, kind, path, original_name, mime, status, parsed_at, error, created_at FROM uploaded_documents ORDER BY id DESC',
    )
    .all() as any[];

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    path: row.path,
    originalName: row.original_name,
    mime: row.mime,
    status: row.status,
    parsedAt: row.parsed_at,
    error: row.error,
    createdAt: row.created_at,
  })) as UploadedDocument[];
}

export function getUploadedDocumentById(id: number) {
  const db = getCalculatorDb();
  const row = db
    .prepare(
      'SELECT id, kind, path, original_name, mime, status, parsed_at, error, created_at FROM uploaded_documents WHERE id = ?',
    )
    .get(id) as any;
  if (!row) return null;

  return {
    id: row.id,
    kind: row.kind,
    path: row.path,
    originalName: row.original_name,
    mime: row.mime,
    status: row.status,
    parsedAt: row.parsed_at,
    error: row.error,
    createdAt: row.created_at,
  } as UploadedDocument;
}

export function markUploadParsed(id: number) {
  const db = getCalculatorDb();
  db.prepare('UPDATE uploaded_documents SET status = ?, parsed_at = CURRENT_TIMESTAMP, error = NULL WHERE id = ?').run(
    'parsed',
    id,
  );
}

export function markUploadFailed(id: number, error: string) {
  const db = getCalculatorDb();
  db.prepare('UPDATE uploaded_documents SET status = ?, error = ? WHERE id = ?').run('failed', error, id);
}

export function addParseRun(fileId: number, status: 'parsed' | 'failed', summary: string, error: string | null) {
  const db = getCalculatorDb();
  db.prepare('INSERT INTO parse_runs(file_id, status, summary, error) VALUES(?, ?, ?, ?)').run(
    fileId,
    status,
    summary,
    error,
  );
}

export function replaceRateRules(fileId: number, rates: RateRuleInput[]) {
  const db = getCalculatorDb();
  const disable = db.prepare('UPDATE rate_rules SET is_active = 0');
  const insert = db.prepare(
    'INSERT INTO rate_rules(auction, platform, min_price, max_price, route, amount, currency, source_file_id, is_active) VALUES(?, ?, ?, ?, ?, ?, ?, ?, 1)',
  );

  const tx = db.transaction(() => {
    disable.run();
    for (const item of rates) {
      insert.run(
        item.auction || 'Any',
        item.platform || 'Any',
        Number(item.minPrice) || 0,
        Number(item.maxPrice) || 999999,
        item.route || 'delivery_to_usa_port',
        Number(item.amount) || 0,
        item.currency || 'USD',
        fileId,
      );
    }
  });
  tx();
}

export function replacePortRules(fileId: number, ports: PortRuleInput[]) {
  const db = getCalculatorDb();
  const disable = db.prepare('UPDATE port_rules SET is_active = 0');
  const insert = db.prepare(
    'INSERT INTO port_rules(origin, destination, route_type, cost, currency, source_file_id, is_active) VALUES(?, ?, ?, ?, ?, ?, 1)',
  );

  const tx = db.transaction(() => {
    disable.run();
    for (const item of ports) {
      insert.run(
        item.origin || 'usa_port',
        item.destination || 'klaipeda',
        item.routeType || 'sea',
        Number(item.cost) || 0,
        item.currency || 'USD',
        fileId,
      );
    }
  });
  tx();
}

export function replacePlatforms(platforms: string[]) {
  const db = getCalculatorDb();
  const clear = db.prepare('DELETE FROM platforms');
  const insert = db.prepare('INSERT OR IGNORE INTO platforms(name) VALUES(?)');

  const tx = db.transaction(() => {
    clear.run();
    for (const platform of platforms) {
      const normalized = platform.trim();
      if (normalized) insert.run(normalized);
    }
  });
  tx();
}

export function listPlatforms() {
  const db = getCalculatorDb();
  const rows = db.prepare('SELECT name FROM platforms ORDER BY name ASC').all() as { name: string }[];
  return rows.map((item) => item.name);
}

export function findBestRate(input: {
  auction: string;
  platform: string;
  carPrice: number;
  route: string;
}) {
  const db = getCalculatorDb();
  return db
    .prepare(
      `SELECT amount, currency, auction, platform
       FROM rate_rules
       WHERE is_active = 1
         AND route = @route
         AND @carPrice BETWEEN min_price AND max_price
         AND (auction = @auction OR auction = 'Any')
         AND (platform = @platform OR platform = 'Any')
       ORDER BY (auction = @auction) DESC, (platform = @platform) DESC
       LIMIT 1`,
    )
    .get(input) as { amount: number; currency: 'USD' | 'BYN'; auction: string; platform: string } | undefined;
}

export function findBestPortRule(input: { origin: string; destination: string; routeType: string }) {
  const db = getCalculatorDb();
  return db
    .prepare(
      `SELECT cost, currency
       FROM port_rules
       WHERE is_active = 1
         AND origin = @origin
         AND destination = @destination
         AND route_type = @routeType
       LIMIT 1`,
    )
    .get(input) as { cost: number; currency: 'USD' | 'BYN' } | undefined;
}
