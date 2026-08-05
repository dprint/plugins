import { expect, it } from "vitest";
import { getNpmDownloadCounts, getNpmLatestVersions } from "./npm.js";

const packageNames = [
  "@dprint/typescript", // scoped
  "dprint-plugin-malva", // unscoped
  "@dprint/this-package-does-not-exist",
  "not a package name",
];

it("should get download counts", async () => {
  const counts = await getNpmDownloadCounts(packageNames);
  expect(counts.get("@dprint/typescript")).toBeGreaterThan(0);
  expect(counts.get("dprint-plugin-malva")).toBeGreaterThan(0);
  // a package npm can't resolve has no count rather than a count of zero
  expect(counts.has("@dprint/this-package-does-not-exist")).toEqual(false);
  expect(counts.has("not a package name")).toEqual(false);
});

it("should get latest versions", async () => {
  const versions = await getNpmLatestVersions(packageNames);
  expect(versions.get("@dprint/typescript")).toMatch(/^\d+\.\d+\.\d+/);
  expect(versions.get("dprint-plugin-malva")).toMatch(/^\d+\.\d+\.\d+/);
  expect(versions.has("@dprint/this-package-does-not-exist")).toEqual(false);
  expect(versions.has("not a package name")).toEqual(false);
});
