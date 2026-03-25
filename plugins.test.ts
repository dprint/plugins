import { expect, it } from "vitest";
import { tryResolveAssetUrl, tryResolveLatestJson } from "./plugins.js";
import { getLatestReleaseInfo } from "./utils/github.js";

function resolveAsset(url: string) {
  return tryResolveAssetUrl(new URL(url));
}

it("tryResolveAssetUrl", () => {
  // allowed repo
  expect(
    resolveAsset(
      "https://plugins.dprint.dev/dprint/dprint-plugin-prettier/0.67.0/asset/dprint-plugin-prettier-x86_64-apple-darwin.zip",
    ),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-prettier/releases/download/0.67.0/dprint-plugin-prettier-x86_64-apple-darwin.zip",
  );

  // latest tag is not allowed
  expect(
    resolveAsset(
      "https://plugins.dprint.dev/dprint/dprint-plugin-prettier/latest/asset/dprint-plugin-prettier-x86_64-apple-darwin.zip",
    ),
  ).toEqual(undefined);

  // different repo in dprint org also works
  expect(
    resolveAsset("https://plugins.dprint.dev/dprint/dprint-plugin-exec/0.5.0/asset/some-binary.zip"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-exec/releases/download/0.5.0/some-binary.zip",
  );

  // org not on allow list
  expect(
    resolveAsset("https://plugins.dprint.dev/someone/some-repo/0.1.0/asset/file.zip"),
  ).toEqual(undefined);

  // non-matching URL
  expect(
    resolveAsset("https://plugins.dprint.dev/dprint/dprint-plugin-prettier/0.67.0/file.zip"),
  ).toEqual(undefined);
});

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
