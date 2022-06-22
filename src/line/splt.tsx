import {children, h, name as nodeName} from "@virtualstate/focus";
import {Deferred, deferred} from "../deferred";
import {ok} from "../like";
import {TheAsyncThing, anAsyncThing} from "@virtualstate/promise/the-thing";

export interface SplitIterable extends Iterable<TheAsyncThing>, AsyncIterable<unknown> {

}

export interface Split extends SplitIterable {
    readonly [key: string]: TheAsyncThing;
}

export type Name = string | symbol;

export interface SplitOptions {
    known?: Name[];
    max?: number;
}

export function split(input: unknown, options?: SplitOptions): Split {
    let listeners: Deferred<unknown>[];

    let namedListeners: Map<Name, Deferred<unknown>>;

    let splitPromise: Promise<void>,
        spinning = false,
        settled = false;

    let mainListener: Deferred<unknown>;

    function init() {
        listeners = [];
        mainListener = deferred();
        void mainListener.promise.catch(error => void error);
        namedListeners = new Map();
        spinning = false;
        settled = false;
    }

    function tryInitIfComplete() {
        const all = [
            ...listeners,
            ...namedListeners.values()
        ]
            .filter(Boolean);
        if (!all.length) {
            init();
        }
    }

    init();

    function spin() {
        if (spinning) return;
        spinning = true;
        splitPromise = spinSplit().catch((error: unknown) => void error)
    }

    async function spinSplit() {
        try {
            const results = await children(input);
            settled = true;
            if (namedListeners.size) {
                const namedResults: Record<string | symbol, unknown> = Object.fromEntries(
                    results
                        .map(node => [nodeName(node), node])
                );
                for (const [name, listener] of namedListeners.entries()) {
                    listener?.resolve(namedResults[name]);
                }
            }
            for (const [index, listener] of Object.entries(listeners)) {
                listener?.resolve(results[index]);
            }
            mainListener.resolve(results);
        } catch (error) {
            settled = true;
            mainListener.reject(error);
            for (const listener of Object.values(listeners)) {
                listener?.reject(error);
            }
            for (const listener of namedListeners.values()) {
                listener?.reject(error);
            }
        }
    }

    function getNamedListener(name: Name) {
        const existing = namedListeners.get(name);
        if (existing) {
            return existing;
        }
        const listener = deferred<unknown>();
        namedListeners.set(name, listener);
        return listener;
    }

    function getNamedNode(name: Name) {
        void getNamedListener(name);
        return anAsyncThing({
            async *[Symbol.asyncIterator]() {
                const listener = getNamedListener(name);
                spin();
                yield listener.promise;
                if (namedListeners.get(name)?.promise === listener.promise) {
                    namedListeners.delete(name);
                }
                tryInitIfComplete();
            }
        });
    }

    function getListener(index: number) {
        const existing = listeners[index];
        if (existing) {
            return existing;
        }
        const listener = deferred<unknown>();
        listeners[index] = listener;
        return listener;
    }

    function getIndexedNode(index: number) {
        void getListener(index);
        return anAsyncThing({
            async *[Symbol.asyncIterator]() {
                const listener = getListener(index);
                spin();
                yield listener.promise;
                if (listeners[index]?.promise === listener.promise) {
                    listener[index] = undefined;
                }
                tryInitIfComplete();
            }
        });
    }

    const iterableSplit: SplitIterable = {
        async *[Symbol.asyncIterator]() {
          spin();
          yield await mainListener.promise;
          tryInitIfComplete();
        },
        [Symbol.iterator](): Iterator<TheAsyncThing> {
            ok(!settled, "Already settled");
            function *withIndex(index: number): Iterable<TheAsyncThing> {
                if (options?.max === index) {
                    return;
                }
                yield getIndexedNode(index);
                yield * withIndex(index + 1);
            }
            return withIndex(0)[Symbol.iterator]();
        }
    };

    const proxy = new Proxy(iterableSplit, {
        get(target: unknown, p: Name) {
            if (p === Symbol.iterator) {
                return iterableSplit[Symbol.iterator].bind(iterableSplit);
            }
            if (p === Symbol.asyncIterator) {
                return iterableSplit[Symbol.asyncIterator].bind(iterableSplit);
            }
            if (typeof p === "string" && /^\d+$/.test(p)) {
                return getIndexedNode(+p);
            }
            if (!options?.known || options.known.includes(p)) {
                return getNamedNode(p);
            }
            return undefined;
        }
    });
    ok<Split>(proxy);
    return proxy;
}