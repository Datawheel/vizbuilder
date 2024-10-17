import type {Aggregator} from "../schema";
import type {BarChart} from "./barchart";
import type {AxisSeries, CategoryAxis} from "./datagroup";
import type {DonutChart} from "./donut";
import type {ChoroplethMap} from "./geomap";
import type {LinePlot} from "./lineplot";
import type {StackedArea} from "./stackedarea";
import type {TreeMap} from "./treemap";

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
  | "lineplot"
  | "stackedarea"
  | "treemap";

export function aggregatorIn<T extends Uppercase<`${Aggregator}`> | "MOE" | "RCA">(
  aggregator: Aggregator | string,
  set: T[],
): aggregator is T {
  return set.includes(aggregator.toUpperCase() as T);
}

/**
 * Generates a Series using the deepest level available on the given CategoryAxis.
 */
export function buildDeepestSeries(axis: CategoryAxis | undefined) {
  if (!axis) return undefined;
  const series = axis.levels[axis.levels.length - 1];
  return buildSeries(axis, series);
}

/** Generates a Series with the provided Axis and AxisLevel. */
export function buildSeries(axis: CategoryAxis, series: AxisSeries) {
  return {
    name: series.name,
    dimension: axis.dimension,
    hierarchy: axis.hierarchy,
    level: series.level,
    members: series.members,
    captions: series.captions,
  };
}
