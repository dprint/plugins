export class LruCache<TKey, TValue> {
  #size: number;
  #map = new Map<TKey, TValue>();
  #recent: TKey[] = [];

  constructor(options: { size: number }) {
    this.#size = options.size;
  }

  get(key: TKey) {
    if (!this.#map.has(key)) {
      return undefined;
    }
    this.#setMostRecentForKey(key);
    return this.#map.get(key);
  }

  #setMostRecentForKey(key: TKey) {
    this.#removeFromRecent(key);
    this.#recent.push(key);
  }

  set(key: TKey, value: TValue) {
    if (this.#map.has(key)) {
      this.#setMostRecentForKey(key);
    } else {
      this.#recent.push(key);
      if (this.#recent.length > this.#size) {
        this.#map.delete(this.#recent[0]);
        this.#recent.splice(0, 1);
      }
    }

    this.#map.set(key, value);
  }

  remove(key: TKey) {
    if (this.#map.delete(key)) {
      this.#removeFromRecent(key);
    }
  }

  #removeFromRecent(key: TKey) {
    for (let i = this.#recent.length - 1; i >= 0; i--) {
      if (this.#recent[i] === key) {
        this.#recent.splice(i, 1);
        break;
      }
    }
  }
}

interface ExpirableItem<TValue> {
  value: TValue;
  /** Time this item expires at. */
  expiry: number;
}

export class LruCacheWithExpiry<TKey, TValue> {
  readonly #inner: LruCache<TKey, ExpirableItem<TValue>>;
  readonly #expiryMs: number;
  readonly #getTime: () => number;

  constructor(options: { size: number; expiryMs: number; getTime?: () => number }) {
    this.#inner = new LruCache({ size: options.size });
    this.#expiryMs = options.expiryMs;
    this.#getTime = options.getTime ?? (() => Date.now());
  }

  get(key: TKey) {
    const expirableValue = this.#inner.get(key);
    if (expirableValue != null) {
      if (this.#getTime() > expirableValue.expiry) {
        this.#inner.remove(key);
        return undefined;
      }
    }
    return expirableValue?.value;
  }

  set(key: TKey, value: TValue) {
    this.#inner.set(key, {
      expiry: this.#getTime() + this.#expiryMs,
      value,
    });
  }
}