/** A value that is lazy created and expires after a certain time. */
export class LazyExpirableValue<T> {
  readonly #expiryMs: number;
  readonly #createValue: () => Promise<T>;
  readonly #getTime: () => number;

  #creatingValue: Promise<void> | undefined;
  #value: T | undefined;
  #expiryTime = 0;

  constructor(opts: { expiryMs: number; createValue: () => Promise<T>; getTime?: () => number }) {
    this.#expiryMs = opts.expiryMs;
    this.#createValue = opts.createValue;
    this.#getTime = opts.getTime ?? (() => Date.now());
  }

  async getValue() {
    if (this.#creatingValue) {
      await this.#creatingValue;
    }

    const currentTime = this.#getTime();
    if (currentTime > this.#expiryTime) {
      this.#creatingValue = this.#createValue()
        .then(value => {
          this.#expiryTime = this.#getTime() + this.#expiryMs;
          this.#value = value;
        })
        .finally(() => {
          this.#creatingValue = undefined;
        });
      await this.#creatingValue;
    }

    return this.#value!;
  }
}
