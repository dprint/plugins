import { LruCache } from "./LruCache.ts";

const cache = new LruCache<string, ArrayBuffer>({ size: 50 });

export async function fetchCached(url: string) {
  let cachedBody = cache.get(url);
  if (cachedBody == null) {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        kind: "error",
        response,
      } as const;
    }

    const body = await response.arrayBuffer();
    cachedBody = body;
    cache.set(url, cachedBody);
  }
  return {
    kind: "success",
    body: cachedBody,
  } as const;
}
