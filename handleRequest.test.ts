import { expect, it } from "vitest";
import { createRequestHandler, resolvePluginOrSchemaUrl, rewriteGithubUrls } from "./handleRequest.js";

it("should get info.json", { timeout: 10_000 }, async () => {
  const { handleRequest } = createRequestHandler();
  const response = await handleRequest(
    new Request("https://plugins.dprint.dev/info.json"),
  );
  expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
  const data: any = await response.json();
  for (const pluginData of data.latest) {
    expect(typeof pluginData.name).toEqual("string");
    expect(typeof pluginData.version).toEqual("string");
    expect(typeof pluginData.url).toEqual("string");
  }
});

it("should get cli.json", async () => {
  const { handleRequest } = createRequestHandler();
  const response = await handleRequest(
    new Request("https://plugins.dprint.dev/cli.json"),
  );
  expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
  const data: any = await response.json();
  expect(typeof data.version).toEqual("string");
});

async function resolveUrl(url: string) {
  return await resolvePluginOrSchemaUrl(new URL(url));
}

it("should resolve typescript URLs", async () => {
  expect(
    await resolveUrl("https://plugins.dprint.dev/typescript-0.19.4.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.19.4/typescript-0.19.4.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/typescript-0.44.0.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.44.0/typescript-0.44.0.wasm",
  );
  // file name changed here
  expect(
    await resolveUrl("https://plugins.dprint.dev/typescript-0.44.1.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.44.1/typescript.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/schemas/typescript-0.52.1.json"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.52.1/schema.json",
  );
  // file name changed after this
  expect(
    await resolveUrl("https://plugins.dprint.dev/typescript-0.62.1.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.62.1/typescript.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/typescript-0.62.2.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.62.2/plugin.wasm",
  );
});

it("should resolve json URLs", async () => {
  expect(
    await resolveUrl("https://plugins.dprint.dev/json-0.4.0.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.4.0/json-0.4.0.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/json-0.10.1.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.10.1/json-0.10.1.wasm",
  );
  // file name changed here
  expect(
    await resolveUrl("https://plugins.dprint.dev/json-0.10.2.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.10.2/json.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/schemas/json-0.13.1.json"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.13.1/schema.json",
  );
  // file name changed after this
  expect(
    await resolveUrl("https://plugins.dprint.dev/json-0.14.0.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.14.0/json.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/json-0.14.1.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.14.1/plugin.wasm",
  );
});

it("should resolve markdown URLs", async () => {
  expect(
    await resolveUrl("https://plugins.dprint.dev/markdown-0.1.0.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.1.0/markdown-0.1.0.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/markdown-0.7.0.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.7.0/markdown-0.7.0.wasm",
  );
  // file name changed here
  expect(
    await resolveUrl("https://plugins.dprint.dev/markdown-0.7.1.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.7.1/markdown.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/schemas/markdown-0.10.0.json"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.10.0/schema.json",
  );
  // file name changed after this
  expect(
    await resolveUrl("https://plugins.dprint.dev/markdown-0.12.1.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.12.1/markdown.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/markdown-0.12.2.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.12.2/plugin.wasm",
  );
});

it("should resolve toml URLs", async () => {
  expect(
    await resolveUrl("https://plugins.dprint.dev/toml-0.1.2.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-toml/releases/download/0.1.2/toml.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/schemas/toml-0.5.0.json"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-toml/releases/download/0.5.0/schema.json",
  );
  // file name changed after this
  expect(
    await resolveUrl("https://plugins.dprint.dev/toml-0.5.3.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-toml/releases/download/0.5.3/toml.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/toml-0.5.4.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-toml/releases/download/0.5.4/plugin.wasm",
  );
});

it("should resolve dockerfile URLs", async () => {
  expect(
    await resolveUrl("https://plugins.dprint.dev/dockerfile-0.1.0.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-dockerfile/releases/download/0.1.0/dockerfile.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/schemas/dockerfile-0.1.0.json"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-dockerfile/releases/download/0.1.0/schema.json",
  );
  // file name changed after this
  expect(
    await resolveUrl("https://plugins.dprint.dev/dockerfile-0.2.1.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-dockerfile/releases/download/0.2.1/dockerfile.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/dockerfile-0.2.2.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-dockerfile/releases/download/0.2.2/plugin.wasm",
  );
});

it("should resolve sql URLs", async () => {
  expect(
    await resolveUrl("https://plugins.dprint.dev/sql-0.1.1.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-sql/releases/download/0.1.1/sql.wasm",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/schemas/sql-0.1.1.json"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-sql/releases/download/0.1.1/schema.json",
  );
  // file name changed here
  expect(
    await resolveUrl("https://plugins.dprint.dev/sql-0.1.2.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-sql/releases/download/0.1.2/plugin.wasm",
  );
});

it("should resolve prettier URLs", async () => {
  // file name changed after this
  expect(
    await resolveUrl("https://plugins.dprint.dev/prettier-0.5.0.exe-plugin"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-prettier/releases/download/0.5.0/prettier.exe-plugin",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/prettier-0.5.1.exe-plugin"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-prettier/releases/download/0.5.1/plugin.exe-plugin",
  );
  // and changed again here
  expect(
    await resolveUrl("https://plugins.dprint.dev/prettier-0.6.2.exe-plugin"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-prettier/releases/download/0.6.2/plugin.exe-plugin",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/prettier-0.7.0.json"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-prettier/releases/download/0.7.0/plugin.json",
  );
});

it("should resolve roslyn URLs", async () => {
  // file name changed after this
  expect(
    await resolveUrl("https://plugins.dprint.dev/roslyn-0.4.0.exe-plugin"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-roslyn/releases/download/0.4.0/roslyn.exe-plugin",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/roslyn-0.5.0.exe-plugin"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-roslyn/releases/download/0.5.0/plugin.exe-plugin",
  );
  // and again here
  expect(
    await resolveUrl("https://plugins.dprint.dev/roslyn-0.6.4.json"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-roslyn/releases/download/0.6.4/plugin.json",
  );
});

it("should resolve rustfmt URLs", async () => {
  // file name changed after this
  expect(
    await resolveUrl("https://plugins.dprint.dev/rustfmt-0.4.0.exe-plugin"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-rustfmt/releases/download/0.4.0/rustfmt.exe-plugin",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/rustfmt-0.5.1.exe-plugin"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-rustfmt/releases/download/0.5.1/plugin.exe-plugin",
  );
  // and again here
  expect(
    await resolveUrl("https://plugins.dprint.dev/rustfmt-0.6.2.json"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-rustfmt/releases/download/0.6.2/plugin.json",
  );
});

it("should resolve yapf URLs", async () => {
  // file name changed after this
  expect(
    await resolveUrl("https://plugins.dprint.dev/yapf-0.2.0.exe-plugin"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-yapf/releases/download/0.2.0/yapf.exe-plugin",
  );
  expect(
    await resolveUrl("https://plugins.dprint.dev/yapf-0.2.1.exe-plugin"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-yapf/releases/download/0.2.1/plugin.exe-plugin",
  );
});

it("should resolve exec URLs", async () => {
  expect(
    await resolveUrl("https://plugins.dprint.dev/exec-0.1.0.exe-plugin"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-exec/releases/download/0.1.0/plugin.exe-plugin",
  );
});

it("tryResolvePluginUrl", async () => {
  expect(
    await resolveUrl("https://plugins.dprint.dev/typescript-1.2.3.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/plugin.wasm",
  );

  expect(
    await resolveUrl("https://plugins.dprint.dev/dprint/typescript-1.2.3.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/plugin.wasm",
  );

  expect(
    await resolveUrl("https://plugins.dprint.dev/dprint/dprint-plugin-typescript-1.2.3.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/plugin.wasm",
  );

  expect(
    await resolveUrl("https://plugins.dprint.dev/dprint/dprint-plugin-typescript-latest.wasm"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-typescript/releases/latest/download/plugin.wasm",
  );

  expect(
    await resolveUrl("https://plugins.dprint.dev/dprint/dprint-plugin-exec-0.3.0.json"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-exec/releases/download/0.3.0/plugin.json",
  );

  expect(
    await resolveUrl("https://plugins.dprint.dev/lucacasonato/mf2-tools-0.1.0.wasm"),
  ).toEqual(
    "https://github.com/lucacasonato/mf2-tools/releases/download/0.1.0/dprint-plugin-mf2.wasm",
  );
});

it("should redirect non-wasm plugins to asset URL", async () => {
  const { handleRequest } = createRequestHandler();
  const response = await handleRequest(
    new Request("https://plugins.dprint.dev/prettier-0.7.0.json"),
  );
  expect(response.status).toEqual(302);
  expect(response.headers.get("location")).toEqual(
    "https://plugins.dprint.dev/dprint/dprint-plugin-prettier/0.7.0/asset/plugin.json",
  );
});

it("should not redirect wasm plugins", async () => {
  const { handleRequest } = createRequestHandler();
  const response = await handleRequest(
    new Request("https://plugins.dprint.dev/typescript-0.62.2.wasm"),
  );
  expect(response.status).not.toEqual(302);
});

it("should redirect non-allowed org asset to GitHub", async () => {
  const { handleRequest } = createRequestHandler();
  const response = await handleRequest(
    new Request("https://plugins.dprint.dev/someone/some-repo/0.1.0/asset/file.zip"),
  );
  expect(response.status).toEqual(302);
  expect(response.headers.get("location")).toEqual(
    "https://github.com/someone/some-repo/releases/download/0.1.0/file.zip",
  );
});

it("should return 404 for asset not found", async () => {
  const { handleRequest } = createRequestHandler();
  const response = await handleRequest(
    new Request("https://plugins.dprint.dev/dprint/dprint-plugin-prettier/0.0.0/asset/nonexistent.zip"),
  );
  expect(response.status).toEqual(404);
});

it("rewriteGithubUrls", () => {
  const githubUrl = "https://github.com/dprint/dprint-plugin-exec/releases/download/0.6.0/plugin.json";
  const origin = "https://plugins.dprint.dev";
  const json = JSON.stringify({
    "schemaVersion": 2,
    "kind": "process",
    "darwin-aarch64": {
      "reference":
        "https://github.com/dprint/dprint-plugin-exec/releases/download/0.6.0/dprint-plugin-exec-aarch64-apple-darwin.zip",
      "checksum": "abc123",
    },
    "linux-x86_64": {
      "reference":
        "https://github.com/dprint/dprint-plugin-exec/releases/download/0.6.0/dprint-plugin-exec-x86_64-unknown-linux-gnu.zip",
      "checksum": "def456",
    },
  });
  const body = new TextEncoder().encode(json).buffer as ArrayBuffer;
  const result = rewriteGithubUrls(githubUrl, body, origin);
  expect(typeof result).toEqual("string");
  const parsed = JSON.parse(result as string);
  expect(parsed["darwin-aarch64"].reference).toEqual(
    "https://plugins.dprint.dev/dprint/dprint-plugin-exec/0.6.0/asset/dprint-plugin-exec-aarch64-apple-darwin.zip",
  );
  expect(parsed["linux-x86_64"].reference).toEqual(
    "https://plugins.dprint.dev/dprint/dprint-plugin-exec/0.6.0/asset/dprint-plugin-exec-x86_64-unknown-linux-gnu.zip",
  );
});

it("rewriteGithubUrls should not rewrite non-plugin.json", () => {
  const githubUrl = "https://github.com/dprint/dprint-plugin-exec/releases/download/0.6.0/schema.json";
  const body = new TextEncoder().encode("{}").buffer as ArrayBuffer;
  const result = rewriteGithubUrls(githubUrl, body, "https://plugins.dprint.dev");
  expect(result).toBe(body);
});

it("rewriteGithubUrls should return original buffer when no URLs match", () => {
  const githubUrl = "https://github.com/dprint/dprint-plugin-exec/releases/download/0.6.0/plugin.json";
  const json = JSON.stringify({ "key": "value" });
  const body = new TextEncoder().encode(json).buffer as ArrayBuffer;
  const result = rewriteGithubUrls(githubUrl, body, "https://plugins.dprint.dev");
  expect(result).toBe(body);
});

// todo: mock github api for these tests

it("tryResolveSchemaUrl", async () => {
  expect(
    await resolveUrl("https://plugins.dprint.dev/dprint/typescript/1.2.3/schema.json"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/schema.json",
  );

  expect(
    await resolveUrl("https://plugins.dprint.dev/dprint/dprint-plugin-typescript/1.2.3/schema.json"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/schema.json",
  );

  expect(
    await resolveUrl("https://plugins.dprint.dev/dprint/dprint-plugin-typescript/latest/schema.json"),
  ).toEqual(
    "https://github.com/dprint/dprint-plugin-typescript/releases/latest/download/schema.json",
  );

  expect(
    await resolveUrl("https://plugins.dprint.dev/dprint/non-existent/1.2.3/schema.json"),
  ).toEqual(
    "https://github.com/dprint/non-existent/releases/download/1.2.3/schema.json",
  );

  expect(
    await resolveUrl("https://plugins.dprint.dev/lucacasonato/mf2-tools/0.1.0/schema.json"),
  ).toEqual(
    "https://github.com/lucacasonato/mf2-tools/releases/download/0.1.0/dprint-plugin-mf2.schema.json",
  );
});
