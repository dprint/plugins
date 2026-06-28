import { env } from "cloudflare:workers";
import { fetchWithRetries } from "./fetchWithRetries.js";
import { LazyExpirableValue } from "./LazyExpirableValue.js";

// download counts come from the Analytics Engine dataset that each plugin
// download writes a data point to (see trackPluginDownload in handleRequest.ts).
// the dataset only retains roughly the last 90 days, so these are downloads over
// the trailing 30 days ("monthly") rather than all-time totals.

export interface PluginDownloadCounts {
  // downloads over the last 30 days across every version
  allVersions: number;
  // downloads over the last 30 days keyed by the tag that appeared in the request
  // url (a version like "0.1.0" or the "latest" alias)
  byTag: Map<string, number>;
}

const DATASET = "dprint-plugin-downloads";
const WINDOW_DAYS = 30;

const downloadCounts = new LazyExpirableValue<Map<string, PluginDownloadCounts>>({
  expiryMs: 5 * 60 * 1_000, // keep for 5 minutes
  createValue: queryDownloadCounts,
});

/** Gets the download counts per plugin keyed by `username/repo`. */
export async function getDownloadCounts(): Promise<Map<string, PluginDownloadCounts>> {
  try {
    return await downloadCounts.getValue();
  } catch (err) {
    // don't let analytics being unavailable break the info file build
    console.error("Failed to get download counts from analytics.", err);
    return new Map();
  }
}

async function queryDownloadCounts(): Promise<Map<string, PluginDownloadCounts>> {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const token = env.DPRINT_PLUGINS_ANALYTICS_TOKEN;
  const result = new Map<string, PluginDownloadCounts>();
  if (accountId == null || token == null) {
    console.warn("Analytics credentials not configured. Skipping download counts.");
    return result;
  }

  // index1 is `username/repo`, blob1 is the tag, double1 is 1 per download
  const query = `SELECT index1 AS plugin, blob1 AS tag, sum(_sample_interval * double1) AS downloads`
    + ` FROM "${DATASET}"`
    + ` WHERE timestamp > NOW() - INTERVAL '${WINDOW_DAYS}' DAY`
    + ` GROUP BY plugin, tag LIMIT 10000`;
  const response = await fetchWithRetries(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
    {
      method: "POST",
      headers: {
        "authorization": `Bearer ${token}`,
        "content-type": "text/plain",
      },
      body: query,
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Analytics query failed: ${response.status}\n\n${text}`);
  }

  const body = await response.json() as {
    data: { plugin: string; tag: string; downloads: number | string }[];
  };
  for (const row of body.data) {
    const downloads = Number(row.downloads) || 0;
    const counts = getOrCreateCounts(result, row.plugin);
    counts.allVersions += downloads;
    counts.byTag.set(row.tag, (counts.byTag.get(row.tag) ?? 0) + downloads);
  }
  return result;
}

function getOrCreateCounts(map: Map<string, PluginDownloadCounts>, plugin: string) {
  let counts = map.get(plugin);
  if (counts == null) {
    counts = { allVersions: 0, byTag: new Map() };
    map.set(plugin, counts);
  }
  return counts;
}
