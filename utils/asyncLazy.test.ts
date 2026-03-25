import { expect, it } from "vitest";
import { createAsyncLazy } from "./asyncLazy.js";

it("should create", async () => {
  let createdValue = () => Promise.resolve(1);
  const asyncLazy = createAsyncLazy(() => createdValue());
  expect(await asyncLazy.get()).toEqual(1);
  createdValue = () => Promise.resolve(2);
  expect(await asyncLazy.get()).toEqual(1);
});

it("should create when throws first time", async () => {
  let createdValue: () => Promise<number> = () => Promise.reject(new Error());
  const asyncLazy = createAsyncLazy(() => createdValue());
  await expect(asyncLazy.get()).rejects.toThrow();
  createdValue = () => Promise.resolve(1);
  expect(await asyncLazy.get()).toEqual(1);
});
