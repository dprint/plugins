import { expect, it } from "vitest";
import { checkGithubRepoExists } from "./github.js";

it("should get when exists", async () => {
  const getResult = () => checkGithubRepoExists("dprint", "dprint");
  expect(await getResult()).toEqual(true);
  expect(await getResult()).toEqual(true);
});

it("should get when not exists", async () => {
  const getResult = () => checkGithubRepoExists("dsherret", "some-random-name");
  expect(await getResult()).toEqual(false);
  expect(await getResult()).toEqual(false);
});
