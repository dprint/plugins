import { Clock } from "./clock.ts";
import { LruCache } from "./LruCache.ts";

export interface RateLimiterOptions {
  limit: number;
  timeWindowMs: number;
}

export class RateLimiter {
  #clock: Clock;
  #timestampsByHostname = new LruCache<string, number[]>({
    size: 100_000,
  });

  #limit: number;
  #timeWindowMs: number;

  constructor(clock: Clock, options: RateLimiterOptions) {
    this.#clock = clock;
    this.#limit = options.limit;
    this.#timeWindowMs = options.timeWindowMs;
  }

  isAllowed(hostname: string) {
    const currentTime = this.#clock.getTime();
    let timestamps = this.#timestampsByHostname.get(hostname);
    if (timestamps == null) {
      timestamps = [];
      this.#timestampsByHostname.set(hostname, timestamps);
    } else {
      // remove the first timestamp if it's outside the time window
      if (timestamps.length > 0 && currentTime - timestamps[0] > this.#timeWindowMs) {
        timestamps.shift();
      }
    }

    if (timestamps.length < this.#limit) {
      timestamps.push(currentTime);
      return true;
    } else {
      return false;
    }
  }
}
