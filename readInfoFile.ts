import { env } from "cloudflare:workers";
import infoJson from "./info.json" with { type: "json" };
import { getLatestInfo } from "./plugins.js";
import { getAllDownloadCount } from "./utils/github.js";

// only typing what's used on the server
export interface PluginsData {
  latest: PluginData[];
}

export interface PluginData {
  name: string;
  url: string;
  version: string;
  downloadCount: {
    currentVersion: number;
    allVersions: number;
  };
}

interface CacheEntry {
  data: Readonly<PluginsData>;
  builtAt: number;
}

// Assembling the info file makes a sequential GitHub API request per plugin, so
// it's cached in memory and persisted to R2 (shared across isolates). Entries are
// keyed by origin because the resolved plugin urls embed the request's origin.
const REFRESH_AFTER_MS = 5 * 60 * 1_000; // past this, serve the cached copy but refresh in the background
const MAX_STALE_MS = 6 * 60 * 60 * 1_000; // past this, block and rebuild rather than serve stale data

const memoryCache = new Map<string, CacheEntry>();
const inFlightBuilds = new Map<string, Promise<CacheEntry>>();

export async function readInfoFile(origin: string, ctx?: ExecutionContext): Promise<Readonly<PluginsData>> {
  const now = Date.now();

  const memEntry = memoryCache.get(origin);
  if (memEntry != null && now - memEntry.builtAt < REFRESH_AFTER_MS) {
    return memEntry.data; // fresh in memory
  }

  // memory is missing or stale — fall back to the freshest of memory and R2
  const entry = freshest(memEntry, await getFromR2(origin));
  if (entry != null) {
    memoryCache.set(origin, entry);
    const age = now - entry.builtAt;
    if (age < REFRESH_AFTER_MS) {
      return entry.data; // R2 had a fresh copy
    }
    if (age < MAX_STALE_MS) {
      refreshInBackground(origin, ctx);
      return entry.data; // serve stale while it refreshes
    }
    // older than the max — fall through and rebuild synchronously
  }

  return (await build(origin)).data;
}

function freshest(a: CacheEntry | undefined, b: CacheEntry | undefined) {
  if (a == null) return b;
  if (b == null) return a;
  return a.builtAt >= b.builtAt ? a : b;
}

function refreshInBackground(origin: string, ctx?: ExecutionContext) {
  if (inFlightBuilds.has(origin)) {
    return; // a rebuild is already running
  }
  const promise = build(origin).catch((err) => {
    console.error("Failed to refresh info.json cache.", err);
  });
  ctx?.waitUntil(promise);
}

// dedupes concurrent rebuilds for the same origin so the work happens once
function build(origin: string): Promise<CacheEntry> {
  let promise = inFlightBuilds.get(origin);
  if (promise == null) {
    promise = buildAndStore(origin).finally(() => inFlightBuilds.delete(origin));
    inFlightBuilds.set(origin, promise);
  }
  return promise;
}

async function buildAndStore(origin: string): Promise<CacheEntry> {
  const entry: CacheEntry = { data: await buildInfoFile(origin), builtAt: Date.now() };
  memoryCache.set(origin, entry);
  await putToR2(origin, entry.data);
  return entry;
}

function r2Key(origin: string) {
  return `info-cache/${encodeURIComponent(origin)}.json`;
}

async function getFromR2(origin: string): Promise<CacheEntry | undefined> {
  try {
    const object = await env.PLUGIN_CACHE.get(r2Key(origin));
    if (object == null) {
      return undefined;
    }
    return { data: await object.json(), builtAt: object.uploaded.getTime() };
  } catch (err) {
    console.error("Failed to read info.json cache from R2.", err);
    return undefined;
  }
}

async function putToR2(origin: string, data: Readonly<PluginsData>) {
  try {
    await env.PLUGIN_CACHE.put(r2Key(origin), JSON.stringify(data), {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
    });
  } catch (err) {
    console.error("Failed to write info.json cache to R2.", err);
  }
}

async function buildInfoFile(origin: string): Promise<Readonly<PluginsData>> {
  return {
    ...infoJson,
    latest: await getLatest(infoJson.latest),
  };

  async function getLatest(latest: typeof infoJson.latest) {
    const results = [];
    for (const plugin of latest) {
      const [username, pluginName] = plugin.name.split("/");
      const info = pluginName
        ? await getLatestInfo(username, pluginName, origin)
        : await getLatestInfo("dprint", plugin.name, origin);
      if (info != null) {
        results.push({
          ...plugin,
          version: info.version,
          url: info.url,
          downloadCount: {
            currentVersion: info.downloadCount,
            allVersions: pluginName
              ? await getAllDownloadCount(username, pluginName)
              : await getAllDownloadCount("dprint", plugin.name),
          },
        });
      }
    }
    return results;
  }
}
