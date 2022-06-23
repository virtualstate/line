import {children as base, isFragment} from "@virtualstate/focus";
import {union} from "@virtualstate/union";
import {Split, split} from "./splt";

export function jump(input: unknown): Split {
    return split({
        async * [Symbol.asyncIterator]() {
            for await (const snapshot of base(input)) {
                if (isFragment(input)) {
                    for await (const snapshots of union(
                        snapshot.map(
                            node => base(node)
                        )
                    )) {
                        yield snapshots
                            .filter(Boolean)
                            .flatMap(value => value);
                    }
                } else {
                    yield snapshot;
                }
            }
        }
    })
}