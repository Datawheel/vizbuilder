import type {Aggregator, TesseractMeasure} from "../schema";
import {findFirstNumber} from "./find";

export function aggregatorIn<T extends Uppercase<`${Aggregator}`> | "MOE" | "RCA">(
  aggregator: Aggregator | string,
  set: T[],
): aggregator is T {
  return isOneOf(aggregator.toUpperCase(), set);
}

/**
 * Checks if the provided string matches one of the options.
 */
export function isOneOf<T extends string>(
  str: string | undefined,
  options: T[],
): str is T {
  return options.includes(str as T);
}

/**
 * Type guard to establish if an unknown key belongs in a certain object.
 */
export function isIn<T extends {}>(
  property: string | number | symbol,
  container: T,
): property is keyof T {
  return Object.prototype.hasOwnProperty.call(container, property);
}

/**
 * Type guard to establish if a certain key is present in an unknown object.
 */
export function hasProperty<T extends {}, U extends string | number | symbol>(
  container: T,
  property: U,
): container is T & {[K in U]: unknown} {
  return (
    typeof container === "object" &&
    container != null &&
    Object.hasOwn(container, property)
  );
}

/**
 * Tries to guess if the elements in a list of strings are related to a number.
 * Useful to sort by that number.
 * @param list An array of string to determine
 */
export function areKindaNumeric(list: string[], tolerance = 0.8) {
  const numericReducer = (sum, item) =>
    sum + (isNumeric(findFirstNumber(item, Number.NaN)) ? 1 : 0);
  return list.reduce(numericReducer, 0) / list.length > tolerance;
}

/**
 * Determines if an object is a valid finite number.
 */
export function isNumeric(n: string): boolean {
  return !isNaN(Number.parseFloat(n)) && isFinite(n);
}

/**
 * Determines whether the data, given a certain measure,
 * is either all negative or all positive (zeroes are ignored)
 */
export function dataIsSignConsistent(data: object[], measure: TesseractMeasure): boolean {
  if (!Array.isArray(data) || !data.length) return false;
  let isPositive = null;
  return data.every(d => {
    const val = d[measure.caption];
    if (isPositive === null) {
      if (val !== 0) isPositive = val > 0;
      return true;
    }
    return isPositive ? val >= 0 : val <= 0;
  });
}
