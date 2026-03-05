import { Client } from "pg";

const POLICY: Record<string, string> = {
  China: "USD",
  USA: "USD",
  Korea: "USD",
  Europe: "EUR",
};

function printPolicy() {
  console.log("Currency policy by market:");
  for (const [market, currency] of Object.entries(POLICY)) {
    console.log(`  ${market}: ${currency}`);
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();

    printPolicy();
    console.log("\nCounts by market/currency (active cars):");

    const counts = await client.query<{
      market: string;
      price_currency: string;
      count: string;
    }>(`
      SELECT market, price_currency, COUNT(*)::text AS count
      FROM catalog_cars
      WHERE archived_at IS NULL
      GROUP BY market, price_currency
      ORDER BY market, price_currency
    `);

    if (counts.rows.length === 0) {
      console.log("  no active cars");
    } else {
      for (const row of counts.rows) {
        console.log(`  ${row.market} | ${row.price_currency} | ${row.count}`);
      }
    }

    const invalid = await client.query<{ count: string }>(`
      SELECT COUNT(*)::text AS count
      FROM catalog_cars
      WHERE archived_at IS NULL
        AND NOT (
          (market = 'Europe' AND price_currency = 'EUR')
          OR (market IN ('China', 'USA', 'Korea') AND price_currency = 'USD')
        )
    `);

    const invalidCount = Number(invalid.rows[0]?.count || "0");
    console.log(`\nInvalid active rows: ${invalidCount}`);

    if (invalidCount > 0) {
      const samples = await client.query<{
        id: string;
        slug: string;
        market: string;
        price_value: string;
        price_currency: string;
        updated_at: string;
      }>(`
        SELECT id, slug, market, price_value::text, price_currency, updated_at::text
        FROM catalog_cars
        WHERE archived_at IS NULL
          AND NOT (
            (market = 'Europe' AND price_currency = 'EUR')
            OR (market IN ('China', 'USA', 'Korea') AND price_currency = 'USD')
          )
        ORDER BY updated_at DESC
        LIMIT 50
      `);

      console.log("\nInvalid row samples (max 50):");
      for (const row of samples.rows) {
        console.log(
          `  ${row.id} | ${row.slug} | ${row.market} | ${row.price_value} ${row.price_currency} | ${row.updated_at}`,
        );
      }

      process.exitCode = 2;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Currency integrity audit failed:", error);
  process.exit(1);
});
