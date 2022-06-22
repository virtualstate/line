/* c8 ignore start */
import {isStaticChildNode, isUnknownJSXNode, name} from "@virtualstate/focus";
import {isArray} from "./is";

export function isLike<T>(value: unknown, ...and: unknown[]): value is T {
  if (!and.length) return !!value;
  return !!value && and.every((value) => !!value);
}

export function ok(value: unknown, message?: string): asserts value;
export function ok<T>(value: unknown, message?: string): asserts value is T;
export function ok(value: unknown, message?: string): asserts value {
  if (!value) {
    throw new Error(message ?? "Expected value");
  }
}

export function isBooleanTrueArray(array: unknown): array is true[] {
  return isArray(array) && array.every(value => value === true);
}

export function isBooleanFalseArray(array: unknown): array is true[] {
  return isArray(array) && array.every(value => value === false);
}

export function isBooleanArray(array: unknown): array is boolean[] {
  return isArray(array) && array.every(value => typeof value === "boolean")
}

export function isTruthy(input: unknown) {
  if (isStaticChildNode(input)) {
    return !!input;
  }
  if (!input) return false;
  // If it's not a node we don't know what it is
  if (!isUnknownJSXNode(input)) {
    return false;
  }
  // console.log(input)
  // Expect a name to exist if we have a value and
  ok(name(input), "Expected name for truthy value");
  return true;
}
