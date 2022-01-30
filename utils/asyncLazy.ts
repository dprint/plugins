export function createAsyncLazy<T>(create: () => Promise<T>) {
  let value: T | undefined;
  return {
    async get() {
      if (value == null) {
        value = await create();
      }
      return value;
    },
  };
}
