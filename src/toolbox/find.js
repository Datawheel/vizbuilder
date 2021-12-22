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
