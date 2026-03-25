import { env } from "cloudflare:workers";

const GITHUB_PREFIX = "https://github.com/";

function toR2Key(githubUrl: string) {
  if (githubUrl.startsWith(GITHUB_PREFIX)) {
    return githubUrl.slice(GITHUB_PREFIX.length);
  }
  return githubUrl;
}

function isLatestUrl(githubUrl: string) {
  return githubUrl.includes("/releases/latest/");
}

export async function r2Get(githubUrl: string): Promise<ArrayBuffer | null> {
  if (isLatestUrl(githubUrl)) {
    return null;
  }
  try {
    const object = await env.PLUGIN_CACHE.get(toR2Key(githubUrl));
    if (object == null) {
      return null;
    }
    return await object.arrayBuffer();
  } catch (err) {
    console.error("R2 get error:", err);
    return null;
  }
}

export async function r2Put(githubUrl: string, body: ArrayBuffer, contentType: string): Promise<void> {
  if (isLatestUrl(githubUrl)) {
    return;
  }
  try {
    await env.PLUGIN_CACHE.put(toR2Key(githubUrl), body, {
      httpMetadata: { contentType },
    });
  } catch (err) {
    console.error("R2 put error:", err);
  }
}
