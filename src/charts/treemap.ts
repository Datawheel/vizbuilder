import type {ChartLimits} from "../constants";
import {
  Aggregator,
  type TesseractDimension,
  type TesseractHierarchy,
  type TesseractLevel,
  type TesseractMeasure,
} from "../schema";
import {filterMap} from "../toolbox/array";
import type {Datagroup, LevelCaption} from "../toolbox/datagroup";
import {yieldPermutations} from "../toolbox/iterator";
import {shortHash} from "../toolbox/math";
import {buildSeries, buildTimeSeries} from "./common";

export interface TreeMap {
  key: string;
  type: "treemap";
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
}

/**
 * Requirements:
 * - Present 2 levels of treemap hierarchy
 *
 * Notes:
 * - If the 2 levels belong to the same dimension, ensure level depths apply.
 */
export function examineTreemapConfigs(
  dg: Datagroup,
  {TREE_MAP_SHAPE_MAX}: ChartLimits,
): TreeMap[] {
  const {dataset, timeHierarchy: timeAxis} = dg;
  const chartType = "treemap" as const;

  const categoryAxes = Object.values(dg.nonTimeHierarchies);

  const timeline = buildTimeSeries(timeAxis);

  // Pick only levels with member counts above the limit
  const nonTimeLevels = categoryAxes.flatMap(axis =>
    filterMap(axis.levels, axisLevel => {
      return axisLevel.members.length > 1 ? ([axis, axisLevel] as const) : null;
    }),
  );

  // Bail if time dimension is the only valid dimension
  if (categoryAxes.length === 0) return [];

  return dg.measureColumns.flatMap(valueAxis => {
    const {measure, range} = valueAxis;
    const aggregator = measure.annotations.aggregation_method || measure.aggregator;
    const units = measure.annotations.units_of_measurement;

    if (valueAxis.parentMeasure) return [];

    // Treemaps are valid only with SUM-aggregated measures
    if (![Aggregator.SUM, Aggregator.COUNT, "SUM", "COUNT"].includes(aggregator))
      return [];

    // All values must be positive
    if (dataset.some(row => (row[measure.name] as number) < 0)) return [];

    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    const keyChain = [chartType, dataset.length, measure.name];

    return [...yieldPermutations(nonTimeLevels)].flatMap<TreeMap>(([hier1, hier2]) => {
      const [axis1, level1] = hier1;
      const [axis2, level2] = hier2;

      // Bail if levels belong to same hierarchy but don't respect depths
      if (
        axis1.dimension.name === axis2.dimension.name &&
        axis1.hierarchy.name === axis2.hierarchy.name &&
        level1.level.depth < level2.level.depth
      )
        return [];

      const members1 = level1.members;
      const members2 = level2.members;

      // Bail if number of shapes to draw exceeds limit
      if (members1.length * members2.length > TREE_MAP_SHAPE_MAX) return [];

      return {
        key: shortHash(keyChain.concat(level1.level.name, level2.level.name).join("|")),
        type: chartType,
        dataset,
        locale: dg.locale,
        values,
        series: [buildSeries(axis1, level1), buildSeries(axis2, level2)],
        timeline,
      };
    });
  });
}
