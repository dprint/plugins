import { LazyExpirableValue } from "./LazyExpirableValue.ts";
import { LruCache, LruCacheWithExpiry } from "./LruCache.ts";
import { createSynchronizedActioner } from "./synchronizedActioner.ts";

const repoExistsCache = new LruCache<string, boolean>({ size: 1000 });

export async function checkGithubRepoExists(username: string, repoName: string) {
  if (!validateName(username) || !validateName(repoName)) {
    return false;
  }

  const url = `https://api.github.com/repos/${username}/${repoName}`;
  let result = repoExistsCache.get(url);
  if (result == null) {
    try {
      const response = await makeGitHubGetRequest(url, "HEAD");
      if (response.status === 200) {
        result = true;
      } else if (response.status === 404) {
        result = false;
      } else {
        // don't cache this response
        throw new Error(`Invalid response status: ${response.status}`);
      }
    } catch (err) {
      console.error("Error fetching cache.", err);
      return false;
    }
    repoExistsCache.set(url, result);
  }
  return result;
}

export interface ReleaseInfo {
  tagName: string;
  checksum: string | undefined;
  kind: "wasm" | "process";
  downloadCount: number;
}

const latestReleaseTagNameCache = new LruCacheWithExpiry<string, ReleaseInfo | undefined>({
  size: 1000,
  expiryMs: 5 * 60 * 1_000, // keep entries for 5 minutes
});

export async function getLatestReleaseInfo(username: string, repoName: string) {
  const releases = await getReleasesData(username, repoName);
  const latest = releases?.find((release) => !release.draft && !release.prerelease);
  return latest ? getReleaseInfo(latest) : undefined;
}

function getReleaseInfo(data: GitHubRelease): ReleaseInfo {
  if (typeof data.tag_name !== "string") {
    throw new Error("The tag name was not a string.");
  }
  return {
    tagName: data.tag_name,
    checksum: getChecksum(),
    kind: getPluginKind(),
    downloadCount: getDownloadCount(data.assets),
  };

  function getChecksum() {
    if (typeof data.body !== "string") {
      return undefined;
    }
    // search the body text for a dprint style checksum
    const checksum = /\@([a-z0-9]{64})\b/i.exec(data.body);
    return checksum?.[1];
  }

  function getPluginKind(): ReleaseInfo["kind"] {
    if (!(data.assets instanceof Array)) {
      return "wasm";
    }

    for (const asset of data.assets) {
      if (typeof asset === "object" && typeof asset.name === "string") {
        if (asset.name === "plugin.json") {
          return "process";
        }
      }
    }

    return "wasm";
  }
}

function getDownloadCount(assets: ReleaseAsset[]) {
  return assets.find(({ name }) => name === "plugin.wasm" || name === "plugin.json")?.download_count ?? 0;
}

interface ReleaseAsset {
  name: string;
  download_count: number;
}

export async function getAllDownloadCount(username: string, repoName: string) {
  const releases = await getReleasesData(username, repoName);
  return releases?.reduce((total, current) => total + getDownloadCount(current.assets), 0) ?? 0;
}

interface GitHubRelease {
  tag_name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  assets: ReleaseAsset[];
}

const releasesCache = new LruCacheWithExpiry<string, GitHubRelease[]>({
  size: 1000,
  expiryMs: 5 * 60 * 1_000, // keep entries for 5 minutes
});

async function getReleasesData(username: string, repoName: string) {
  if (!validateName(username) || !validateName(repoName)) {
    return;
  }

  const url = `https://api.github.com/repos/${username}/${repoName}/releases`;
  return await releasesCache.getOrSet(url, async () => {
    const response = await makeGitHubGetRequest(url, "GET");
    if (response.status === 404) {
      await response.text(); // todo: no way to mark this as used for the sanitizers?
      return;
    } else if (!response.ok) {
      const text = await response.text();
      throw new Error(`Invalid response status: ${response.status}\n\n${text}`);
    }
    return response.json();
  });
}

const latestCliReleaseInfo = new LazyExpirableValue<any>({
  expiryMs: 10 * 60 * 1_000, // keep for 10 minutes
  createValue: async () => {
    const url = `https://api.github.com/repos/dprint/dprint/releases/latest`;
    const response = await makeGitHubGetRequest(url, "GET");
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Invalid response status: ${response.status}\n\n${text}`);
    }
    return await response.json();
  },
});

export async function getCliInfo() {
  const data = await latestCliReleaseInfo.getValue();
  return {
    version: data.tag_name as string,
  };
}

function validateName(name: string) {
  // usernames may only contain alphanumeric and hypens
  // repos may only contain alphanumeric, underscores, hyphens, and period
  return /^[a-z0-9_\-\.]+$/i.test(name);
}

// This needs to be done to ensure that only one request is made to GitHub at a time
// in order to not violate their API guidelines.
const synchronizedActioner = createSynchronizedActioner();
function makeGitHubGetRequest(url: string, method: "GET" | "HEAD") {
  console.log(`Making request to ${url}`);
  return synchronizedActioner.doActionWithTimeout((signal) => {
    return fetch(url, {
      method,
      headers: getGitHubHeaders(),
      signal,
    });
  }, 10_000);
}

function getGitHubHeaders() {
  const headers: Record<string, string> = {
    "accept": "application/vnd.github.v3+json",
  };
  const token = Deno.env.get("DPRINT_PLUGINS_GH_TOKEN");
  if (token != null) {
    headers["authorization"] = "token " + token;
  }
  return headers;
}
