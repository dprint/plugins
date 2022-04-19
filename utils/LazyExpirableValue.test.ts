import { assertEquals, assertRejects } from "../deps.test.ts";
import { LazyExpirableValue } from "./LazyExpirableValue.ts";

Deno.test("should work", async () => {
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
  assertEquals(await cache.getValue(), 1);
  returnedValue = 2;
  assertEquals(await cache.getValue(), 1);
  currentTime = 200;
  assertEquals(await cache.getValue(), 1);
  currentTime = 201;
  assertEquals(await cache.getValue(), 2);
  currentTime = 302;
  returnedValue = 3;
  assertEquals(await cache.getValue(), 3);
  deferred = () => new Promise((_, reject) => reject(new Error("FAIL")));
  assertEquals(await cache.getValue(), 3);
  currentTime = 403;
  await assertRejects(async () => await cache.getValue());
  await assertRejects(async () => await cache.getValue());

  // now try two at the same time
  let storedResolve: any;
  deferred = () =>
    new Promise(resolve => {
      storedResolve = resolve;
    });
  currentTime = 504;
  let p1 = cache.getValue();
  let p2 = cache.getValue();
  storedResolve(10);
  assertEquals(await p1, 10);
  assertEquals(await p2, 10);
});
