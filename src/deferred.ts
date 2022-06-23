export interface Deferred<T = void> {
  resolve(value: T): void;
  reject(reason: unknown): void;
  promise: Promise<T>;
  readonly settled: boolean;
}

export function deferred<T = void>(): Deferred<T> {
  let resolve: Deferred<T>["resolve"] | undefined = undefined,
    reject: Deferred<T>["reject"] | undefined = undefined,
    settled = false;
  const promise = new Promise<T>((resolveFn, rejectFn) => {
    resolve = (value) => {
      settled = true;
      resolveFn(value);
    };
    reject = reason => {
      settled = true
      rejectFn(reason);
    };
  });
  ok(resolve);
  ok(reject);
  return {
    get settled() {
      return settled;
    },
    resolve,
    reject,
    promise,
  };
}

function ok(value: unknown): asserts value {
  if (!value) {
    throw new Error("Value not provided");
  }
}
