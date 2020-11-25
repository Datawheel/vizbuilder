import {DimensionType} from "@datawheel/olap-client";
import {findFirstNumber} from "./find";

/**
 * Tries to guess if the elements in a list of strings are related to a number.
 * Useful to sort by that number.
 * @param {string[]} list An array of string to determine
 */
export function areKindaNumeric(list, tolerance = 0.8) {
  const numericReducer = (sum, item) => sum + (isNumeric(findFirstNumber(item)) ? 1 : 0);
  return list.reduce(numericReducer, 0) / list.length > tolerance;
}

/**
 * @param {import("@datawheel/olap-client").Level} level
 * @returns {boolean}
 */
export function isGeographicLevel(level) {
  return level.dimension.dimensionType === DimensionType.Geographic;
}

/**
 * @param {import("@datawheel/olap-client").Level} level
 * @returns {boolean}
 */
export function isTimeLevel(level) {
  return level.dimension.dimensionType === DimensionType.Time;
}

/**
 * Determines if an object is a valid finite number.
 * @param {any} n object to check
 */
export function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
