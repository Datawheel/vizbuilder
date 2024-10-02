import type {TesseractMeasure} from "../schema";
import type {Formatter} from "../structs";
import {isCutItem} from "./validation";

/**
 * @param {OlapClient.Query} query
 * @param {} [formatters]
 * @returns {QueryParams}
 */
export function buildQueryParams(
  query: Query,
  formatters:
    | ((measure: TesseractMeasure | string) => Formatter)
    | Record<string, Formatter> = {},
) {
  /**
   * @param {OlapClient.Measure | string} measure
   * @returns {Vizbuilder.Formatter}
   */
  const getFormatter =
    typeof formatters === "function"
      ? formatters
      : measure => {
          const name = typeof measure === "string" ? measure : measure.name;
          return formatters[name];
        };

  return {
    locale: query.getParam("locale"),
    booleans: query.getParam("options"),
    cuts: query
      .getParam("cuts")
      .map(item =>
        !Level.isLevel(item.drillable)
          ? null
          : {
              ...item.drillable.descriptor,
              members: item.members,
            },
      )
      .filter(isCutItem),
    drilldowns: query
      .getParam("drilldowns")
      .filter(Level.isLevel)
      .map(item => ({
        dimension: item.dimension.name,
        hierarchy: item.hierarchy.name,
        level: item.uniqueName,
      })),
    filters: query.getParam("filters").map(item => ({
      measure: typeof item.measure === "string" ? item.measure : item.measure.name,
      constraint1: item.const1,
      constraint2: item.const2,
      joint: item.joint,
      formatter: getFormatter(item.measure),
    })),
    measures: query.getParam("measures").map(item => ({
      measure: item.name,
      formatter: getFormatter(item),
    })),
  };
}
