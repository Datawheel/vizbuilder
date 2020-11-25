import {findFirstNumber} from "./find";
import {areKindaNumeric} from "./validation";

/**
 * @template {number} T
 * @param {T[]} list
 * @param {boolean} [desc]
 */
export function sortNumbers(list, desc = false) {
  return list.sort(desc ? (a, b) => a - b : (a, b) => b - a);
}

/**
 * @template T
 * @param {T[]} list
 * @param {boolean} [desc]
 */
export function sortLabels(list, desc = false) {
  return list.sort(
    desc ? (a, b) => `${a}`.localeCompare(`${b}`) : (a, b) => `${b}`.localeCompare(`${a}`)
  );
}

/**
 * Generates a sorting function to be used in `Array.prototype.sort`,
 * based on a certain key.
 * @param {string} key The key to the property to be used as comparison string
 */
export function sortByCustomKey(key, members) {
  if (areKindaNumeric(members)) {
    return (a, b) => findFirstNumber(a) - findFirstNumber(b);
  }

  return (a, b) => `${a[key]}`.localeCompare(`${b[key]}`);
}
