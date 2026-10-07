import { MongoClient } from "mongodb";

const globalForDataHub = globalThis;

function clientKey(uri) {
  return `__priceEngineDataHub_${Buffer.from(uri).toString("base64url").slice(0, 24)}`;
}

function getDataHubClient() {
  const uri = process.env.DATA_HUB_MONGODB_URI?.trim();
  if (!uri) return null;
  const key = clientKey(uri);
  if (!globalForDataHub[key]) {
    globalForDataHub[key] = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8_000,
      connectTimeoutMS: 8_000,
      socketTimeoutMS: 20_000,
      maxPoolSize: 4,
    });
  }
  return globalForDataHub[key];
}

/** Match log stock_id ↔ Data Hub registration (spaces / case ignored). */
function normalizeRegistration(value) {
  if (value == null) return "";
  return String(value).replace(/\s+/g, "").toUpperCase();
}

/**
 * Attach Data Hub stock detailsUrl onto process-log rows by registration.
 * Lookup failure leaves detailsUrl null and does not fail the caller.
 */
export async function attachStockDetailsUrls(records) {
  if (!Array.isArray(records) || !records.length) return records;

  const withNull = () =>
    records.map((row) => ({ ...row, detailsUrl: row.detailsUrl || null }));

  const client = getDataHubClient();
  if (!client) return withNull();

  const needed = new Set(
    records.map((row) => normalizeRegistration(row.stock_id)).filter(Boolean),
  );
  if (!needed.size) return withNull();

  const rawRegs = [
    ...new Set(
      records.map((row) => String(row.stock_id || "").trim()).filter(Boolean),
    ),
  ];
  const queryRegs = new Set(rawRegs);
  for (const key of needed) {
    queryRegs.add(key);
    if (key.length === 7) {
      queryRegs.add(`${key.slice(0, 4)} ${key.slice(4)}`);
    }
  }

  try {
    await client.connect();
    const db = client.db(process.env.DATA_HUB_MONGODB_DB || "test");
    const stocks = db.collection(
      process.env.DATA_HUB_STOCKS_COLLECTION || "stocks",
    );
    const matches = await stocks
      .find(
        {
          registration: { $in: [...queryRegs] },
          detailsUrl: { $type: "string", $ne: "" },
        },
        {
          projection: { registration: 1, detailsUrl: 1, stockDate: 1 },
          maxTimeMS: 6_000,
        },
      )
      .sort({ stockDate: -1 })
      .limit(5_000)
      .toArray();

    const urlByReg = new Map();
    for (const stock of matches) {
      const key = normalizeRegistration(stock.registration);
      if (!key || !needed.has(key) || urlByReg.has(key)) continue;
      const url = String(stock.detailsUrl || "").trim();
      if (url) urlByReg.set(key, url);
    }

    return records.map((row) => ({
      ...row,
      detailsUrl: urlByReg.get(normalizeRegistration(row.stock_id)) || null,
    }));
  } catch (error) {
    console.warn("Stock URL lookup skipped:", error.message);
    return withNull();
  }
}
