/**
 * Sorting module
 * Functions in this module can be classified in 2 groups:
 * - sort functions, which receive a list and parameters, and return the sorted list.
 * - sorter functions, which generate functions compatible with the Array.prototype.sort method.
 */

import {findFirstNumber} from "./find";
import {areKindaNumeric} from "./validation";

/**
 * @template {number} T
 * @param {T[]} list
 * @param {boolean} [desc]
 */
export function sortNumbers(list, desc = false) {
  const sorterFn = desc
    ? (a, b) => a - b
    : (a, b) => b - a;
  return list.slice().sort(sorterFn);
}

/**
 * @template T
 * @param {T[]} list
 * @param {boolean} [desc]
 */
export function sortLabels(list, desc = false) {
  const sorterFn = desc
    ? (a, b) => "".localeCompare.call(a || "", b || "")
    : (a, b) => "".localeCompare.call(b || "", a || "");
  return list.slice().sort(sorterFn);
}

/**
 * Generates a sorter function for a list of objects based on their `key`
 * property. It tries to apply a natural sorting if the property is numeric.
 * @param {string} key The key to the property to be used as comparison string.
 * @param {string[] | number[]} members A list of members the function will work with.
 */
export function sorterByCustomKey(key, members) {
  return areKindaNumeric(members)
    ? (a, b) => findFirstNumber(a[key]) - findFirstNumber(b[key])
    : (a, b) => "".localeCompare.call(a[key] || "", b[key] || "");
}
