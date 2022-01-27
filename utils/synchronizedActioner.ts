import { withTimeout } from "./withTimeout.ts";

/** Creates an object that only lets one action execute at a time. */
export function createSynchronizedActioner() {
  let previousPromise: Promise<unknown> = Promise.resolve();

  function doAction<T>(action: () => Promise<T>) {
    const newPromise = inner(previousPromise);
    previousPromise = newPromise;
    return newPromise;

    async function inner(pastPromise: Promise<unknown>) {
      try {
        await pastPromise;
      } catch {
        // ignore
      }

      return await action();
    }
  }

  function doActionWithTimeout<T>(action: (signal: AbortSignal) => Promise<T>, timeoutMs: number) {
    return doAction(() => withTimeout(action, timeoutMs));
  }

  return { doAction, doActionWithTimeout };
}
