import { expect, it } from "vitest";
import { LazyExpirableValue } from "./LazyExpirableValue.js";

it("should work", async () => {
  let currentTime = 100;
  let returnedValue = 1;
  let deferred = () =>
    new Promise((resolve, _) => {
      resolve(returnedValue);
    });
  const cache = new LazyExpirableValue({
    expiryMs: 100,
    createValue: async () => {
      return await deferred();
    },
    getTime: () => currentTime,
  });
  expect(await cache.getValue()).toEqual(1);
  returnedValue = 2;
  expect(await cache.getValue()).toEqual(1);
  currentTime = 200;
  expect(await cache.getValue()).toEqual(1);
  currentTime = 201;
  expect(await cache.getValue()).toEqual(2);
  currentTime = 302;
  returnedValue = 3;
  expect(await cache.getValue()).toEqual(3);
  deferred = () => new Promise((_, reject) => reject(new Error("FAIL")));
  expect(await cache.getValue()).toEqual(3);
  currentTime = 403;
  await expect(cache.getValue()).rejects.toThrow();
  await expect(cache.getValue()).rejects.toThrow();

  // now try two at the same time
  let storedResolve: any;
  deferred = () =>
    new Promise(resolve => {
      storedResolve = resolve;
    });
  currentTime = 504;
  const p1 = cache.getValue();
  const p2 = cache.getValue();
  storedResolve(10);
  expect(await p1).toEqual(10);
  expect(await p2).toEqual(10);
});
