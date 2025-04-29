import type {D3plusConfig} from "../d3plus";
import type {
  TesseractDimension,
  TesseractHierarchy,
  TesseractLevel,
  TesseractMeasure,
} from "../schema";
import type {AxisSeries, CategoryAxis, Datagroup, LevelCaption} from "./datagroup";

export type ChartType =
  | "barchart"
  | "choropleth"
  | "donut"
  | "lineplot"
  | "stackedarea"
  | "treemap";

export interface BaseChart {
  key: string;
  type: ChartType;
  datagroup: Datagroup;
  values: {
    measure: TesseractMeasure;
    minValue: number;
    maxValue: number;
  };
  series: {
    name: string;
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    captions: {[K: string]: LevelCaption};
    members: string[] | number[] | boolean[];
  }[];
  timeline?: {
    name: string;
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    members: string[] | number[] | boolean[];
  };
  extraConfig: {
    d3plus?: Partial<D3plusConfig>;
  };
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

export function buildSeriesIf(
  axis: CategoryAxis | undefined,
  condition: (series: AxisSeries) => boolean,
) {
  if (!axis) return undefined;
  for (let index = axis.levels.length; index > 0; index) {
    const level = axis.levels[--index];
    if (condition(level)) {
      return buildSeries(axis, level);
    }
  }
}
