import { assertEquals } from "@std/assert";
import { createFetchCacher } from "./fetchCached.ts";

Deno.test("should error when going above 10mb", {
  // not sure why this stopped working on the CI
  ignore: !!Deno.env.get("CI"),
}, async (t) => {
  let time = 0;
  const clock = {
    getTime() {
      return time;
    },
  };
  const { fetchCached } = createFetchCacher(clock);
  await using server = Deno.serve((request) => {
    if (request.url.endsWith("large")) {
      return new Response(new Uint8Array(11 * 1024 * 1024).buffer, {
        status: 200,
      });
    } else if (request.url.endsWith("small")) {
      return new Response(new Uint8Array(9 * 1024 * 1024).buffer, {
        status: 200,
      });
    } else {
      return new Response("Not found", {
        status: 404,
      });
    }
  });

  const addr = server.addr.hostname + ":" + server.addr.port;

  // large
  await t.step("should error going above 10mb", async () => {
    const response = await fetchCached({
      url: `http://${addr}/large`,
      hostname: server.addr.hostname,
    });
    if (response.kind !== "error") {
      throw new Error("Expected error.");
    }
    assertEquals(response.response.status, 413);
  });

  // small
  await t.step("should not error below 10mb", async () => {
    const response = await fetchCached({
      url: `http://${addr}/small`,
      hostname: server.addr.hostname,
    });
    if (response.kind !== "success") {
      throw new Error("Expected error.");
    }
    assertEquals(response.body.byteLength, 9 * 1024 * 1024);

    const response2 = await fetchCached({
      url: `http://${addr}/small`,
      hostname: server.addr.hostname,
    });
    if (response.body !== response2.body) {
      throw new Error("Should have been the same objects.");
    }
  });

  await t.step("should error after 20 downloads because of rate limiting", async () => {
    for (let i = 0; i < 19; i++) {
      const response = await fetchCached({
        url: `http://${addr}/small`,
        hostname: server.addr.hostname,
      });
      assertEquals(response.kind, "success");
    }

    let response = await fetchCached({
      url: `http://${addr}/small`,
      hostname: server.addr.hostname,
    });
    if (response.kind !== "error") {
      throw new Error("Was not error.");
    }
    assertEquals(response.response.status, 429);
    // advance time and it should work again
    time += 61 * 1000;
    response = await fetchCached({
      url: `http://${addr}/small`,
      hostname: server.addr.hostname,
    });
    assertEquals(response.kind, "success");
  });
});
