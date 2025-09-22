import type {
  TesseractDimension,
  TesseractHierarchy,
  TesseractLevel,
  TesseractMeasure,
} from "@datawheel/logiclayer-client";
import type {D3plusConfig} from "../d3plus";
import type {
  CategoryHierarchy,
  CategoryLevel,
  Datagroup,
  LevelCaption,
} from "./datagroup";

export type ChartType =
  | "barchart"
  | "choropleth"
  | "donut"
  | "lineplot"
  | "stackedarea"
  | "treemap";

export interface ChartSeries {
  name: string;
  dimension: TesseractDimension;
  hierarchy: TesseractHierarchy;
  level: TesseractLevel;
  type: "string" | "number" | "boolean";
  members: string[] | number[] | boolean[];
  captions: {[K: string]: LevelCaption | undefined};
}

export interface BaseChart {
  key: string;
  type: ChartType;
  datagroup: Datagroup;
  values: {
    measure: TesseractMeasure;
    minValue: number;
    maxValue: number;
  };
  series: ChartSeries[];
  timeline?: ChartSeries;
  extraConfig: {
    d3plus?: Partial<D3plusConfig>;
  };
}

/**
 * Generates a Series using the deepest level available on the given Hierarchy.
 */
export function buildDeepestSeries(
  hierarchy: CategoryHierarchy | undefined,
): ChartSeries | undefined {
  if (!hierarchy) return undefined;
  const series = hierarchy.levels[hierarchy.levels.length - 1];
  return buildSeries(hierarchy, series);
}

/** Generates a Series from the provided Hierarchy and Level. */
export function buildSeries(
  category: CategoryHierarchy,
  level: CategoryLevel,
): ChartSeries {
  return {
    name: level.name,
    dimension: category.dimension,
    hierarchy: category.hierarchy,
    level: level.entity,
    type: level.type,
    members: level.members,
    captions: level.captions,
  };
}

export function buildSeriesIf(
  hierarchy: CategoryHierarchy | undefined,
  condition: (level: CategoryLevel) => boolean,
): ChartSeries | undefined {
  if (!hierarchy) return undefined;
  for (let index = hierarchy.levels.length; index > 0; index) {
    const level = hierarchy.levels[--index];
    if (condition(level)) {
      return buildSeries(hierarchy, level);
    }
  }
}
