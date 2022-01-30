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
