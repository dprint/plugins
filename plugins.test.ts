import { assertEquals } from "./deps.test.ts";
import { pluginResolvers, tryResolvePluginUrl, tryResolveSchemaUrl } from "./plugins.ts";

Deno.test("should get correct info for typescript resolver", () => {
  const resolver = getResolverByName("typescript");
  assertEquals(
    resolver.getRedirectUrl("0.1.0"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.1.0/typescript-0.1.0.wasm",
  );
  assertEquals(
    resolver.getRedirectUrl("0.44.0"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.44.0/typescript-0.44.0.wasm",
  );
  // file name changed here
  assertEquals(
    resolver.getRedirectUrl("0.44.1"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.44.1/typescript.wasm",
  );
  assertEquals(
    resolver.getSchemaUrl!("0.1.0"),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/0.1.0/schema.json",
  );
  assertEquals(
    resolver.schemaVersionUrlPattern!
      .exec(new URL("https://plugins.dprint.dev/schemas/typescript-0.5.0.json"))
      ?.pathname.groups[0],
    "0.5.0",
  );
});

Deno.test("should get correct info for json resolver", () => {
  const resolver = getResolverByName("json");
  assertEquals(
    resolver.getRedirectUrl("0.1.0"),
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.1.0/json-0.1.0.wasm",
  );
  assertEquals(
    resolver.getRedirectUrl("0.10.1"),
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.10.1/json-0.10.1.wasm",
  );
  // file name changed here
  assertEquals(
    resolver.getRedirectUrl("0.10.2"),
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.10.2/json.wasm",
  );
  assertEquals(
    resolver.getSchemaUrl!("0.1.0"),
    "https://github.com/dprint/dprint-plugin-json/releases/download/0.1.0/schema.json",
  );
  assertEquals(
    resolver.schemaVersionUrlPattern!
      .exec(new URL("https://plugins.dprint.dev/schemas/json-0.5.0.json"))
      ?.pathname.groups[0],
    "0.5.0",
  );
});

Deno.test("should get correct info for markdown resolver", () => {
  const resolver = getResolverByName("markdown");
  assertEquals(
    resolver.getRedirectUrl("0.1.0"),
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.1.0/markdown-0.1.0.wasm",
  );
  assertEquals(
    resolver.getRedirectUrl("0.7.0"),
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.7.0/markdown-0.7.0.wasm",
  );
  // file name changed here
  assertEquals(
    resolver.getRedirectUrl("0.7.1"),
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.7.1/markdown.wasm",
  );
  assertEquals(
    resolver.getSchemaUrl!("0.1.0"),
    "https://github.com/dprint/dprint-plugin-markdown/releases/download/0.1.0/schema.json",
  );
  assertEquals(
    resolver.schemaVersionUrlPattern!
      .exec(new URL("https://plugins.dprint.dev/schemas/markdown-0.5.0.json"))
      ?.pathname.groups[0],
    "0.5.0",
  );
});

Deno.test("should get correct info for toml resolver", () => {
  const resolver = getResolverByName("toml");
  assertEquals(
    resolver.getRedirectUrl("0.1.0"),
    "https://github.com/dprint/dprint-plugin-toml/releases/download/0.1.0/toml.wasm",
  );
  assertEquals(
    resolver.getSchemaUrl!("0.1.0"),
    "https://github.com/dprint/dprint-plugin-toml/releases/download/0.1.0/schema.json",
  );
  assertEquals(
    resolver.schemaVersionUrlPattern!
      .exec(new URL("https://plugins.dprint.dev/schemas/toml-0.5.0.json"))
      ?.pathname.groups[0],
    "0.5.0",
  );
});

Deno.test("should get correct info for dockerfile resolver", () => {
  const resolver = getResolverByName("dockerfile");
  assertEquals(
    resolver.getRedirectUrl("0.1.0"),
    "https://github.com/dprint/dprint-plugin-dockerfile/releases/download/0.1.0/dockerfile.wasm",
  );
  assertEquals(
    resolver.getSchemaUrl!("0.1.0"),
    "https://github.com/dprint/dprint-plugin-dockerfile/releases/download/0.1.0/schema.json",
  );
  assertEquals(
    resolver.schemaVersionUrlPattern!
      .exec(new URL("https://plugins.dprint.dev/schemas/dockerfile-0.5.0.json"))
      ?.pathname.groups[0],
    "0.5.0",
  );
});

Deno.test("should get correct info for sql resolver", () => {
  const resolver = getResolverByName("sql");
  assertEquals(
    resolver.getRedirectUrl("0.1.0"),
    "https://github.com/dprint/dprint-plugin-sql/releases/download/0.1.0/sql.wasm",
  );
  assertEquals(
    resolver.getSchemaUrl!("0.1.0"),
    "https://github.com/dprint/dprint-plugin-sql/releases/download/0.1.0/schema.json",
  );
  assertEquals(
    resolver.schemaVersionUrlPattern!
      .exec(new URL("https://plugins.dprint.dev/schemas/sql-0.5.0.json"))
      ?.pathname.groups[0],
    "0.5.0",
  );
});

Deno.test("tryResolvePluginUrl", async () => {
  assertEquals(
    await tryResolvePluginUrl(new URL("https://plugins.dprint.dev/typescript-1.2.3.wasm")),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/typescript.wasm",
  );

  assertEquals(
    await tryResolvePluginUrl(new URL("https://plugins.dprint.dev/dprint/typescript-1.2.3.wasm")),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/plugin.wasm",
  );

  assertEquals(
    await tryResolvePluginUrl(
      new URL("https://plugins.dprint.dev/dprint/dprint-plugin-typescript-1.2.3.wasm"),
    ),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/plugin.wasm",
  );

  assertEquals(
    await tryResolvePluginUrl(
      new URL("https://plugins.dprint.dev/dprint/dprint-plugin-typescript-latest.wasm"),
    ),
    "https://github.com/dprint/dprint-plugin-typescript/releases/latest/download/plugin.wasm",
  );

  assertEquals(
    await tryResolvePluginUrl(new URL("https://plugins.dprint.dev/dprint/non-existent-1.2.3.wasm")),
    "https://github.com/dprint/non-existent/releases/download/1.2.3/plugin.wasm",
  );
});

Deno.test("tryResolveSchemaUrl", async () => {
  assertEquals(
    await tryResolveSchemaUrl(
      new URL("https://plugins.dprint.dev/schemas/typescript-1.2.3.json"),
    ),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/schema.json",
  );

  assertEquals(
    await tryResolveSchemaUrl(
      new URL("https://plugins.dprint.dev/schemas/dprint/typescript-1.2.3.json"),
    ),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/schema.json",
  );

  assertEquals(
    await tryResolveSchemaUrl(
      new URL("https://plugins.dprint.dev/schemas/dprint/dprint-plugin-typescript-1.2.3.json"),
    ),
    "https://github.com/dprint/dprint-plugin-typescript/releases/download/1.2.3/schema.json",
  );

  assertEquals(
    await tryResolveSchemaUrl(
      new URL("https://plugins.dprint.dev/schemas/dprint/dprint-plugin-typescript-latest.json"),
    ),
    "https://github.com/dprint/dprint-plugin-typescript/releases/latest/download/schema.json",
  );

  assertEquals(
    await tryResolveSchemaUrl(
      new URL("https://plugins.dprint.dev/schemas/dprint/non-existent-1.2.3.json"),
    ),
    "https://github.com/dprint/non-existent/releases/download/1.2.3/schema.json",
  );
});

function getResolverByName(name: string) {
  const url = new URL(`https://plugins.dprint.dev/${name}-0.5.0.wasm`);
  const resolver = pluginResolvers.find(r => r.versionPattern.exec(url)?.pathname.groups[0] != null);
  if (!resolver) {
    throw new Error("Not found.");
  }
  return resolver;
}
