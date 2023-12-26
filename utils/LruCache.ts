export class LruCacheSet<TKey> {
  #inner: LruCache<TKey, true>;

  constructor(options: { size: number }) {
    this.#inner = new LruCache({ size: options.size });
  }

  has(key: TKey) {
    return this.#inner.get(key) != null;
  }

  insert(key: TKey) {
    this.#inner.set(key, true);
  }
}

interface LruCacheNode<TKey, TValue> {
  key: TKey;
  value: TValue;
  prev?: LruCacheNode<TKey, TValue>;
  next?: LruCacheNode<TKey, TValue>;
}

export class LruCache<TKey, TValue> {
  readonly #size: number;
  #map = new Map<TKey, LruCacheNode<TKey, TValue>>();
  #head: LruCacheNode<TKey, TValue> | undefined;
  #tail: LruCacheNode<TKey, TValue> | undefined;

  constructor(options: { size: number }) {
    this.#size = options.size;
  }

  get(key: TKey) {
    const node = this.#map.get(key);
    if (node) {
      this.#moveToFront(node);
      return node.value;
    }
    return undefined;
  }

  set(key: TKey, value: TValue) {
    let node = this.#map.get(key);

    if (node) {
      node.value = value;
      this.#moveToFront(node);
    } else {
      node = { key, value };
      if (this.#map.size === this.#size) {
        this.#removeLeastRecentlyUsed();
      }
      this.#map.set(key, node);
      this.#addToFront(node);
    }
  }

  remove(key: TKey) {
    const node = this.#map.get(key);
    if (node) {
      this.#removeNode(node);
      this.#map.delete(key);
    }
  }

  #removeNode(node: LruCacheNode<TKey, TValue>) {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.#head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.#tail = node.prev;
    }
  }

  #removeLeastRecentlyUsed(): void {
    if (!this.#tail) return;

    this.#map.delete(this.#tail.key);
    this.#removeNode(this.#tail);
  }

  #addToFront(node: LruCacheNode<TKey, TValue>): void {
    if (!this.#head) {
      this.#head = node;
      this.#tail = node;
      return;
    }
    node.next = this.#head;
    this.#head.prev = node;
    this.#head = node;
  }

  #moveToFront(node: LruCacheNode<TKey, TValue>): void {
    if (node === this.#head) return;

    this.#removeNode(node);
    this.#addToFront(node);
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

  async getOrSet(key: TKey, trySet: () => Promise<TValue>) {
    // this needs to be resilient to failure (ex. GitHub going down),
    // so if something fails just use the previously cached value
    const expirableValue = this.#inner.get(key);
    if (expirableValue != null) {
      if (this.#getTime() > expirableValue.expiry) {
        try {
          const newValue = await trySet();
          this.#set(key, newValue);
          return newValue;
        } catch (err) {
          console.error("Updating cache failed. Using old value.", err);
          return expirableValue.value;
        }
      } else {
        return expirableValue.value;
      }
    } else {
      const newValue = await trySet();
      this.#set(key, newValue);
      return newValue;
    }
  }

  #set(key: TKey, value: TValue) {
    this.#inner.set(key, {
      expiry: this.#getTime() + this.#expiryMs,
      value,
    });
  }
}
