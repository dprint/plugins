import { expect, it } from "vitest";
import { Clock } from "./clock.js";
import { RateLimiter } from "./RateLimiter.js";

it("rate limits", () => {
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

  expect(rateLimiter.isAllowed("127.0.0.1")).toBeTruthy();
  time += 100;
  expect(rateLimiter.isAllowed("127.0.0.1")).toBeTruthy();
  expect(rateLimiter.isAllowed("127.0.0.1")).toBeFalsy();
  time += 500;
  expect(rateLimiter.isAllowed("127.0.0.1")).toBeFalsy();
  time += 500;
  expect(rateLimiter.isAllowed("127.0.0.1")).toBeTruthy();
  expect(rateLimiter.isAllowed("127.0.0.1")).toBeFalsy();
  time += 500;
  expect(rateLimiter.isAllowed("127.0.0.1")).toBeTruthy();
  expect(rateLimiter.isAllowed("127.0.0.1")).toBeFalsy();
  expect(rateLimiter.isAllowed("127.0.0.2")).toBeTruthy();
});
