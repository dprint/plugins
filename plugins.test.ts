import { assertEquals } from "./deps.test.ts";
import { tryResolveLatestJson } from "./plugins.ts";
import { getLatestReleaseInfo } from "./utils/github.ts";

Deno.test("tryResolveUserLatestJson", async () => {
  // non-matching
  assertEquals(
    await tryResolveLatestJson(
      new URL("https://plugins.dprint.dev/dsherret/latest.json"),
    ),
    undefined,
  );

  assertEquals(
    await tryResolveLatestJson(
      new URL("https://plugins.dprint.dev/dsherret/non-existent/latest.json"),
    ),
    404,
  );

  // dprint repo
  {
    const result = await getValidResultForUrl("https://plugins.dprint.dev/dprint/typescript/latest.json");
    const releaseInfo = await getLatestReleaseInfo("dprint", "dprint-plugin-typescript");
    assertEquals(result, {
      schemaVersion: 1,
      url: `https://plugins.dprint.dev/typescript-${releaseInfo!.tagName}.wasm`,
      version: releaseInfo!.tagName,
      checksum: undefined,
    });
  }
  // dprint repo full name
  {
    const result = await getValidResultForUrl(
      "https://plugins.dprint.dev/dprint/dprint-plugin-typescript/latest.json",
    );
    const releaseInfo = await getLatestReleaseInfo("dprint", "dprint-plugin-typescript");
    assertEquals(result, {
      schemaVersion: 1,
      url: `https://plugins.dprint.dev/typescript-${releaseInfo!.tagName}.wasm`,
      version: releaseInfo!.tagName,
      checksum: undefined,
    });
  }
  // non-dprint repo
  {
    const result = await getValidResultForUrl("https://plugins.dprint.dev/malobre/vue/latest.json");
    const releaseInfo = await getLatestReleaseInfo("malobre", "dprint-plugin-vue");
    assertEquals(result, {
      schemaVersion: 1,
      url: `https://plugins.dprint.dev/malobre/vue-${releaseInfo!.tagName}.wasm`,
      version: releaseInfo!.tagName.replace(/^v/, ""),
      checksum: undefined,
    });
  }
  // non-dprint repo full name
  {
    const result = await getValidResultForUrl("https://plugins.dprint.dev/malobre/dprint-plugin-vue/latest.json");
    const releaseInfo = await getLatestReleaseInfo("malobre", "dprint-plugin-vue");
    assertEquals(result, {
      schemaVersion: 1,
      url: `https://plugins.dprint.dev/malobre/vue-${releaseInfo!.tagName}.wasm`,
      version: releaseInfo!.tagName.replace(/^v/, ""),
      checksum: undefined,
    });
  }
  // process plugin repo
  {
    const result = await getValidResultForUrl("https://plugins.dprint.dev/dprint/prettier/latest.json");
    const releaseInfo = await getLatestReleaseInfo("dprint", "dprint-plugin-prettier");
    assertEquals(releaseInfo?.checksum?.length, 64);
    assertEquals(result, {
      schemaVersion: 1,
      url: `https://plugins.dprint.dev/prettier-${releaseInfo!.tagName}.json`,
      version: releaseInfo!.tagName,
      checksum: releaseInfo!.checksum,
    });
  }

  async function getValidResultForUrl(url: string) {
    const result = await tryResolveLatestJson(new URL(url))!;
    if (result == null || result === 404) {
      throw new Error("Expected result.");
    }
    return result;
  }
});
