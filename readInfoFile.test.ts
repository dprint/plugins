import { expect, it } from "vitest";
import { type PluginReleaseInfo, type ResolvedSources, toPluginData } from "./readInfoFile.js";

const info: PluginReleaseInfo = {
  version: "1.0.0",
  url: "https://plugins.dprint.dev/test-1.0.0.wasm",
  repoUrl: "https://github.com/dprint/dprint-plugin-test",
  downloadKey: "dprint/dprint-plugin-test",
  tag: "1.0.0",
};

function createSources(data: Partial<ResolvedSources> = {}): ResolvedSources {
  return {
    downloadCounts: new Map([[info.downloadKey, { allVersions: 100, byTag: new Map([["1.0.0", 40]]) }]]),
    npmDownloadCounts: new Map([["@dprint/test", 900]]),
    npmVersions: new Map([["@dprint/test", "1.2.3"]]),
    ...data,
  };
}

it("should add npm downloads to the total", () => {
  const result = toPluginData({ name: "t", npm: { name: "@dprint/test" } }, info, createSources());
  expect(result.downloadCount.allVersions).toEqual(1000);
  // the current version stays registry only — npm has no per version breakdown
  expect(result.downloadCount.currentVersion).toEqual(40);
});

it("should leave a plugin that isn't on npm counting only the registry", () => {
  const result = toPluginData({ name: "t" }, info, createSources());
  expect(result.downloadCount.allVersions).toEqual(100);
  expect(result.npm).toEqual(undefined);
});

it("should keep the npm properties info.json declared", () => {
  const result = toPluginData(
    { name: "t", npm: { name: "@dprint/test", path: "test/plugin.wasm" } },
    info,
    createSources(),
  );
  expect(result.npm).toEqual({ name: "@dprint/test", version: "1.2.3", path: "test/plugin.wasm" });
});

it("should keep the package when its version couldn't be resolved", () => {
  const result = toPluginData(
    { name: "t", npm: { name: "@dprint/test" } },
    info,
    createSources({ npmVersions: new Map() }),
  );
  // the cli reads the name to know the plugin is on npm, so it has to survive
  expect(result.npm).toEqual({ name: "@dprint/test" });
  // and an absent version is omitted rather than serialized as null
  expect(JSON.stringify(result.npm)).toEqual(`{"name":"@dprint/test"}`);
});

it("should tolerate every lookup coming back empty", () => {
  const result = toPluginData({ name: "t", npm: { name: "@dprint/test" } }, info, {
    downloadCounts: new Map(),
    npmDownloadCounts: new Map(),
    npmVersions: new Map(),
  });
  expect(result.downloadCount).toEqual({ currentVersion: 0, allVersions: 0 });
  expect(result.url).toEqual(info.url);
});
