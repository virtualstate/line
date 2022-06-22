import {children, h} from "@virtualstate/focus";
import {deferred} from "../deferred";

export interface Split extends Iterable<AsyncIterable<unknown>> {
    readonly size: number;
}

interface ListenerFn {
    (value: unknown): void;
}

export function split(input: unknown): Split {
    let size = 0;

    const listeners: ListenerFn[] = [];

    return {
        *[Symbol.iterator]() {
            const index = size;
            size += 1;
            const { promise, resolve } = deferred<unknown>()
            if (index > 0) {
                listeners.push(resolve);
            }
            yield {
                async *[Symbol.asyncIterator]() {
                    if (index !== 0) {
                        listeners.push(resolve);
                        return yield await promise;
                    } else {
                        const results = await children(input);
                        if (results.length === size) {
                            for (const [index, result] of Object.entries(results.slice(1))) {
                                listeners[index](result);
                            }
                            yield results[0];
                        }
                    }
                }
            }
            yield * this;
        },
        get size() {
            return size;
        }
    };
}