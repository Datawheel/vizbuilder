/**
 * Sorting module
 * Functions in this module can be classified in 2 groups:
 * - sort functions, which receive a list and parameters, and return the sorted list.
 * - sorterFactory functions, which generate functions compatible with the Array.prototype.sort method.
 */

import {areKindaNumeric, findFirstNumber} from "./validation";

export function sortNumbers<T>(list: T[], desc = false) {
  const sorterFn = desc ? (a, b) => a - b : (a, b) => b - a;
  return list.slice().sort(sorterFn);
}

export function sortLabels<T>(list: T[], desc = false) {
  const sorterFn = desc
    ? (a, b) => "".localeCompare.call(a || "", b || "")
    : (a, b) => "".localeCompare.call(b || "", a || "");
  return list.slice().sort(sorterFn);
}

/**
 * Generates a sorter function for a list of objects based on their `key`
 * property. It tries to apply a natural sorting if the property is numeric.
 * @param property The key to the property to be used as comparison string.
 * @param members A list of members the function will work with.
 */
export function propertySorterFactory(property: string, members: number[] | string[]) {
  return areKindaNumeric(members)
    ? (a, b) => findFirstNumber(a[property]) - findFirstNumber(b[property])
    : (a, b) => "".localeCompare.call(a[property] || "", b[property] || "");
}
