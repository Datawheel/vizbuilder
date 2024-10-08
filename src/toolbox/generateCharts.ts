import flatMap from "lodash/flatMap";
import {type BarChart, buildBarcharts} from "../charts/barchart";
import {type LinePlot, buildLineplot} from "../charts/lineplot";
import {chartComponents} from "../components/ChartCard";
import {type ChartLimits, DEFAULT_CHART_LIMITS} from "../constants";
import type {TesseractLevel} from "../schema";
import type {ChartType, D3plusConfig, Dataset} from "../structs";
import {filterMap} from "./array";
import {buildDatagroup} from "./datagroup";

export type Chart = BarChart | LinePlot;

const chartBuilders = {
  barchart: buildBarcharts,
  lineplot: buildLineplot,
};

/** */
export function generateCharts(
  datasets: Dataset[],
  options: {
    chartLimits?: ChartLimits;
    chartTypes?: ChartType[];
    datacap?: number;
    topojsonConfig?:
      | Record<string, D3plusConfig>
      | ((level: TesseractLevel) => D3plusConfig);
  },
): Chart[] {
  console.group("generateCharts(", datasets, options, ")");

  const chartLimits = {...DEFAULT_CHART_LIMITS, ...options.chartLimits};
  const chartTypes = options.chartTypes || (Object.keys(chartComponents) as ChartType[]);
  const datagroupProps = {
    datacap: options.datacap ?? 2e4,
    getTopojsonConfig: normalizeAccessor(options.topojsonConfig || {}),
  };

  try {
    return flatMap(datasets, dataset => {
      const datagroup = buildDatagroup(dataset);
      return filterMap(chartTypes, chartType => {
        const builder = chartBuilders[chartType];
        return builder ? builder(datagroup, chartLimits) : null;
      });
    });
  } catch (err) {
    console.error(err);
    return [];
  } finally {
    console.groupEnd();
  }
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
