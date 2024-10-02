import {formatAbbreviate} from "d3plus-format";
import {keyBy} from "lodash";
import type {TesseractCube} from "../schema";
import type {MeasureSet} from "../structs";
import type {MeasureItem} from "../structs";

/**
 * Returns the first number it finds in a `string`, else returns `elseValue`.
 * @param string The string to test
 * @param elseValue A value to return in case the string doesn't contain any
 */
export function findFirstNumber(string: string, elseValue?: number) {
  const match = `${string}`.match(/[0-9\.\,]+/);
  return match ? Number.parseFloat(match[0]) : elseValue || 0;
}

/** */
export function findMeasuresInCube(cube: TesseractCube, item: MeasureItem): MeasureSet | undefined {
  const measuresByName = keyBy(cube.measures, "name");
  const measure = measuresByName[item.measure];
  if (!measure) {
    return undefined;
  }
  if (item.moe && item.moe in measuresByName) {
    return {
      collection: measuresByName[`${item.collection}`],
      formatter: item.formatter || formatAbbreviate,
      measure,
      moe: measuresByName[`${item.moe}`],
      source: measuresByName[`${item.source}`],
    };
  }
  return {
    collection: measuresByName[`${item.collection}`],
    formatter: item.formatter || formatAbbreviate,
    lci: measuresByName[`${item.lci}`],
    measure,
    source: measuresByName[`${item.source}`],
    uci: measuresByName[`${item.uci}`],
  };
}

/**
 * Finds the min and max time properties of an array of data objects
 * @param data - data to search
 * @param timeLevelId - property name of time field to compare
 * @param timeLevelName - name of time level to return (if it exists) to make for a better display name than the ID
 * @returns  - the display strings of the min and max time fields
 */
export function findTimeRange(
  data: object[],
  timeLevelId: string,
  timeLevelName: string,
): {minTime: string; maxTime: string} {
  if (!data || !data.length || !timeLevelId) return {minTime: null, maxTime: null};

  const out = data.reduce(
    (acc, d) => {
      if (d[timeLevelId] < acc.min[timeLevelId]) acc.min = d;
      if (d[timeLevelId] > acc.max[timeLevelId]) acc.max = d;
      return acc;
    },
    {max: data[0], min: data[0]},
  );

  return {
    minTime: getDisplayTime(out.min, timeLevelId, timeLevelName).toString(),
    maxTime: getDisplayTime(out.max, timeLevelId, timeLevelName).toString(),
  };

  function getDisplayTime(d: any, timeLevelId: string, timeLevelName: string) {
    return d[timeLevelName] || d[timeLevelId];
  }
}
