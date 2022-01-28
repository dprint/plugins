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

const latestReleaseTagNameCache = new LruCacheWithExpiry<string, string | undefined>({
  size: 1000,
  expiryMs: 5 * 60 * 1_000, // keep entries for 5 minutes
});

export async function getLatestReleaseTagName(username: string, repoName: string) {
  if (!validateName(username) || !validateName(repoName)) {
    return undefined;
  }

  const url = `https://api.github.com/repos/${username}/${repoName}/releases/latest`;
  let result = latestReleaseTagNameCache.get(url);
  if (result == null) {
    const response = await makeGitHubGetRequest(url, "GET");
    if (response.status === 404) {
      await response.text(); // todo: no way to mark this as used for the sanitizers?
      return undefined;
    } else if (!response.ok) {
      const text = await response.text();
      throw new Error(`Invalid response status: ${response.status}\n\n${text}`);
    }
    const data = await response.json();
    result = data.tag_name;
    if (typeof result !== "string") {
      throw new Error("The tag name was not a string.");
    }
    latestReleaseTagNameCache.set(url, result);
  }
  return result;
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
