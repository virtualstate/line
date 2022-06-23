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
import {add} from "cheerio/lib/api/traversing";

{

  const fragment = (
      <>
        <named/>
        {true}
        {false}
        {1}
        {2}
      </>
  );
  const fragmentSplit = split(fragment);
  const [namedNode, a, b, c, d] = fragmentSplit;
  const {named} = fragmentSplit;

  console.log(await named);

  console.log(await namedNode, await a, await b, await c, await d);

  console.log(await fragmentSplit);

}

{
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
      <Inner/>,
      {
        async* [Symbol.asyncIterator]() {
          console.log("Running asyncIterator");
          yield Math.random();
        },
      },
      <named/>,
    ];

    console.groupEnd();
  }

  const node = split(<Component/>, {
    keep: true
  });

  const [randomNumber] = node;

  const [, innerResult, asyncRandomNumber] = node;

  console.log({randomNumber, innerResult, asyncRandomNumber});
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

  const {2: asyncRandom1, named: nodeNamed} = node;

  ok(!nodeNamed, "keep was used, no named node should be available after first resolve");

  console.log({asyncRandom1, nodeNamed});

  console.log({
    asyncRandom1: await asyncRandom1,
    nodeNamed: await nodeNamed,
    all: await children(node),
  });

  const next = split(<Component/>);

  const {2: asyncRandom2, named: nextNamed} = next;

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
        <key value={1}/>
        <up down/>
        <Options/>
      </config>,
      <web>
        <p>Hello!</p>
        <Options/>
      </web>,
    ];
    console.groupEnd();
  }

  const {config, web} = split(<View given={Math.random()}/>, {
    keep: true
  });
  const {key, up, script} = jump(config);
  const {script: webScript} = jump(web);


  console.log({
    key: properties(await key),
    up: properties(await up),
    script: await jump(script)[0],
    webScript: await jump(webScript)[0]
  });

  console.log(await descendantsSettled(web));

  const max = split(<Component />, {
    max: 1,
  });

  const [max1, max2] = max;

  console.log({ max1, max2 });

  ok(max1);
  ok(!max2);
}

{
  const { named, unnamed } = split(
      <>
        <named />
        <unnamed />
      </>,
      {
        known: [
          "named"
        ]
      }
  );
  console.log({ named, unnamed });
  ok(named);
  ok(!unnamed);
}

{

  const almostKey = Math.random();

  async function Thrower() {

    async function *Throw() {
      yield <h1 />;
      throw "nope";
    }

    return (
        <>
          <almost key={almostKey} />
          <maybe>
            <Throw />
          </maybe>
        </>
    )
  }

  const [ { status: s1 }] = await Promise.allSettled([
    (async () => {


      const { almost, maybe } = split(<Thrower />);

      const inner = jump(maybe)

      ok(properties(await almost).key === almostKey);

      console.log(await inner);
      // Should not get here

    })()
  ])
  ok(s1 === "rejected", `Got ${s1}`);



  const [ { status: s2 }] = await Promise.allSettled([
    (async () => {


      const { almost, maybe } = split(<Thrower />);

      const [inner] = jump(maybe)

      ok(properties(await almost).key === almostKey);

      console.log(await inner);
      // Should not get here

    })()
  ])
  ok(s2 === "rejected", `Got ${s2}`);


  const [ { status: s3 }] = await Promise.allSettled([
    (async () => {


      const { almost, maybe } = split(<Thrower />);

      const { ha } = jump(maybe)

      ok(properties(await almost).key === almostKey);

      console.log(await ha);
      // Should not get here

    })()
  ])
  ok(s3 === "rejected", `Got ${s3}`);

  const [ { status: s4 }] = await Promise.allSettled([
    (async () => {


      const { almost, maybe } = split(<Thrower />, {
         keep: true
      });

      const { ha } = jump(maybe, {
        keep: true
      });

      ok(properties(await almost).key === almostKey);

      console.log(await ha);
      // Should not get here

    })()
  ])
  ok(s3 === "rejected", `Got ${s4}`);
}

{
  const node = split(<>Value</>, { keep: true });

  function isSame<B>(a: unknown, b: B): a is B {
    return a === b;
  }

  const [indexed] = node;
  ok(indexed);
  ok(isSame(await indexed, "Value"))

  const [{status}] = await Promise.allSettled([
    (async () => {
      const [, addedIndex] = node;
      void addedIndex; // Should not get here
    })()
  ])
  ok(status === "rejected");
}
