import { assertEquals } from "./deps.test.ts";
import { handleRequest } from "./handleRequest.ts";

Deno.test("should get info.json", async () => {
  const response = await handleRequest(
    new Request("https://plugins.dprint.dev/info.json"),
  );
  assertEquals(response.headers.get("content-type"), "application/json; charset=utf-8");
  const data = await response.json();
  for (const pluginData of data.latest) {
    assertEquals(typeof pluginData.name, "string");
    assertEquals(typeof pluginData.version, "string");
    assertEquals(typeof pluginData.url, "string");
  }
});

async function getRedirectUrl(url: string) {
  const response = await handleRequest(
    new Request(url),
  );
  assertEquals(response.status, 302);
  return response.headers.get("location")!;
}

Deno.test("should get correct info for typescript resolver", async () => {
  function getWasmRedirectUrl(version: string) {
    return getRedirectUrl(`https://plugins.dprint.dev/typescript-${version}.wasm`);
  }

  assertEquals(
    await getWasmRedirectUrl("0.1.0"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.1.0/typescript-0.1.0.wasm",
  );
  assertEquals(
    await getWasmRedirectUrl("0.44.0"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.44.0/typescript-0.44.0.wasm",
  );
  // file name changed here
  assertEquals(
    await getWasmRedirectUrl("0.44.1"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.44.1/typescript.wasm",
  );
  assertEquals(
    await getRedirectUrl(`https://plugins.dprint.dev/schemas/typescript-0.1.0.json`),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.1.0/schema.json",
  );
  // file name changed after this
  assertEquals(
    await getWasmRedirectUrl("0.62.1"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.62.1/typescript.wasm",
  );
  assertEquals(
    await getWasmRedirectUrl("0.62.2"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.62.2/plugin.wasm",
  );
});

Deno.test("should get correct info for json resolver", async () => {
  function getWasmRedirectUrl(version: string) {
    return getRedirectUrl(`https://plugins.dprint.dev/json-${version}.wasm`);
  }

  assertEquals(
    await getWasmRedirectUrl("0.1.0"),
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.1.0/json-0.1.0.wasm",
  );
  assertEquals(
    await getWasmRedirectUrl("0.10.1"),
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.10.1/json-0.10.1.wasm",
  );
  // file name changed here
  assertEquals(
    await getWasmRedirectUrl("0.10.2"),
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.10.2/json.wasm",
  );
  assertEquals(
    await getRedirectUrl(`https://plugins.dprint.dev/schemas/json-0.1.0.json`),
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.1.0/schema.json",
  );
  // file name changed after this
  assertEquals(
    await getWasmRedirectUrl("0.14.0"),
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.14.0/json.wasm",
  );
  assertEquals(
    await getWasmRedirectUrl("0.14.1"),
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.14.1/plugin.wasm",
  );
});

Deno.test("should get correct info for markdown resolver", async () => {
  function getWasmRedirectUrl(version: string) {
    return getRedirectUrl(`https://plugins.dprint.dev/markdown-${version}.wasm`);
  }

  assertEquals(
    await getWasmRedirectUrl("0.1.0"),
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.1.0/markdown-0.1.0.wasm",
  );
  assertEquals(
    await getWasmRedirectUrl("0.7.0"),
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.7.0/markdown-0.7.0.wasm",
  );
  // file name changed here
  assertEquals(
    await getWasmRedirectUrl("0.7.1"),
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.7.1/markdown.wasm",
  );
  assertEquals(
    await getRedirectUrl(`https://plugins.dprint.dev/schemas/markdown-0.1.0.json`),
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.1.0/schema.json",
  );
  // file name changed after this
  assertEquals(
    await getWasmRedirectUrl("0.12.1"),
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.12.1/markdown.wasm",
  );
  assertEquals(
    await getWasmRedirectUrl("0.12.2"),
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.12.2/plugin.wasm",
  );
});

Deno.test("should get correct info for toml resolver", async () => {
  function getWasmRedirectUrl(version: string) {
    return getRedirectUrl(`https://plugins.dprint.dev/toml-${version}.wasm`);
  }

  assertEquals(
    await getWasmRedirectUrl("0.1.0"),
    "https://github.com/dprint/dprint-plugin-toml/releases/download/0.1.0/toml.wasm",
  );
  assertEquals(
    await getRedirectUrl(`https://plugins.dprint.dev/schemas/toml-0.1.0.json`),
    "https://github.com/dprint/dprint-plugin-toml/releases/download/0.1.0/schema.json",
  );
  // file name changed after this
  assertEquals(
    await getWasmRedirectUrl("0.5.3"),
    "https://github.com/dprint/dprint-plugin-toml/releases/download/0.5.3/toml.wasm",
  );
  assertEquals(
    await getWasmRedirectUrl("0.5.4"),
    "https://github.com/dprint/dprint-plugin-toml/releases/download/0.5.4/plugin.wasm",
  );
});

Deno.test("should get correct info for dockerfile resolver", async () => {
  function getWasmRedirectUrl(version: string) {
    return getRedirectUrl(`https://plugins.dprint.dev/dockerfile-${version}.wasm`);
  }

  assertEquals(
    await getWasmRedirectUrl("0.1.0"),
    "https://github.com/dprint/dprint-plugin-dockerfile/releases/download/0.1.0/dockerfile.wasm",
  );
  assertEquals(
    await getRedirectUrl(`https://plugins.dprint.dev/schemas/dockerfile-0.1.0.json`),
    "https://github.com/dprint/dprint-plugin-dockerfile/releases/download/0.1.0/schema.json",
  );
  // file name changed after this
  assertEquals(
    await getWasmRedirectUrl("0.2.1"),
    "https://github.com/dprint/dprint-plugin-dockerfile/releases/download/0.2.1/dockerfile.wasm",
  );
  assertEquals(
    await getWasmRedirectUrl("0.2.2"),
    "https://github.com/dprint/dprint-plugin-dockerfile/releases/download/0.2.2/plugin.wasm",
  );
});

Deno.test("should get correct info for sql resolver", async () => {
  function getWasmRedirectUrl(version: string) {
    return getRedirectUrl(`https://plugins.dprint.dev/sql-${version}.wasm`);
  }

  assertEquals(
    await getWasmRedirectUrl("0.1.0"),
    "https://github.com/dprint/dprint-plugin-sql/releases/download/0.1.0/sql.wasm",
  );
  assertEquals(
    await getRedirectUrl(`https://plugins.dprint.dev/schemas/sql-0.1.0.json`),
    "https://github.com/dprint/dprint-plugin-sql/releases/download/0.1.0/schema.json",
  );
  // file name changed after this
  assertEquals(
    await getWasmRedirectUrl("0.1.1"),
    "https://github.com/dprint/dprint-plugin-sql/releases/download/0.1.1/sql.wasm",
  );
  assertEquals(
    await getWasmRedirectUrl("0.1.2"),
    "https://github.com/dprint/dprint-plugin-sql/releases/download/0.1.2/plugin.wasm",
  );
});

Deno.test("should get correct info for prettier resolver", async () => {
  function getProcessPluginRedirectUrl(version: string) {
    return getRedirectUrl(`https://plugins.dprint.dev/prettier-${version}.exe-plugin`);
  }

  // file name changed after this
  assertEquals(
    await getProcessPluginRedirectUrl("0.5.0"),
    "https://github.com/dprint/dprint-plugin-prettier/releases/download/0.5.0/prettier.exe-plugin",
  );
  assertEquals(
    await getProcessPluginRedirectUrl("0.5.1"),
    "https://github.com/dprint/dprint-plugin-prettier/releases/download/0.5.1/plugin.exe-plugin",
  );
});

Deno.test("should get correct info for roslyn resolver", async () => {
  function getProcessPluginRedirectUrl(version: string) {
    return getRedirectUrl(`https://plugins.dprint.dev/roslyn-${version}.exe-plugin`);
  }

  // file name changed after this
  assertEquals(
    await getProcessPluginRedirectUrl("0.4.0"),
    "https://github.com/dprint/dprint-plugin-roslyn/releases/download/0.4.0/roslyn.exe-plugin",
  );
  assertEquals(
    await getProcessPluginRedirectUrl("0.4.1"),
    "https://github.com/dprint/dprint-plugin-roslyn/releases/download/0.4.1/plugin.exe-plugin",
  );
});

Deno.test("should get correct info for rustfmt resolver", async () => {
  function getProcessPluginRedirectUrl(version: string) {
    return getRedirectUrl(`https://plugins.dprint.dev/rustfmt-${version}.exe-plugin`);
  }

  // file name changed after this
  assertEquals(
    await getProcessPluginRedirectUrl("0.4.0"),
    "https://github.com/dprint/dprint-plugin-rustfmt/releases/download/0.4.0/rustfmt.exe-plugin",
  );
  assertEquals(
    await getProcessPluginRedirectUrl("0.4.1"),
    "https://github.com/dprint/dprint-plugin-rustfmt/releases/download/0.4.1/plugin.exe-plugin",
  );
});

Deno.test("should get correct info for yapf resolver", async () => {
  function getProcessPluginRedirectUrl(version: string) {
    return getRedirectUrl(`https://plugins.dprint.dev/yapf-${version}.exe-plugin`);
  }

  // file name changed after this
  assertEquals(
    await getProcessPluginRedirectUrl("0.2.0"),
    "https://github.com/dprint/dprint-plugin-yapf/releases/download/0.2.0/yapf.exe-plugin",
  );
  assertEquals(
    await getProcessPluginRedirectUrl("0.2.1"),
    "https://github.com/dprint/dprint-plugin-yapf/releases/download/0.2.1/plugin.exe-plugin",
  );
});

Deno.test("should get correct info for exec resolver", async () => {
  function getProcessPluginRedirectUrl(version: string) {
    return getRedirectUrl(`https://plugins.dprint.dev/exec-${version}.exe-plugin`);
  }

  assertEquals(
    await getProcessPluginRedirectUrl("0.1.0"),
    "https://github.com/dprint/dprint-plugin-exec/releases/download/0.1.0/plugin.exe-plugin",
  );
});

Deno.test("tryResolvePluginUrl", async () => {
  assertEquals(
    await getRedirectUrl("https://plugins.dprint.dev/typescript-1.2.3.wasm"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/plugin.wasm",
  );

  assertEquals(
    await getRedirectUrl("https://plugins.dprint.dev/dprint/typescript-1.2.3.wasm"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/plugin.wasm",
  );

  assertEquals(
    await getRedirectUrl("https://plugins.dprint.dev/dprint/dprint-plugin-typescript-1.2.3.wasm"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/plugin.wasm",
  );

  assertEquals(
    await getRedirectUrl("https://plugins.dprint.dev/dprint/dprint-plugin-typescript-latest.wasm"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/latest/download/plugin.wasm",
  );

  assertEquals(
    await getRedirectUrl("https://plugins.dprint.dev/dprint/non-existent-1.2.3.wasm"),
    "https://github.com/dprint/non-existent/releases/download/1.2.3/plugin.wasm",
  );

  assertEquals(
    await getRedirectUrl("https://plugins.dprint.dev/dprint/dprint-plugin-exec-0.1.0.exe-plugin"),
    "https://github.com/dprint/dprint-plugin-exec/releases/download/0.1.0/plugin.exe-plugin",
  );
});

// todo: mock github api for these tests

Deno.test("tryResolveSchemaUrl", async () => {
  assertEquals(
    await getRedirectUrl("https://plugins.dprint.dev/schemas/typescript-1.2.3.json"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/schema.json",
  );

  assertEquals(
    await getRedirectUrl("https://plugins.dprint.dev/dprint/typescript/1.2.3/schema.json"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/schema.json",
  );

  assertEquals(
    await getRedirectUrl("https://plugins.dprint.dev/dprint/dprint-plugin-typescript/1.2.3/schema.json"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/schema.json",
  );

  assertEquals(
    await getRedirectUrl("https://plugins.dprint.dev/dprint/dprint-plugin-typescript/latest/schema.json"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/latest/download/schema.json",
  );

  assertEquals(
    await getRedirectUrl("https://plugins.dprint.dev/dprint/non-existent/1.2.3/schema.json"),
    "https://github.com/dprint/non-existent/releases/download/1.2.3/schema.json",
  );
});
