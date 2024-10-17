import {filterMap} from "../toolbox/array";
import type {ChartLimits, D3plusConfig, Dataset, TesseractLevel} from "../types";
import {generateBarchartConfigs} from "./barchart";
import type {Chart, ChartType} from "./common";
import {type Datagroup, buildDatagroup} from "./datagroup";
import {generateDonutConfigs} from "./donut";
import {generateChoroplethMapConfigs} from "./geomap";
import {generateLineplotConfigs} from "./lineplot";
import {generateStackedareaConfigs} from "./stackedarea";
import {generateTreemapConfigs} from "./treemap";

const chartGenerator: {
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
  BARCHART_MAX_BARS: 20,
  BARCHART_MAX_STACKED_BARS: 10,
  BARCHART_YEAR_MAX_BARS: 20,
  DONUT_SHAPE_MAX: 30,
  LINEPLOT_LINE_POINT_MIN: 2,
  LINEPLOT_LINE_MAX: 20,
  STACKED_SHAPE_MAX: 200,
  STACKED_TIME_MEMBER_MIN: 2,
  TREE_MAP_SHAPE_MAX: 1000,
};

export const DEFAULT_DATACAP = 2e4;

/** */
export function generateCharts(
  datasets: Dataset[],
  options: {
    chartLimits?: ChartLimits;
    chartTypes?: ChartType[];
    datacap?: number;
    getTopojsonConfig?: (level: TesseractLevel) => Partial<D3plusConfig> | undefined;
  },
): Chart[] {
  const chartLimits = {...DEFAULT_CHART_LIMITS, ...options.chartLimits};
  const chartTypes = options.chartTypes || (Object.keys(chartGenerator) as ChartType[]);
  const chartProps = {
    datacap: options.datacap ?? DEFAULT_DATACAP,
    getTopojsonConfig: options.getTopojsonConfig || (() => undefined),
  };

  return datasets
    .filter(dataset => dataset.data.length > 0 && dataset.locale)
    .flatMap(dataset => {
      const datagroup = buildDatagroup(dataset);
      return filterMap(chartTypes, chartType => {
        const generator = chartGenerator[chartType];
        try {
          return generator ? generator(datagroup, chartLimits, chartProps) : null;
        } catch (err) {
          console.error(err);
          return null;
        }
      }).flat();
    });
}
