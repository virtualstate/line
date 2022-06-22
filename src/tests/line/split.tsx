import {h, createFragment, children, toJSON, descendants, descendantsSettled} from "@virtualstate/focus";
import {ok, split} from "@virtualstate/line";


const fragment = (
    <>
        <named />
        {true}
        {false}
        {1}
        {2}
    </>
)
const fragmentSplit = split(fragment);
const [named, a, b, c, d] = fragmentSplit;
const { named: namedNode } = fragmentSplit;

console.log(
    await children(named),
    await children(a),
    await children(b),
    await children(c),
    await children(d),
    await namedNode
);

async function *Component() {

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
            }
        },
        <named />
    ];

    console.groupEnd();
}

const node = split(<Component />)

const [randomNumber] = node;

const [, innerResult, asyncRandomNumber] = node;

console.log({ randomNumber, innerResult, asyncRandomNumber });
console.log({
    asyncRandomNumber: await children(asyncRandomNumber)
});
console.log("After loaded");
console.log({
    randomNumber: await children(randomNumber),
    innerResult: await children(innerResult),
    asyncRandomNumber: await children(asyncRandomNumber),
    all: await children(node)
});

const next = split(<Component />);

const { 2: asyncRandom2, named: nextNamed } = next;

console.log({ asyncRandom2, nextNamed });

console.log({
    asyncRandom2: await children(asyncRandom2),
    nextNamed: await children(nextNamed),
    all: await children(next)
});

async function *View(options: unknown) {
    console.group("Running View, before async");
    await new Promise<void>(queueMicrotask);
    async function Options() {
        console.log("Running View inner");
        await new Promise<void>(queueMicrotask);
        return (
            <script type="application/json" id="options">{JSON.stringify(options)}</script>
        )
    }
    console.log("After View async");
    yield [
        <config>
            <key value={1} />
            <up down />
            <Options />
        </config>,
        <web>
            <p>Hello!</p>
            <Options />
        </web>
    ];
    console.groupEnd()
}

const { config, web } = split(<View given={Math.random()} />);

const configNode = await config;

console.log("Have config");

const configJSON = await toJSON(configNode, {
    flat: true
})

console.log(configJSON);
console.log(await descendantsSettled(web));


const max = split(<Component />, {
    max: 1
});

const [max1, max2] = max;

console.log({ max1, max2 });

ok(max1);
ok(!max2);
