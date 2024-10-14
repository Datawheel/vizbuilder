import {type BarChart, examineBarchartConfigs} from "../charts/barchart";
import {type DonutChart, examineDonutConfigs} from "../charts/donut";
import {type ChoroplethMap, examineChoroplethMapConfigs} from "../charts/geomap";
import {type LinePlot, examineLineplotConfigs} from "../charts/lineplot";
import {type StackedArea, examineStackedareaConfigs} from "../charts/stackedarea";
import {type TreeMap, examineTreemapConfigs} from "../charts/treemap";
import {chartComponents} from "../components/ChartCard";
import {type ChartLimits, DEFAULT_CHART_LIMITS} from "../constants";
import type {D3plusConfig} from "../d3plus";
import type {TesseractLevel} from "../schema";
import type {Dataset} from "../structs";
import {filterMap} from "./array";
import {buildDatagroup} from "./datagroup";

export type Chart =
  | BarChart
  | LinePlot
  | TreeMap
  | DonutChart
  | ChoroplethMap
  | StackedArea;

export type ChartType =
  | "barchart"
  | "choropleth"
  | "donut"
  // | "histogram"
  | "lineplot"
  | "stackedarea"
  | "treemap";

const chartBuilders = {
  barchart: examineBarchartConfigs,
  choropleth: examineChoroplethMapConfigs,
  // donut: examineDonutConfigs,
  lineplot: examineLineplotConfigs,
  // treemap: examineTreemapConfigs,
  // stackedarea: examineStackedareaConfigs,
};

/** */
export function generateCharts(
  datasets: Dataset[],
  options: {
    chartLimits?: ChartLimits;
    chartTypes?: ChartType[];
    datacap?: number;
    topojsonConfig?:
      | Record<string, Partial<D3plusConfig>>
      | ((level: TesseractLevel) => Partial<D3plusConfig>);
  },
): Chart[] {
  const chartLimits = {...DEFAULT_CHART_LIMITS, ...options.chartLimits};
  const chartTypes = options.chartTypes || (Object.keys(chartComponents) as ChartType[]);
  const chartProps = {
    datacap: options.datacap ?? 2e4,
    getTopojsonConfig: normalizeAccessor(options.topojsonConfig || {}),
  };

  console.time("generateCharts");
  try {
    return datasets
      .filter(dataset => dataset.data.length > 0 && dataset.locale)
      .flatMap(dataset => {
        const datagroup = buildDatagroup(dataset);
        return filterMap(chartTypes, chartType => {
          const builder = chartBuilders[chartType];
          return builder ? builder(datagroup, chartLimits, chartProps) : null;
        }).flat();
      });
  } catch (err) {
    console.error(err);
    return [`${err.name}: ${err.message}`, ...err.stack.split("\n")];
  } finally {
    console.timeEnd("generateCharts");
  }
}

/**
 * Normalizes component properties that accept a map of objects or a function
 * that returns an object, always into the latter.
 */
export function normalizeAccessor<T extends {name: string}>(
  config:
    | Record<string, Partial<D3plusConfig>>
    | ((item: T) => Partial<D3plusConfig> | undefined),
): (item: T) => Partial<D3plusConfig> | undefined {
  return typeof config === "function" ? config : item => config[item.name];
}
