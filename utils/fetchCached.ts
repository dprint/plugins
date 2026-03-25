import { Clock } from "./clock.js";
import { LruCache, LruCacheSet } from "./LruCache.js";
import { RateLimiter } from "./RateLimiter.js";

const tooLargeResponse = () => ({
  kind: "error" as const,
  response: new Response("Response body exceeds 10MB limit", {
    status: 413,
  }),
} as const);
const tooManyRequestsResponse = () => ({
  kind: "error" as const,
  response: new Response("Too many requests", {
    status: 429,
  }),
} as const);

export function createFetchCacher(clock: Clock, fetchFn?: (url: string) => Promise<Response>) {
  const doFetch = fetchFn ?? ((url: string) => fetch(url));
  const directDownloadRateLimiter = new RateLimiter(clock, {
    limit: 10,
    timeWindowMs: 5 * 60 * 1_000,
  });
  const cachedRateLimiter = new RateLimiter(clock, {
    limit: 20,
    timeWindowMs: 60 * 1_000,
  });
  const cache = new LruCache<string, ArrayBuffer>({ size: 50 });
  const tooLargeCache = new LruCacheSet<string>({ size: 1000 });

  return {
    async fetchCached({ url, hostname }: { url: string; hostname: string }) {
      let cachedBody = cache.get(url);
      if (cachedBody == null) {
        if (!directDownloadRateLimiter.isAllowed(hostname)) {
          return tooManyRequestsResponse();
        }

        const response = await doFetch(url);
        if (!response.ok) {
          return {
            kind: "error",
            response,
          } as const;
        }

        const reader = response.body!.getReader();

        let receivedLength = 0; // received that many bytes at the moment
        const chunks = []; // array of received binary chunks (comprises the body)
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          chunks.push(value);
          receivedLength += value.length;

          // Check if the received length is greater than 10MB
          if (receivedLength > 10 * 1024 * 1024) {
            reader.cancel(); // stops the reading process
            tooLargeCache.insert(url);
            return tooLargeResponse();
          }
        }

        // Concatenate chunks into single Uint8Array
        const chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
          chunksAll.set(chunk, position);
          position += chunk.length;
        }

        cachedBody = chunksAll.buffer;
        cache.set(url, cachedBody);
      } else if (!cachedRateLimiter.isAllowed(hostname)) {
        return tooManyRequestsResponse();
      }
      return {
        kind: "success",
        body: cachedBody,
      } as const;
    },
  };
}
