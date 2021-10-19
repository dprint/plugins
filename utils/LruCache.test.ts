import { assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";
import { LruCache } from "./LruCache.ts";

Deno.test("keeps only most recent", () => {
  const cache = new LruCache<number, number>(2);
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
});
