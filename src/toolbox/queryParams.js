import {Level} from "@datawheel/olap-client";
import {asArray} from "./array";

/**
 * @param {import("@datawheel/olap-client").Query} query
 * @param {((measure: import("@datawheel/olap-client").Measure | string) => VizBldr.Formatter) | Record<string, VizBldr.Formatter>} [formatters]
 * @returns {VizBldr.QueryParams}
 */
export function buildQueryParams(query, formatters = {}) {

  /**
   * @param {import("@datawheel/olap-client").Measure | string} measure
   * @returns {VizBldr.Formatter}
   */
  const getFormatter = typeof formatters === "function"
    ? formatters
    : measure => {
      const name = typeof measure === "string" ? measure : measure.name;
      return formatters[name];
    };

  return {
    booleans: query.getParam("options"),
    cuts: [],
    drilldowns: query.getParam("drilldowns")
      .filter(Level.isLevel)
      .map(item => ({
        dimension: item.dimension.name,
        hierarchy: item.hierarchy.name,
        level: item.uniqueName
      })),
    filters: query.getParam("filters").map(item => ({
      measure: typeof item.measure === "string" 
        ? item.measure 
        : item.measure.name,
      constraint1: item.const1,
      constraint2: item.const2,
      joint: item.joint,
      formatter: getFormatter(item.measure)
    })),
    growth: asArray(query.getParam("growth")).map(item => ({
      dimension: item.level.dimension.name,
      hierarchy: item.level.hierarchy.name,
      level: item.level.name,
      measure: item.measure.name
    })),
    measures: query.getParam("measures").map(item => ({
      measure: item.name,
      formatter: getFormatter(item)
    }))
  };
}
