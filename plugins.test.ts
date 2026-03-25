import { expect, it } from "vitest";
import { tryResolveLatestJson } from "./plugins.js";
import { getLatestReleaseInfo } from "./utils/github.js";

it("tryResolveUserLatestJson", async () => {
  // non-matching
  expect(
    await tryResolveLatestJson(
      new URL("https://plugins.dprint.dev/dsherret/latest.json"),
    ),
  ).toEqual(undefined);

  expect(
    await tryResolveLatestJson(
      new URL("https://plugins.dprint.dev/dsherret/non-existent/latest.json"),
    ),
  ).toEqual(404);

  // dprint repo
  {
    const result = await getValidResultForUrl("https://plugins.dprint.dev/dprint/typescript/latest.json");
    const releaseInfo = await getLatestReleaseInfo("dprint", "dprint-plugin-typescript");
    expect(releaseInfo?.checksum?.length).toEqual(64);
    expect(result).toEqual({
      schemaVersion: 1,
      url: `https://plugins.dprint.dev/typescript-${releaseInfo!.tagName}.wasm`,
      version: releaseInfo!.tagName,
      checksum: releaseInfo!.checksum,
    });
  }
  // dprint repo full name
  {
    const result = await getValidResultForUrl(
      "https://plugins.dprint.dev/dprint/dprint-plugin-typescript/latest.json",
    );
    const releaseInfo = await getLatestReleaseInfo("dprint", "dprint-plugin-typescript");
    expect(releaseInfo?.checksum?.length).toEqual(64);
    expect(result).toEqual({
      schemaVersion: 1,
      url: `https://plugins.dprint.dev/typescript-${releaseInfo!.tagName}.wasm`,
      version: releaseInfo!.tagName,
      checksum: releaseInfo!.checksum,
    });
  }
  // non-dprint repo
  {
    const result = await getValidResultForUrl("https://plugins.dprint.dev/malobre/vue/latest.json");
    const releaseInfo = await getLatestReleaseInfo("malobre", "dprint-plugin-vue");
    expect(result).toEqual({
      schemaVersion: 1,
      url: `https://plugins.dprint.dev/malobre/vue-${releaseInfo!.tagName}.wasm`,
      version: releaseInfo!.tagName.replace(/^v/, ""),
      checksum: releaseInfo!.checksum,
    });
  }
  // non-dprint repo full name
  {
    const result = await getValidResultForUrl("https://plugins.dprint.dev/malobre/dprint-plugin-vue/latest.json");
    const releaseInfo = await getLatestReleaseInfo("malobre", "dprint-plugin-vue");
    expect(result).toEqual({
      schemaVersion: 1,
      url: `https://plugins.dprint.dev/malobre/vue-${releaseInfo!.tagName}.wasm`,
      version: releaseInfo!.tagName.replace(/^v/, ""),
      checksum: releaseInfo!.checksum,
    });
  }
  // process plugin repo
  {
    const result = await getValidResultForUrl("https://plugins.dprint.dev/dprint/prettier/latest.json");
    const releaseInfo = await getLatestReleaseInfo("dprint", "dprint-plugin-prettier");
    expect(releaseInfo?.checksum?.length).toEqual(64);
    expect(result).toEqual({
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
