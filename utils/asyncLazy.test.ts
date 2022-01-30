import { assertEquals, assertRejects } from "../deps.test.ts";
import { createAsyncLazy } from "./asyncLazy.ts";

Deno.test("should create", async () => {
  let createdValue = () => Promise.resolve(1);
  const asyncLazy = createAsyncLazy(() => createdValue());
  assertEquals(await asyncLazy.get(), 1);
  createdValue = () => Promise.resolve(2);
  assertEquals(await asyncLazy.get(), 1);
});

Deno.test("should create when throws first time", async () => {
  let createdValue: () => Promise<number> = () => Promise.reject(new Error());
  const asyncLazy = createAsyncLazy(() => createdValue());
  assertRejects(() => asyncLazy.get());
  createdValue = () => Promise.resolve(1);
  assertEquals(await asyncLazy.get(), 1);
});
