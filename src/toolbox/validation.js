import {DimensionType} from "@datawheel/olap-client";
import {findFirstNumber} from "./find";

/**
 * Tries to guess if the elements in a list of strings are related to a number.
 * Useful to sort by that number.
 * @param {string[]} list An array of string to determine
 */
export function areKindaNumeric(list, tolerance = 0.8) {
  const numericReducer = (sum, item) => sum + (isNumeric(findFirstNumber(item, NaN)) ? 1 : 0);
  return list.reduce(numericReducer, 0) / list.length > tolerance;
}

/**
 * @param {any} obj
 * @returns {obj is Vizbuilder.CutItem}
 */
export function isCutItem(obj) {
  return obj && obj.hasOwnProperty("level") && obj.hasOwnProperty("members");
}

/**
 * @param {OlapClient.Level} level
 * @returns {boolean}
 */
export function isGeographicLevel(level) {
  return level?.dimension?.dimensionType === DimensionType.Geographic;
}

/**
 * Determines if an object is a valid finite number.
 * @param {any} n object to check
 */
export function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * @param {OlapClient.Level} level
 * @returns {boolean}
 */
export function isTimeLevel(level) {
  return level?.dimension?.dimensionType === DimensionType.Time;
}

/**
 * Determines whether the data, given a certain measure, is either all negative or all positive (zeros are treated as neutral)
 * @param {Object[]} data
 * @param {OlapClient.Measure} measure
 * @returns {boolean}
 */
export function dataIsSignConsistent(data, measure) {
  if (!Array.isArray(data) || !data.length) return false;
  let isPositive = null;
  return data.every(d => {
    const val = d[measure.caption];
    if (isPositive === null) {
      if (val !== 0) isPositive = val > 0;
      return true;
    }
    else return isPositive ? val >= 0 : val <= 0;
  });
}
