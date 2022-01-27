import { LruCache } from "./LruCache.ts";
import { createSynchronizedActioner } from "./synchronizedActioner.ts";

const cache = new LruCache<string, boolean>(1000);

export async function checkGithubRepoExists(username: string, repoName: string) {
  if (!validateName(username) || !validateName(repoName)) {
    return false;
  }

  const url = `https://api.github.com/repos/${username}/${repoName}`;
  let result = cache.get(url);
  if (result == null) {
    try {
      const response = await makeGitHubGetRequest(url, "HEAD");
      result = response.status !== 404;
    } catch (err) {
      console.error("Error fetching cache.", err);
      return false;
    }
    cache.set(url, result);
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
