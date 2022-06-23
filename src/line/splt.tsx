import {children, h, name} from "@virtualstate/focus";
import { Deferred, deferred } from "../deferred";
import { ok } from "../like";
import { TheAsyncThing, anAsyncThing } from "@virtualstate/promise/the-thing";

export interface SplitIterable<T>
  extends Iterable<TheAsyncThing<T>>,
    AsyncIterable<T> {
}

export type Name = string | symbol;

export interface Split extends SplitIterable<unknown[]>, Record<Name, SplitIterable<unknown> & TheAsyncThing> {

}

export interface SplitOptions {
  known?: Name[];
  max?: number;
  keep?: boolean;
}

export function split(input: unknown, options: SplitOptions = {}): Split {
  let listeners: Deferred<unknown[]>[];

  let namedListeners: Map<Name, Deferred<unknown>>;

  let splitPromise: Promise<void>,
    spinning = false,
    settled = false;

  const { known } = options;

  function init() {
    listeners = [];
    namedListeners = new Map();
    spinning = false;
    splitPromise = undefined;
    settled = false;
  }

  init();

  function spin() {
    if (spinning) return splitPromise;
    spinning = true;
    return splitPromise = spinSplit(input);
  }

  async function spinSplit(input: unknown) {
    let results
    try {
      results = await children(input);
      ok(results, "Expected children to be available");
      if (options?.keep) {
        settled = true;
      }
      if (namedListeners.size) {
        const namedResults: Record<string | symbol, unknown> =
          Object.fromEntries(results.map((node) => [name(node), node]));
        for (const [name, listener] of namedListeners.entries()) {
          listener?.resolve(namedResults[name]);
        }
      }
      for (const [index, listener] of Object.entries(listeners)) {
        listener?.resolve(results[index]);
      }
    } catch (error) {
      if (options?.keep) {
        settled = true;
      }
      for (const listener of Object.values(listeners)) {
        listener?.reject(error);
      }
      for (const listener of namedListeners.values()) {
        listener?.reject(error);
      }
      throw error;
    }
    if (!options?.keep) {
      init();
    }
    return results;
  }


  function getNamedListener(name: Name) {
    const existing = namedListeners.get(name);
    if (existing) {
      return existing;
    } else if (settled) {
      return undefined;
    }
    const listener = deferred<unknown[]>();
    void listener.promise.catch(error => void error);
    namedListeners.set(name, listener);
    return listener;
  }

  function getNamedNode(name: Name) {
    let listener = getNamedListener(name);
    if (!listener) return undefined;
    return anAsyncThing({
      async *[Symbol.asyncIterator]() {
        listener = listener ?? getNamedListener(name);
        if (listener) {
          if (!listener.settled) {
            await spin();
          }
          yield listener.promise;
          listener = undefined;
        }
      },
    });
  }

  function getListener(index: number) {
    const existing = listeners[index];
    if (settled) {
      ok(existing, "Already settled, cannot add new listeners");
    }
    if (existing) {
      return existing;
    }
    const listener = deferred<unknown[]>();
    void listener.promise.catch(error => void error);
    listeners[index] = listener;
    return listener;
  }

  function getIndexedNode(index: number) {
    let listener = getListener(index);
    return anAsyncThing({
      async *[Symbol.asyncIterator]() {
        listener = listener ?? getListener(index);
        if (listener) {
          if (!listener.settled) {
            await spin();
          }
          yield listener.promise;
          listener = undefined;
        }
      },
    });
  }

  const iterableSplit = {
    async *[Symbol.asyncIterator]() {
      yield spin();
    },
    [Symbol.iterator]() {
      function* withIndex(index: number): Iterable<TheAsyncThing<unknown[]>> {
        if (options?.max === index) {
          return;
        }
        yield getIndexedNode(index);
        yield* withIndex(index + 1);
      }
      return withIndex(0)[Symbol.iterator]();
    },
  };

  const async = anAsyncThing(iterableSplit);

  const proxy = new Proxy(iterableSplit, {
    get(target: unknown, p: Name) {
      if (p in iterableSplit && typeof iterableSplit[p] === "function") {
        return iterableSplit[p].bind(async);
      }
      if (p in async && typeof async[p] === "function") {
        return async[p].bind(async);
      }
      if (typeof p === "string" && /^\d+$/.test(p)) {
        return getIndexedNode(+p);
      }
      if (known?.includes(p) !== false) {
        return getNamedNode(p);
      }
      return undefined;
    },
  });
  ok<Split>(proxy);
  return proxy;
}
