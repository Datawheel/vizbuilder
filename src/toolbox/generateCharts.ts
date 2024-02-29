import flatMap from "lodash/flatMap";
import { Chart, ChartLimits, ChartType, D3plusConfig, QueryResult } from "../..";
import { chartRemixer } from "./charts";
import { buildDatagroup } from "./datagroup";
import { DEFAULT_CHART_LIMITS } from "./constants";
import { chartComponents } from "../components/ChartCard";

/** */
export function generateCharts(queries: QueryResult[], options: {
  chartLimits?: ChartLimits;
  chartTypes?: ChartType[];
  datacap?: number;
  topojsonConfig?: Record<string, D3plusConfig> | ((level: OlapClient.Level) => D3plusConfig);
}): Chart[] {
  const chartLimits = {...DEFAULT_CHART_LIMITS, ...options.chartLimits};
  const chartTypes = options.chartTypes || Object.keys(chartComponents) as ChartType[];
  const datagroupProps = {
    datacap: options.datacap ?? 2e4,
    getTopojsonConfig: levelConfigAccesor(options.topojsonConfig || {})
  };

  return flatMap(queries, query => {
    const datagroup = buildDatagroup(query, datagroupProps);
    return flatMap(chartTypes, chartType => chartRemixer(datagroup, chartType, chartLimits));
  });
}

/** */
export function levelConfigAccesor(
  config: Record<string, D3plusConfig> | ((item: OlapClient.Level) => D3plusConfig)
): (item: OlapClient.Level) => D3plusConfig {
  if (typeof config === "function") {
    return config;
  }
  return item => config[item.uniqueName] || config[item.fullName] || config[item.name];
}

/**
 * Normalizes the Vizbuilder Component Property "measureConfig", which can
 * accept both a `(measure: OlapClient.Measure) => D3plusConfig` or a
 * `Record<string, D3plusConfig>, into the function form for internal use.
 */
export function measureConfigAccessor(
  config: Record<string, D3plusConfig> | ((item: OlapClient.Measure) => D3plusConfig)
): (item: OlapClient.Measure) => D3plusConfig {
  if (typeof config === "function") {
    return config;
  }
  return item => config[item.name];
}
