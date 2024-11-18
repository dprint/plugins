import { assertEquals } from "./deps.test.ts";
import { createRequestHandler } from "./handleRequest.ts";
import { RealClock } from "./utils/clock.ts";

const connInfo = {
  remoteAddr: {
    transport: "tcp",
    hostname: "127.0.0.1",
    port: 80,
  },
  completed: Promise.resolve(),
} satisfies Deno.ServeHandlerInfo<Deno.NetAddr>;

Deno.test("should get info.json", async () => {
  const { handleRequest } = createRequestHandler(new RealClock());
  const response = await handleRequest(
    new Request("https://plugins.dprint.dev/info.json"),
    connInfo,
  );
  assertEquals(response.headers.get("content-type"), "application/json; charset=utf-8");
  const data = await response.json();
  for (const pluginData of data.latest) {
    assertEquals(typeof pluginData.name, "string");
    assertEquals(typeof pluginData.version, "string");
    assertEquals(typeof pluginData.url, "string");
  }
});

Deno.test("should get cli.json", async () => {
  const { handleRequest } = createRequestHandler(new RealClock());
  const response = await handleRequest(
    new Request("https://plugins.dprint.dev/cli.json"),
    connInfo,
  );
  assertEquals(response.headers.get("content-type"), "application/json; charset=utf-8");
  const data = await response.json();
  assertEquals(typeof data.version, "string");
});

async function getRedirectUrl(url: string) {
  const { handleRequest } = createRequestHandler(new RealClock());
  const response = await handleRequest(
    new Request(url),
    connInfo,
  );
  assertEquals(response.status, 302);
  return response.headers.get("location")!;
}

Deno.test("should get correct info for typescript resolver", async () => {
  function getWasmRedirectUrl(version: string) {
    return getRedirectUrl(`https://plugins.dprint.dev/typescript-${version}.wasm`);
  }

  assertEquals(
    await getWasmRedirectUrl("0.19.4"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.19.4/typescript-0.19.4.wasm",
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
    await getRedirectUrl(`https://plugins.dprint.dev/schemas/typescript-0.52.1.json`),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.52.1/schema.json",
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
    await getWasmRedirectUrl("0.4.0"),
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.4.0/json-0.4.0.wasm",
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
    await getRedirectUrl(`https://plugins.dprint.dev/schemas/json-0.13.1.json`),
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.13.1/schema.json",
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
    await getRedirectUrl(`https://plugins.dprint.dev/schemas/markdown-0.10.0.json`),
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.10.0/schema.json",
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
    await getWasmRedirectUrl("0.1.2"),
    "https://github.com/dprint/dprint-plugin-toml/releases/download/0.1.2/toml.wasm",
  );
  assertEquals(
    await getRedirectUrl(`https://plugins.dprint.dev/schemas/toml-0.5.0.json`),
    "https://github.com/dprint/dprint-plugin-toml/releases/download/0.5.0/schema.json",
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
    await getWasmRedirectUrl("0.1.1"),
    "https://github.com/dprint/dprint-plugin-sql/releases/download/0.1.1/sql.wasm",
  );
  assertEquals(
    await getRedirectUrl(`https://plugins.dprint.dev/schemas/sql-0.1.1.json`),
    "https://github.com/dprint/dprint-plugin-sql/releases/download/0.1.1/schema.json",
  );
  // file name changed here
  assertEquals(
    await getWasmRedirectUrl("0.1.2"),
    "https://github.com/dprint/dprint-plugin-sql/releases/download/0.1.2/plugin.wasm",
  );
});

Deno.test("should get correct info for prettier resolver", async () => {
  function getProcessPluginRedirectUrl(version: string, ext = "json") {
    return getRedirectUrl(`https://plugins.dprint.dev/prettier-${version}.${ext}`);
  }

  // file name changed after this
  assertEquals(
    await getProcessPluginRedirectUrl("0.5.0", "exe-plugin"),
    "https://github.com/dprint/dprint-plugin-prettier/releases/download/0.5.0/prettier.exe-plugin",
  );
  assertEquals(
    await getProcessPluginRedirectUrl("0.5.1", "exe-plugin"),
    "https://github.com/dprint/dprint-plugin-prettier/releases/download/0.5.1/plugin.exe-plugin",
  );

  // and changed again here
  assertEquals(
    await getProcessPluginRedirectUrl("0.6.2", "exe-plugin"),
    "https://github.com/dprint/dprint-plugin-prettier/releases/download/0.6.2/plugin.exe-plugin",
  );
  assertEquals(
    await getProcessPluginRedirectUrl("0.7.0"),
    "https://github.com/dprint/dprint-plugin-prettier/releases/download/0.7.0/plugin.json",
  );
});

Deno.test("should get correct info for roslyn resolver", async () => {
  function getProcessPluginRedirectUrl(version: string, ext = "json") {
    return getRedirectUrl(`https://plugins.dprint.dev/roslyn-${version}.${ext}`);
  }

  // file name changed after this
  assertEquals(
    await getProcessPluginRedirectUrl("0.4.0", "exe-plugin"),
    "https://github.com/dprint/dprint-plugin-roslyn/releases/download/0.4.0/roslyn.exe-plugin",
  );
  assertEquals(
    await getProcessPluginRedirectUrl("0.5.0", "exe-plugin"),
    "https://github.com/dprint/dprint-plugin-roslyn/releases/download/0.5.0/plugin.exe-plugin",
  );
  // and again here
  assertEquals(
    await getProcessPluginRedirectUrl("0.6.4"),
    "https://github.com/dprint/dprint-plugin-roslyn/releases/download/0.6.4/plugin.json",
  );
});

Deno.test("should get correct info for rustfmt resolver", async () => {
  function getProcessPluginRedirectUrl(version: string, ext = "json") {
    return getRedirectUrl(`https://plugins.dprint.dev/rustfmt-${version}.${ext}`);
  }

  // file name changed after this
  assertEquals(
    await getProcessPluginRedirectUrl("0.4.0", "exe-plugin"),
    "https://github.com/dprint/dprint-plugin-rustfmt/releases/download/0.4.0/rustfmt.exe-plugin",
  );
  assertEquals(
    await getProcessPluginRedirectUrl("0.5.1", "exe-plugin"),
    "https://github.com/dprint/dprint-plugin-rustfmt/releases/download/0.5.1/plugin.exe-plugin",
  );
  // and again here
  assertEquals(
    await getProcessPluginRedirectUrl("0.6.2"),
    "https://github.com/dprint/dprint-plugin-rustfmt/releases/download/0.6.2/plugin.json",
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
    await getRedirectUrl("https://plugins.dprint.dev/dprint/dprint-plugin-exec-0.3.0.json"),
    "https://github.com/dprint/dprint-plugin-exec/releases/download/0.3.0/plugin.json",
  );

  assertEquals(
    await getRedirectUrl("https://plugins.dprint.dev/lucacasonato/mf2-tools-0.1.0.wasm"),
    "https://github.com/lucacasonato/mf2-tools/releases/download/0.1.0/dprint-plugin-mf2.wasm",
  );
});

// todo: mock github api for these tests

Deno.test("tryResolveSchemaUrl", async () => {
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

  assertEquals(
    await getRedirectUrl("https://plugins.dprint.dev/lucacasonato/mf2-tools/0.1.0/schema.json"),
    "https://github.com/lucacasonato/mf2-tools/releases/download/0.1.0/dprint-plugin-mf2.schema.json",
  );
});
