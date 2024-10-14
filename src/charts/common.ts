import groupBy from "lodash/groupBy";
import type {Aggregator, DataPoint} from "../schema";
import type {AxisSeries, CategoryAxis} from "../toolbox/datagroup";

export function buildTimeSeries(axis: CategoryAxis | undefined) {
  if (!axis) return undefined;
  const series = axis.levels[axis.levels.length - 1];
  return buildSeries(axis, series);
}

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

export function aggregatorIn<T extends Uppercase<`${Aggregator}`> | "MOE" | "RCA">(
  aggregator: Aggregator | string,
  set: T[],
): aggregator is T {
  return set.includes(aggregator.toUpperCase() as T);
}

export function isPercentage(
  dataset: DataPoint[],
  seriesName: string,
  measureName: string,
) {
  return Object.values(groupBy(dataset, seriesName)).every(
    dataSubset =>
      dataSubset.reduce((acc, d) => acc + (d[measureName] as number), 0) <= 100.2,
  );
}
