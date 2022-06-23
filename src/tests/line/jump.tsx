/* c8 ignore start */
import {
    h,
    properties,
} from "@virtualstate/focus";
import { ok, split } from "@virtualstate/line";
import {jump} from "../../line/jump";

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
