import {formatAbbreviate} from "d3plus-format";
import {parseDate} from "./parse";

/**
 * Returns the first number it finds in a `string`, else returns `elseValue`.
 * @param {string} string The string to test
 * @param {number} [elseValue] A value to return in case the string doesn't contain any
 */
export function findFirstNumber(string, elseValue) {
  const match = `${string}`.match(/[0-9\.\,]+/);
  return match ? Number.parseFloat(match[0]) : elseValue || 0;
}

/**
 * Returns the value of the highest timeLevel value in the dataset,
 * but lower or equal than the current time.
 * @param {string[]} timelist An array with time-related members
 */
export function findHigherCurrentPeriod(timelist) {
  const currentTime = new Date().getTime();
  const matchIndex = timelist.reduce((selected, item, index, list) => {
    const itemValue = parseDate(item).getTime();
    if (itemValue <= currentTime) {
      const selectedValue = new Date(list[selected] || -8640000000000000).getTime();
      return Math.max(itemValue, selectedValue) === itemValue ? index : selected;
    }
    return selected;
  }, -1);
  return matchIndex > -1 ? timelist[matchIndex] : timelist[0];
}

/**
 * @param {import("@datawheel/olap-client").Cube} cube
 * @param {VizBldr.Struct.MeasureItem} item
 * @returns {VizBldr.Struct.MeasureSet | undefined}
 */
export function findMeasuresInCube({measuresByName}, item) {
  const measure = measuresByName[item.measure];
  if (!measure) {
    return undefined;
  }
  else if (item.moe && item.moe in measuresByName) {
    return {
      collection: measuresByName[`${item.collection}`],
      formatter: item.formatter || formatAbbreviate,
      measure,
      moe: measuresByName[`${item.moe}`],
      source: measuresByName[`${item.source}`]
    };
  }
  else {
    return {
      collection: measuresByName[`${item.collection}`],
      formatter: item.formatter || formatAbbreviate,
      lci: measuresByName[`${item.lci}`],
      measure,
      source: measuresByName[`${item.source}`],
      uci: measuresByName[`${item.uci}`]
    };
  }
}
