// Bounded LRU with single-flight misses. Clearing also detaches in-flight work:
// an old generation must never repopulate a newly loaded model's cache.
export class BoundedCache {
    constructor(limit = 1000) {
        this.limit = limit;
        this.values = new Map();
        this.pending = new Map();
    }
    clear() {
        this.values.clear();
        this.pending = new Map();
    }
    set(key, value) {
        this.values.delete(key);
        this.values.set(key, value);
        while (this.values.size > this.limit) this.values.delete(this.values.keys().next().value);
    }
    move(source, target) {
        if (!this.values.has(source)) return;
        const value = this.values.get(source);
        this.values.delete(source);
        this.set(target, value);
    }
    pull(key, resolve) {
        if (this.values.has(key)) {
            const value = this.values.get(key);
            this.set(key, value);
            return Promise.resolve(value);
        }
        if (this.pending.has(key)) return this.pending.get(key);
        if (!resolve) return Promise.resolve(undefined);
        const pending = this.pending;
        const promise = Promise.resolve().then(resolve).then(value => {
            if (pending === this.pending) this.set(key, value);
            return value;
        }).finally(() => pending.delete(key));
        pending.set(key, promise);
        return promise;
    }
}
