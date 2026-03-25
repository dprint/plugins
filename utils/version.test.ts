import { expect, it } from "vitest";
import { parseVersion, Version } from "./version.js";

it("should parse version", () => {
  expect(parseVersion("12.34.56")).toEqual(new Version(12, 34, 56));
});

function runVersionLessThanTest(a: string, b: string, expected: boolean) {
  expect(parseVersion(a).lessThan(parseVersion(b))).toEqual(expected);
}

it("less than tests", () => {
  runVersionLessThanTest("1.3.5", "1.3.5", false);

  runVersionLessThanTest("1.3.4", "1.3.5", true);
  runVersionLessThanTest("1.2.5", "1.3.5", true);
  runVersionLessThanTest("0.3.5", "1.3.5", true);

  runVersionLessThanTest("1.3.6", "1.3.5", false);
  runVersionLessThanTest("1.4.5", "1.3.5", false);
  runVersionLessThanTest("2.3.5", "1.3.5", false);
});

function runEqualTest(a: string, b: string, expected: boolean) {
  expect(parseVersion(a).equal(parseVersion(b))).toEqual(expected);
}

it("equal tests", () => {
  runEqualTest("1.3.5", "1.3.5", true);

  runEqualTest("1.3.6", "1.3.5", false);
  runEqualTest("1.2.5", "1.3.5", false);
  runEqualTest("0.3.5", "1.3.5", false);
});

function runLessThanEqual(a: string, b: string, expected: boolean) {
  expect(parseVersion(a).lessThanEqual(parseVersion(b))).toEqual(expected);
}

it("less than equal tests", () => {
  runLessThanEqual("1.3.4", "1.3.5", true);
  runLessThanEqual("1.3.5", "1.3.5", true);
  runLessThanEqual("1.3.6", "1.3.5", false);
});
