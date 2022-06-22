import { children, h } from "@virtualstate/focus";
import { ok } from "../like";

export interface Rest extends AsyncIterable<unknown> {
  promise: Promise<unknown[]>;
}

export function rest(input: unknown): Rest {
  let resolve: (value: unknown[]) => void;
  const promise = new Promise<unknown[]>((fn) => {
    resolve = fn;
  });
  ok(resolve);
  return {
    async *[Symbol.asyncIterator]() {
      const [value, ...rest] = await children(input);
      ok(rest.length);
      resolve(rest);
      yield value;
    },
    promise,
  };
}
