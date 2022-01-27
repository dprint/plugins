import { LruCache } from "./LruCache.ts";

const cache = new LruCache<string, boolean>(1000);

export async function checkGithubRepoExists(username: string, repoName: string) {
  if (!validateName(username) || !validateName(repoName)) {
    return false;
  }

  const url = `https://api.github.com/repos/${username}/${repoName}`;
  let result = cache.get(url);
  if (result == null) {
    try {
      const response = await fetch(url);
      const body = await response.json();
      result = body.message !== "Not Found";
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
