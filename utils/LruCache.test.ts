import { assertEquals } from "../deps.test.ts";
import { LruCache, LruCacheWithExpiry } from "./LruCache.ts";

Deno.test("LruCache - keeps only most recent", () => {
  const cache = new LruCache<number, number>({ size: 2 });
  cache.set(1, 1);
  cache.set(2, 2);
  assertEquals(cache.get(1), 1);
  assertEquals(cache.get(2), 2);
  cache.set(3, 3);
  assertEquals(cache.get(1), undefined);
  assertEquals(cache.get(3), 3);
  assertEquals(cache.get(2), 2); // most recent
  cache.set(4, 4);
  assertEquals(cache.get(3), undefined);
  assertEquals(cache.get(2), 2);
  assertEquals(cache.get(4), 4);

  // adding the same one over and over shouldn't cause anything
  cache.set(4, 4);
  cache.set(4, 4);
  cache.set(4, 4);
  assertEquals(cache.get(4), 4);
  assertEquals(cache.get(2), 2);
  cache.set(4, 4);
  cache.set(5, 5);
  assertEquals(cache.get(2), undefined);
  assertEquals(cache.get(4), 4);
  assertEquals(cache.get(5), 5);

  // now ensure removing works
  cache.remove(5);
  assertEquals(cache.get(5), undefined);
  cache.set(2, 2);
  assertEquals(cache.get(4), 4);
  assertEquals(cache.get(2), 2);
});

Deno.test("LruCacheWithExpiry - expires values after a time", () => {
  let currentTime = 0;
  const cache = new LruCacheWithExpiry({
    size: 2,
    expiryMs: 100,
    getTime: () => currentTime,
  });

  cache.set(1, 1);
  assertEquals(cache.get(1), 1);
  currentTime = 100;
  assertEquals(cache.get(1), 1);
  currentTime = 101;
  assertEquals(cache.get(1), undefined);
  currentTime = 50; // go back in time and it should be removed
  assertEquals(cache.get(1), undefined);

  currentTime = 0;
  cache.set(1, 1);
  currentTime = 25;
  cache.set(2, 2);
  currentTime = 50;
  cache.set(3, 3);
  assertEquals(cache.get(1), undefined);
  assertEquals(cache.get(3), 3);
  assertEquals(cache.get(2), 2);
  currentTime = 150;
  assertEquals(cache.get(2), undefined);
  assertEquals(cache.get(3), 3);
  currentTime = 151;
  assertEquals(cache.get(3), undefined);
});
