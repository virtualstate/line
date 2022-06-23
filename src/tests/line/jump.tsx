/* c8 ignore start */
import {
    h,
    createFragment,
    children,
    toJSON,
    descendants,
    descendantsSettled,
    name,
    properties,
} from "@virtualstate/focus";
import { ok, split } from "@virtualstate/line";
import {jump} from "../../line/jump";

const fragment = (
    <>
        <named />
        {true}
        {false}
        {1}
        {2}
    </>
);
const fragmentSplit = split(fragment);
const [namedNode, a, b, c, d] = fragmentSplit;
const { named } = fragmentSplit;

console.log(await named);

console.log(await namedNode, await a, await b, await c, await d);

async function* Component() {
    console.group("Running Component, before async");

    await new Promise<void>(queueMicrotask);

    async function Inner() {
        console.log("Running Component inner");
        await new Promise<void>(queueMicrotask);
        return "Inner Result";
    }

    console.log("After Component async");

    yield [
        Promise.resolve(Math.random()),
        <Inner />,
        {
            async *[Symbol.asyncIterator]() {
                console.log("Running asyncIterator");
                yield Math.random();
            },
        },
        <named />,
    ];

    console.groupEnd();
}

const node = split(<Component />, {
    keep: true
});

const [randomNumber] = node;

const [, innerResult, asyncRandomNumber] = node;

console.log({ randomNumber, innerResult, asyncRandomNumber });
console.log({
    asyncRandomNumber: await children(asyncRandomNumber),
});
console.log("After loaded");
console.log({
    randomNumber: await randomNumber,
    innerResult: await innerResult,
    asyncRandomNumber: await asyncRandomNumber,
    all: await children(node),
});

const { 2: asyncRandom1, named: nodeNamed } = node;

console.log({ asyncRandom1, nodeNamed });

console.log({
    asyncRandom1: await asyncRandom1,
    nodeNamed: await nodeNamed,
    all: await children(node),
});

const next = split(<Component />);

const { 2: asyncRandom2, named: nextNamed } = next;

// console.log({ asyncRandom2, nextNamed });

console.log({
    asyncRandom2: await asyncRandom2,
    nextNamed: await nextNamed,
    all: await children(next),
});

async function* View() {
    yield (
        <config>
            <key value={1} />
        </config>
    )
}

const { config } = split(<View />, {
    keep: true
});
const { key } = jump(config);

ok(properties(await key).value === 1);

const { key: key2 } = jump(
    <config>
        <key value={2} />
    </config>
);

ok(properties(await key2).value === 2);

console.log({
    key: await key,
    key2: await key2
});
