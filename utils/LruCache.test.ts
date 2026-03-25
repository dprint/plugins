import { expect, it } from "vitest";
import { LruCache, LruCacheWithExpiry } from "./LruCache.js";

it("LruCache - keeps only most recent", () => {
  const cache = new LruCache<number, number>({ size: 2 });
  cache.set(1, 1);
  cache.set(2, 2);
  expect(cache.get(1)).toEqual(1);
  expect(cache.get(2)).toEqual(2);
  cache.set(3, 3);
  expect(cache.get(1)).toEqual(undefined);
  expect(cache.get(3)).toEqual(3);
  expect(cache.get(2)).toEqual(2); // most recent
  cache.set(4, 4);
  expect(cache.get(3)).toEqual(undefined);
  expect(cache.get(2)).toEqual(2);
  expect(cache.get(4)).toEqual(4);

  // adding the same one over and over shouldn't cause anything
  cache.set(4, 4);
  cache.set(4, 4);
  cache.set(4, 4);
  expect(cache.get(4)).toEqual(4);
  expect(cache.get(2)).toEqual(2);
  cache.set(4, 4);
  cache.set(5, 5);
  expect(cache.get(2)).toEqual(undefined);
  expect(cache.get(4)).toEqual(4);
  expect(cache.get(5)).toEqual(5);

  // now ensure removing works
  cache.remove(5);
  expect(cache.get(5)).toEqual(undefined);
  cache.set(2, 2);
  expect(cache.get(4)).toEqual(4);
  expect(cache.get(2)).toEqual(2);
});

it("LruCacheWithExpiry - expires values after a time", async () => {
  let currentTime = 0;
  const cache = new LruCacheWithExpiry({
    size: 2,
    expiryMs: 100,
    getTime: () => currentTime,
  });

  expect(await cache.getOrSet(1, () => Promise.resolve(1))).toEqual(1);
  expect(await cache.getOrSet(1, () => Promise.resolve(2))).toEqual(1);
  currentTime = 100;
  expect(await cache.getOrSet(1, () => Promise.resolve(2))).toEqual(1);
  currentTime = 101;
  expect(await cache.getOrSet(1, () => Promise.resolve(2))).toEqual(2);

  currentTime = 1000;
  expect(await cache.getOrSet(1, () => Promise.resolve(1))).toEqual(1);
  currentTime = 1025;
  expect(await cache.getOrSet(2, () => Promise.resolve(2))).toEqual(2);
  currentTime = 1050;
  expect(await cache.getOrSet(3, () => Promise.resolve(3))).toEqual(3);
  expect(await cache.getOrSet(1, () => Promise.resolve(11))).toEqual(11);
  expect(await cache.getOrSet(3, () => Promise.resolve(13))).toEqual(3);
  expect(await cache.getOrSet(2, () => Promise.resolve(12))).toEqual(12);
  currentTime = 1150;
  expect(await cache.getOrSet(3, () => Promise.resolve(13))).toEqual(3);
  currentTime = 1151;
  expect(await cache.getOrSet(3, () => Promise.reject(new Error()))).toEqual(3);
  expect(await cache.getOrSet(3, () => Promise.resolve(13))).toEqual(13);
});
