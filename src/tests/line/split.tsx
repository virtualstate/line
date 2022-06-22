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

const node = split(<Component />);

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

const next = split(<Component />);

const { 2: asyncRandom2, named: nextNamed } = next;

// console.log({ asyncRandom2, nextNamed });

console.log({
  asyncRandom2: await asyncRandom2,
  nextNamed: await nextNamed,
  all: await children(next),
});

async function* View(options: unknown) {
  console.group("Running View, before async");
  await new Promise<void>(queueMicrotask);
  async function Options() {
    console.log("Running View inner");
    await new Promise<void>(queueMicrotask);
    return (
      <script type="application/json" id="options">
        {JSON.stringify(options)}
      </script>
    );
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
    </web>,
  ];
  console.groupEnd();
}

const { config, web } = split(<View given={Math.random()} />);

const configNode = await config;

console.log("Have config");

console.log(
  Object.fromEntries(
    [...(await children(configNode))].map((node) => [
      name(node),
      name(node) === "script" ? node : properties(node),
    ])
  )
);
console.log(await descendantsSettled(web));

const max = split(<Component />, {
  max: 1,
});

const [max1, max2] = max;

console.log({ max1, max2 });

ok(max1);
ok(!max2);
