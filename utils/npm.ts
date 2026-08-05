import { fetchWithRetries } from "./fetchWithRetries.js";
import { LruCacheWithExpiry } from "./LruCache.js";
import { withTimeout } from "./withTimeout.js";

const REGISTRY_URL = "https://registry.npmjs.org";
// npm reports downloads for a package as a whole rather than per version, so
// these are counts across every version. "last-month" is the trailing 30 days,
// matching the window of the plugin download counts these are added to.
const DOWNLOADS_URL = "https://api.npmjs.org/downloads/point/last-month";

const versionsCache = new LruCacheWithExpiry<string, string>({
  size: 1000,
  expiryMs: 5 * 60 * 1_000, // keep for 5 minutes so new releases show up quickly
});
const downloadsCache = new LruCacheWithExpiry<string, number>({
  size: 1000,
  expiryMs: 60 * 60 * 1_000, // keep for an hour — npm only recomputes these daily
});

/** Gets the version each package's `latest` tag points at, keyed by package name. */
export async function getNpmLatestVersions(packageNames: string[]): Promise<Map<string, string>> {
  return await getForEachPackage(packageNames, (packageName) =>
    versionsCache.getOrSet(packageName, async () => {
      const body = await fetchJson(`${REGISTRY_URL}/${packageName}/latest`) as { version?: unknown };
      if (typeof body.version !== "string") {
        throw new Error("The version was not a string.");
      }
      return body.version;
    }));
}

/** Gets the last 30 days of npm downloads for each package, keyed by package name. */
export async function getNpmDownloadCounts(packageNames: string[]): Promise<Map<string, number>> {
  return await getForEachPackage(packageNames, (packageName) =>
    downloadsCache.getOrSet(packageName, async () => {
      const body = await fetchJson(`${DOWNLOADS_URL}/${packageName}`) as { downloads?: unknown };
      // npm answers 200 with an error object for a package it has no stats for,
      // so anything but a number means there's no count rather than none yet
      if (typeof body.downloads !== "number") {
        throw new Error("The download count was not a number.");
      }
      return body.downloads;
    }));
}

// resolves each package on its own so that one failing, or npm being down
// entirely, doesn't take down the info file build these feed into. a package
// that couldn't be resolved is left out of the map rather than given a made up
// value.
async function getForEachPackage<T>(packageNames: string[], getValue: (packageName: string) => Promise<T>) {
  const values = await Promise.all(packageNames.map(async (packageName) => {
    if (!validatePackageName(packageName)) {
      console.error(`Invalid npm package name: ${packageName}`);
      return undefined;
    }
    try {
      return await getValue(packageName);
    } catch (err) {
      console.error(`Failed to get npm data for ${packageName}.`, err);
      return undefined;
    }
  }));
  const result = new Map<string, T>();
  for (const [i, value] of values.entries()) {
    if (value != null) {
      result.set(packageNames[i]!, value);
    }
  }
  return result;
}

// bounded so that npm hanging can't stall a request that had to rebuild the
// info file synchronously
const FETCH_TIMEOUT_MS = 10_000;

async function fetchJson(url: string) {
  const response = await withTimeout(
    (signal) =>
      fetchWithRetries(url, {
        headers: { "user-agent": "dprint-plugins" },
        signal,
      }),
    FETCH_TIMEOUT_MS,
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Invalid response status: ${response.status}\n\n${text}`);
  }
  return await response.json();
}

function validatePackageName(packageName: string) {
  // an unscoped name, or a scope and name separated by the only allowed slash.
  // this is what keeps the name from walking out of the registry url, so a
  // segment that's only dots is rejected rather than treated as a name.
  if (!/^(@[a-z0-9\-\._]+\/)?[a-z0-9\-\._]+$/i.test(packageName)) {
    return false;
  }
  return packageName.split("/").every((segment) => /[^.]/.test(segment));
}
