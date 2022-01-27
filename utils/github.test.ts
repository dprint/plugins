import { assertEquals } from "../deps.test.ts";
import { checkGithubRepoExists } from "./github.ts";

Deno.test("should get when exists", async () => {
  const getResult = () => checkGithubRepoExists("dprint", "dprint");
  assertEquals(await getResult(), true);
  assertEquals(await getResult(), true);
});

Deno.test("should get when not exists", async () => {
  const getResult = () => checkGithubRepoExists("dsherret", "some-random-name");
  assertEquals(await getResult(), false);
  assertEquals(await getResult(), false);
});
