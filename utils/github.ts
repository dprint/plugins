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
}

const latestReleaseTagNameCache = new LruCacheWithExpiry<string, ReleaseInfo | undefined>({
  size: 1000,
  expiryMs: 5 * 60 * 1_000, // keep entries for 5 minutes
});

export async function getLatestReleaseInfo(username: string, repoName: string) {
  if (!validateName(username) || !validateName(repoName)) {
    return undefined;
  }

  const url = `https://api.github.com/repos/${username}/${repoName}/releases/latest`;
  return await latestReleaseTagNameCache.getOrSet(url, async () => {
    const response = await makeGitHubGetRequest(url, "GET");
    if (response.status === 404) {
      await response.text(); // todo: no way to mark this as used for the sanitizers?
      return undefined;
    } else if (!response.ok) {
      const text = await response.text();
      throw new Error(`Invalid response status: ${response.status}\n\n${text}`);
    }
    return getReleaseInfo(await response.json());
  });
}

function getReleaseInfo(data: { tag_name: string; body: string; assets: { name: string }[] }): ReleaseInfo {
  if (typeof data.tag_name !== "string") {
    throw new Error("The tag name was not a string.");
  }
  return {
    tagName: data.tag_name,
    checksum: getChecksum(),
    kind: getPluginKind(),
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
        if (asset.name.endsWith(".exe-plugin")) {
          return "process";
        }
      }
    }

    return "wasm";
  }
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
