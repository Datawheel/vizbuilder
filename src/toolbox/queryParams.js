import {Level} from "@datawheel/olap-client";
import {isCutItem} from "./validation";

/**
 * @param {OlapClient.Query} query
 * @param {((measure: OlapClient.Measure | string) => VizBldr.Formatter) | Record<string, VizBldr.Formatter>} [formatters]
 * @returns {VizBldr.QueryParams}
 */
export function buildQueryParams(query, formatters = {}) {

  /**
   * @param {OlapClient.Measure | string} measure
   * @returns {VizBldr.Formatter}
   */
  const getFormatter = typeof formatters === "function"
    ? formatters
    : measure => {
      const name = typeof measure === "string" ? measure : measure.name;
      return formatters[name];
    };

  return {
    locale: query.getParam("locale"),
    booleans: query.getParam("options"),
    cuts: query.getParam("cuts")
      .map(item => !Level.isLevel(item.drillable) ? null : {
        ...item.drillable.descriptor,
        members: item.members
      })
      .filter(isCutItem),
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
    measures: query.getParam("measures").map(item => ({
      measure: item.name,
      formatter: getFormatter(item)
    }))
  };
}
