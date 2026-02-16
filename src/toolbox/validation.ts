import type {Aggregator, TesseractMeasure} from "@datawheel/logiclayer-client";

/**
 * Returns the first number it finds in a `string`, else returns `elseValue`.
 * @param string The string to test
 * @param elseValue A value to return in case the string doesn't contain any
 */
export function findFirstNumber(string: string, elseValue?: number) {
  const match = `${string}`.match(/[0-9.,]+/);
  return match ? Number.parseFloat(match[0]) : elseValue || 0;
}

/**
 * Checks if a Tesseract measure is summable.
 * This is determined by checking its units of measurement against a list of
 * non-summable unit keywords.
 * @param measure The measure to check.
 * @returns A boolean indicating if the measure is summable.
 */
export function isSummableMeasure(measure: TesseractMeasure): boolean {
  const aggregator = measure.annotations.aggregation_method || measure.aggregator;
  const units = measure.annotations.units_of_measurement || "";
  return (
    aggregatorIn(aggregator, ["SUM", "COUNT"]) &&
    !["Percentage", "Rate", "Ratio", "Index", "Growth"].some(token =>
      units.includes(token),
    )
  );
}

/**
 * Typeguard to check if an aggregator is part of a certain set.
 * @param aggregator The aggregator to check.
 * @param set The list of aggregators to check against.
 * @returns A boolean indicating if the aggregator is in the set.
 */
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
 * Tries to guess if the elements in a list of strings are related to a number.
 * Useful to sort by that number.
 * @param list An array of string to determine
 */
export function areKindaNumeric(list: number[] | string[], tolerance = 0.8) {
  const numericReducer = (sum, item) =>
    sum + (isNumeric(findFirstNumber(item, Number.NaN)) ? 1 : 0);
  return list.reduce(numericReducer, 0) / list.length > tolerance;
}

/**
 * Determines if an object is a valid finite number.
 */
export function isNumeric(n: string | number): boolean {
  const value = typeof n === "string" ? Number.parseFloat(n) : n;
  return !Number.isNaN(value) && Number.isFinite(value);
}

/**
 * Determines whether the data, given a certain measure,
 * is either all negative or all positive (zeroes are ignored)
 */
export function dataIsSignConsistent<T extends {}>(data: T[], column: string): boolean {
  if (!Array.isArray(data) || data.length === 0) return false;

  let isPositive = true;
  let isNegative = true;

  for (let i = 0; i < data.length; i++) {
    const value = data[i][column];
    if (typeof value !== "number") {
      return false;
    }
    if (value < 0) {
      isPositive = false;
    }
    if (value > 0) {
      isNegative = false;
    }
  }

  return isPositive || isNegative;
}
