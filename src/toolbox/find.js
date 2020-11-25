import {formatAbbreviate} from "d3plus-format";
import {sortNumbers} from "./sort";

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
 * @param {number[]} timelist An array with time-related members
 */
export function findHigherCurrentPeriod(timelist) {
  // TODO: prepare it to handle months, days, etc
  const currentTime = new Date().getFullYear();
  return sortNumbers(timelist, false).find(time => time <= currentTime) || timelist[0];
}

/**
 * @param {import("@datawheel/olap-client").Cube} cube
 * @param {VizBldr.Struct.DrilldownItem | VizBldr.Struct.CutItem} item
 * @returns {import("@datawheel/olap-client").Level | undefined}
 */
export function findLevelInCube(cube, item) {
  const {dimension: dimName, hierarchy: hieName, level: lvlName} = item;
  for (const level of cube.levelIterator) {
    if (level.name === lvlName || level.uniqueName === lvlName || level.fullName === lvlName) {
      if ((!dimName || dimName === level.dimension.name) && (!hieName || hieName === level.hierarchy.name)) {
        return level;
      }
    }
  }
  return undefined;
}

/**
 * @param {import("@datawheel/olap-client").Cube} cube
 * @param {VizBldr.Struct.MeasureItem} item
 * @returns {VizBldr.Struct.MeasureSet | undefined}
 */
export function findMeasuresInCube({measuresByName}, item) {
  if (!measuresByName[item.measure]) {
    return undefined;
  }
  else if (item.moe && item.moe in measuresByName) {
    return {
      collection: measuresByName[`${item.collection}`],
      formatter: item.formatter || formatAbbreviate,
      measure: measuresByName[item.measure],
      moe: measuresByName[`${item.moe}`],
      source: measuresByName[`${item.source}`]
    };
  }
  else {
    return {
      collection: measuresByName[`${item.collection}`],
      formatter: item.formatter || formatAbbreviate,
      lci: measuresByName[`${item.lci}`],
      measure: measuresByName[item.measure],
      source: measuresByName[`${item.source}`],
      uci: measuresByName[`${item.uci}`]
    };
  }
}
