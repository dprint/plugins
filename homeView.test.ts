import { expect, it } from "vitest";
import { renderHomeHtml } from "./homeView.js";
import type { PluginData } from "./readInfoFile.js";

function createPlugin(data: Partial<PluginData>): PluginData {
  return {
    name: "dprint-plugin-test",
    url: "https://plugins.dprint.dev/test-1.0.0.wasm",
    version: "1.0.0",
    downloadCount: { currentVersion: 1, allVersions: 2 },
    ...data,
  };
}

// what the url column shows and the copy button copies. asserted on the
// rendered markup rather than the helper so that the two staying in sync is
// part of what's covered.
function renderReferences(plugins: PluginData[]) {
  const html = renderHomeHtml({ latest: plugins });
  return {
    shown: [...html.matchAll(/<code>([^<]*)<\/code>/g)].map((m) => m[1]),
    copied: [...html.matchAll(/data-url="([^"]*)"/g)].map((m) => m[1]),
    html,
  };
}

it("should show the npm specifier as the latest reference", () => {
  const { shown, copied } = renderReferences([
    // wasm plugin on npm — the default path is left off
    createPlugin({
      url: "https://plugins.dprint.dev/json-1.0.0.wasm",
      npm: { name: "@dprint/json", version: "1.2.3" },
    }),
    // process plugin on npm — its manifest has to be named
    createPlugin({
      url: "https://plugins.dprint.dev/exec-1.0.0.json",
      npm: { name: "@dprint/exec", version: "0.7.3" },
    }),
    // a package that doesn't ship the plugin at its root names the path
    createPlugin({
      url: "https://plugins.dprint.dev/multi-1.0.0.wasm",
      npm: { name: "@dprint/multi", version: "2.0.0", path: "json/plugin.wasm" },
    }),
    // an uppercase extension is still a wasm plugin
    createPlugin({
      url: "https://plugins.dprint.dev/shouty-1.0.0.WASM",
      npm: { name: "@dprint/shouty", version: "3.0.0" },
    }),
  ]);

  const expected = [
    "npm:@dprint/json@1.2.3",
    "npm:@dprint/exec@0.7.3/plugin.json",
    "npm:@dprint/multi@2.0.0/json/plugin.wasm",
    "npm:@dprint/shouty@3.0.0",
  ];
  // the trailing entries are the "helpful commands" section
  expect(shown.slice(0, expected.length)).toEqual(expected);
  expect(copied).toEqual(expected);
});

it("should fall back to the url when there's no npm version", () => {
  const { shown, copied, html } = renderReferences([
    // on npm, but the registry lookup failed, so there's no version to name
    createPlugin({
      url: "https://plugins.dprint.dev/no-version-1.0.0.wasm",
      npm: { name: "@dprint/no-version" },
    }),
    // not published to npm at all
    createPlugin({ url: "https://plugins.dprint.dev/plain-1.0.0.wasm" }),
  ]);

  const expected = [
    "https://plugins.dprint.dev/no-version-1.0.0.wasm",
    "https://plugins.dprint.dev/plain-1.0.0.wasm",
  ];
  expect(shown.slice(0, expected.length)).toEqual(expected);
  expect(copied).toEqual(expected);
  expect(html).not.toContain("npm:");
});

it("should keep the url searchable when a specifier replaced it", () => {
  const { html } = renderReferences([
    createPlugin({
      url: "https://plugins.dprint.dev/json-1.0.0.wasm",
      npm: { name: "@dprint/json", version: "1.2.3" },
    }),
  ]);
  const search = /data-search="([^"]*)"/.exec(html)?.[1];
  expect(search).toContain("https://plugins.dprint.dev/json-1.0.0.wasm");
  expect(search).toContain("npm:@dprint/json@1.2.3");
});
