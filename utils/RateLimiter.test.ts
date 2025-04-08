import { assert } from "@std/assert";
import { Clock } from "./clock.ts";
import { RateLimiter } from "./RateLimiter.ts";

Deno.test("rate limits", () => {
  let time = 0;
  const clock: Clock = {
    getTime() {
      return time;
    },
  };
  const rateLimiter = new RateLimiter(clock, {
    limit: 2,
    timeWindowMs: 1000,
  });

  assert(rateLimiter.isAllowed("127.0.0.1"));
  time += 100;
  assert(rateLimiter.isAllowed("127.0.0.1"));
  assert(!rateLimiter.isAllowed("127.0.0.1"));
  time += 500;
  assert(!rateLimiter.isAllowed("127.0.0.1"));
  time += 500;
  assert(rateLimiter.isAllowed("127.0.0.1"));
  assert(!rateLimiter.isAllowed("127.0.0.1"));
  time += 500;
  assert(rateLimiter.isAllowed("127.0.0.1"));
  assert(!rateLimiter.isAllowed("127.0.0.1"));
  assert(rateLimiter.isAllowed("127.0.0.2"));
});
