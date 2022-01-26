export class LruCache<TKey, TValue> {
  #size: number;
  #map = new Map<TKey, TValue>();
  #recent: TKey[] = [];

  constructor(size: number) {
    this.#size = size;
  }

  get(key: TKey) {
    if (!this.#map.has(key)) {
      return undefined;
    }
    this.#setMostRecentForKey(key);
    return this.#map.get(key);
  }

  #setMostRecentForKey(key: TKey) {
    for (let i = this.#recent.length - 1; i >= 0; i--) {
      if (this.#recent[i] === key) {
        this.#recent.splice(i, 1);
        this.#recent.push(key);
        break;
      }
    }
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
}
