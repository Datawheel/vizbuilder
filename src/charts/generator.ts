import type {TesseractLevel} from "@datawheel/logiclayer-client";
import {keyBy} from "lodash-es";
import type {D3plusConfig} from "../d3plus";
import {filterMap} from "../toolbox/array";
import type {ChartLimits, Dataset} from "../types";
import {type BarChart, generateBarchartConfigs} from "./barchart";
import type {ChartType} from "./common";
import {buildDatagroup, type Datagroup, injectMonthISO} from "./datagroup";
import {type DonutChart, generateDonutConfigs} from "./donut";
import {type ChoroplethMap, generateChoroplethMapConfigs} from "./geomap";
import {generateLineplotConfigs, type LinePlot} from "./lineplot";
import {generateStackedareaConfigs, type StackedArea} from "./stackedarea";
import {generateTreemapConfigs, type TreeMap} from "./treemap";

export type Chart =
  | BarChart
  | LinePlot
  | TreeMap
  | DonutChart
  | ChoroplethMap
  | StackedArea;

export const chartGenerator: {
  [K in ChartType]: (
    dg: Datagroup,
    limits: ChartLimits,
    params: {
      datacap: number;
      getTopojsonConfig: (level: TesseractLevel) => Partial<D3plusConfig> | undefined;
    },
  ) => Chart[];
} = {
  barchart: generateBarchartConfigs,
  choropleth: generateChoroplethMapConfigs,
  donut: generateDonutConfigs,
  lineplot: generateLineplotConfigs,
  stackedarea: generateStackedareaConfigs,
  treemap: generateTreemapConfigs,
};

export const DEFAULT_CHART_LIMITS: ChartLimits = {
  BARCHART_MAX_GROUPS: 24,
  BARCHART_MAX_STACKED_BARS: 10,
  BARCHART_MAX_GROUPED_BARS: 2,
  BARCHART_VERTICAL_MAX_GROUPS: 20,
  BARCHART_VERTICAL_MAX_PERIODS: 40,
  BARCHART_VERTICAL_TOTAL_BARS: 240,
  DONUT_SHAPE_MAX: 30,
  LINEPLOT_LINE_MAX: 20,
  LINEPLOT_LINE_POINT_MIN: 2,
  STACKED_SHAPE_MAX: 200,
  STACKED_TIME_MEMBER_MIN: 2,
  TREE_MAP_SHAPE_MAX: 1000,
};

export const DEFAULT_DATACAP = 2e4;

/** */
export function generateCharts(
  datasets: Dataset[],
  options: {
    chartLimits?: Partial<ChartLimits>;
    chartTypes?: ChartType[];
    datacap?: number;
    getTopojsonConfig?: (level: TesseractLevel) => Partial<D3plusConfig> | undefined;
  } = {},
): Chart[] {
  const chartLimits = {...DEFAULT_CHART_LIMITS, ...options.chartLimits};
  const chartTypes = options.chartTypes || (Object.keys(chartGenerator) as ChartType[]);
  const chartProps = {
    datacap: options.datacap ?? DEFAULT_DATACAP,
    getTopojsonConfig: options.getTopojsonConfig || (() => undefined),
  };

  return (
    datasets
      // Remove datasets with no data or no specified locale (required for labels)
      .filter(dataset => dataset.data.length > 0 && dataset.locale)
      // Split each measure on its own Dataset object, filter nulls per measure
      .flatMap((dataset): Dataset[] => {
        injectMonthISO(dataset.data);
        const columns = Object.values(dataset.columns);
        const measureColumns = columns.filter(column => column.type === "measure");
        return filterMap(measureColumns, column => {
          if (column.parentMeasure) return null;
          const {name: measureName} = column;
          const measureFamily = filterMap(measureColumns, column =>
            (column.parentMeasure || column).name === measureName ? column.name : null,
          );
          const filteredColumns = keyBy(
            columns.filter(
              column => column.type !== "measure" || measureFamily.includes(column.name),
            ),
            "name",
          );
          return {
            columns: filteredColumns,
            data: dataset.data.filter(row => row[measureName] != null),
            locale: dataset.locale,
          };
        });
      })
      .flatMap(dataset => {
        const datagroup = buildDatagroup(dataset);
        return filterMap(chartTypes, chartType => {
          const generator = chartGenerator[chartType];
          try {
            return datagroup && generator
              ? generator(datagroup, chartLimits, chartProps)
              : null;
          } catch (err) {
            console.error(err);
            return null;
          }
        }).flat();
      })
  );
}

generateCharts.generators = chartGenerator;
