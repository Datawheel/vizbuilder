import {formatAbbreviate} from "d3plus-format";

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

const getDisplayTime = (d, timeLevelId, timeLevelName) => d?.hasOwnProperty(timeLevelName) ? d[timeLevelName] : d?.[timeLevelId];

/**
 * Finds the min and max time properties of an array of data objects
 * @param {object[]} data - data to search
 * @param {string} timeLevelId - property name of time field to compare
 * @param {string} timeLevelName - name of time level to return (if it exists) to make for a better display name than the ID
 * @returns {minTime: string, maxTime: string} - the display strings of the min and max time fields
 */
export function findTimeRange(data, timeLevelId, timeLevelName) {
  if (!(data && data.length && timeLevelId)) return {min: null, max: null};

  const out = data.reduce((acc, d) => {
    if (d[timeLevelId] < acc.min[timeLevelId]) acc.min = d;
    if (d[timeLevelId] > acc.max[timeLevelId]) acc.max = d;
    return acc;
  }, {max: data[0], min: data[0]});

  return {
    minTime: getDisplayTime(out.min, timeLevelId, timeLevelName).toString(),
    maxTime: getDisplayTime(out.max, timeLevelId, timeLevelName).toString()
  };
}
