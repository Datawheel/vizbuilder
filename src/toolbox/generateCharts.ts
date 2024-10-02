import flatMap from "lodash/flatMap";
import {chartComponents} from "../components/ChartCard";
import {type ChartLimits, DEFAULT_CHART_LIMITS} from "../constants";
import type {TesseractLevel} from "../schema";
import type {ChartType, D3plusConfig, QueryResult} from "../structs";
import {type Chart, chartRemixer} from "./charts";
import {buildDatagroup} from "./datagroup";

/** */
export function generateCharts(
  queries: QueryResult[],
  options: {
    chartLimits?: ChartLimits;
    chartTypes?: ChartType[];
    datacap?: number;
    topojsonConfig?:
      | Record<string, D3plusConfig>
      | ((level: TesseractLevel) => D3plusConfig);
  },
): Chart[] {
  const chartLimits = {...DEFAULT_CHART_LIMITS, ...options.chartLimits};
  const chartTypes = options.chartTypes || (Object.keys(chartComponents) as ChartType[]);
  const datagroupProps = {
    datacap: options.datacap ?? 2e4,
    getTopojsonConfig: normalizeAccessor(options.topojsonConfig || {}),
  };

  return flatMap(queries, query => {
    const datagroup = buildDatagroup(query, datagroupProps);
    return flatMap(chartTypes, chartType =>
      chartRemixer(datagroup, chartType, chartLimits),
    );
  });
}

/**
 * Normalizes component properties that accept a map of objects or a function
 * that returns an object, always into the latter.
 */
export function normalizeAccessor<T extends {name: string}>(
  config: Record<string, D3plusConfig> | ((item: T) => D3plusConfig),
): (item: T) => D3plusConfig {
  return typeof config === "function" ? config : item => config[item.name];
}
