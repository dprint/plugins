import { describe, expect, it } from "vitest";
import { createFetchCacher } from "./fetchCached.js";

describe("fetchCached", () => {
  let time = 0;
  const clock = {
    getTime() {
      return time;
    },
  };

  const mockFetch = (url: string) => {
    if (url.endsWith("large")) {
      return Promise.resolve(new Response(new Uint8Array(11 * 1024 * 1024), { status: 200 }));
    } else if (url.endsWith("small")) {
      return Promise.resolve(new Response(new Uint8Array(9 * 1024 * 1024), { status: 200 }));
    } else {
      return Promise.resolve(new Response("Not found", { status: 404 }));
    }
  };

  const { fetchCached } = createFetchCacher(clock, mockFetch);

  it("should error going above 10mb", async () => {
    const response = await fetchCached({
      url: "http://test/large",
      hostname: "127.0.0.1",
    });
    if (response.kind !== "error") {
      throw new Error("Expected error.");
    }
    expect(response.response.status).toEqual(413);
  });

  it("should not error below 10mb", async () => {
    const response = await fetchCached({
      url: "http://test/small",
      hostname: "127.0.0.1",
    });
    if (response.kind !== "success") {
      throw new Error("Expected success.");
    }
    expect(response.body.byteLength).toEqual(9 * 1024 * 1024);

    const response2 = await fetchCached({
      url: "http://test/small",
      hostname: "127.0.0.1",
    });
    if (response.body !== response2.body) {
      throw new Error("Should have been the same objects.");
    }
  });

  it("should error after 20 downloads because of rate limiting", async () => {
    for (let i = 0; i < 19; i++) {
      const response = await fetchCached({
        url: "http://test/small",
        hostname: "127.0.0.1",
      });
      expect(response.kind).toEqual("success");
    }

    let response = await fetchCached({
      url: "http://test/small",
      hostname: "127.0.0.1",
    });
    if (response.kind !== "error") {
      throw new Error("Was not error.");
    }
    expect(response.response.status).toEqual(429);
    // advance time and it should work again
    time += 61 * 1000;
    response = await fetchCached({
      url: "http://test/small",
      hostname: "127.0.0.1",
    });
    expect(response.kind).toEqual("success");
  });
});
