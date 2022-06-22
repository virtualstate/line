import {h, createFragment, children} from "@virtualstate/focus";
import { split } from "@virtualstate/line";


const fragment = (
    <>
        <named />
        {true}
        {false}
        {1}
        {2}
    </>
)
const [named, a, b, c, d] = split(fragment);

console.log(
    await children(named),
    await children(a),
    await children(b),
    await children(c),
    await children(d),
);

async function *Component() {
    await new Promise<void>(queueMicrotask);

    async function Inner() {
        await new Promise<void>(queueMicrotask);
        return "Inner Result";
    }

    yield [
        Promise.resolve(Math.random()),
        <Inner />,
        {
            async *[Symbol.asyncIterator]() {
                yield Math.random();
            }
        }
    ];
}

const node = <Component />
const [randomNumber, innerResult, asyncRandomNumber] = split(node);

console.log({ randomNumber, innerResult, asyncRandomNumber });
console.log({
    randomNumber: await children(randomNumber),
    innerResult: await children(innerResult),
    asyncRandomNumber: await children(asyncRandomNumber),
    all: await children(node)
});