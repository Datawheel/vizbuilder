import type {ChartLimits} from "../constants";
import {
  Aggregator,
  type TesseractDimension,
  type TesseractHierarchy,
  type TesseractLevel,
  type TesseractMeasure,
  type TesseractProperty,
} from "../schema";
import {filterMap, getLast} from "../toolbox/array";
import type {Datagroup} from "../toolbox/datagroup";
import {yieldPermutations} from "../toolbox/iterator";
import {shortHash} from "../toolbox/math";

export interface TreeMap {
  key: string;
  type: "treemap";
  dataset: Record<string, unknown>[];
  locale: string;
  values: {
    measure: TesseractMeasure;
    minValue: number;
    maxValue: number;
  };
  series: {
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    property?: TesseractProperty;
    members: string[] | number[] | boolean[];
  }[];
  timeline?: {
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    members: string[] | number[];
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
  const {dataset, timeHierarchy} = dg;
  const chartType = "treemap" as const;

  // Pick only hierarchies from a non-time dimension
  const nonTimeHierarchies = {...dg.geoHierarchies, ...dg.stdHierarchies};
  const qualiAxes = Object.values(nonTimeHierarchies);

  // Pick only levels with member counts above the limit
  const nonTimeLevels = qualiAxes.flatMap(axis =>
    filterMap(axis.levels, level => {
      const members = axis.members[level.name];
      return members.length > 1 ? ([axis, level] as const) : null;
    }),
  );

  // Bail if time dimension is the only valid dimension
  if (timeHierarchy && nonTimeLevels.length === 0) return [];

  return (
    dg.measureColumns
      // Work only with the mainline measures
      .filter(axis => !axis.parentMeasure)
      .flatMap(quantiAxis => {
        const {measure, range} = quantiAxis;
        const aggregator = measure.annotations.aggregation_method || measure.aggregator;
        const units = measure.annotations.units_of_measurement;

        // All values must be positive
        if (dataset.some(row => (row[measure.name] as number) < 0)) return [];

        // Treemaps are valid only with SUM-aggregated measures
        if (![Aggregator.SUM, Aggregator.COUNT, "SUM", "COUNT"].includes(aggregator))
          return [];

        const keyChain = [chartType, dataset.length, measure.name];

        return [...yieldPermutations(nonTimeLevels)].flatMap<TreeMap>(
          ([hier1, hier2]) => {
            const [axis1, level1] = hier1;
            const [axis2, level2] = hier2;

            // Bail if levels belong to same hierarchy but don't respect depths
            if (
              axis1.dimension.name === axis2.dimension.name &&
              axis1.hierarchy.name === axis2.hierarchy.name &&
              level1.depth < level2.depth
            )
              return [];

            const members1 = axis1.members[level1.name];
            const members2 = axis2.members[level2.name];

            // Bail if number of shapes to draw exceeds limit
            if (members1.length * members2.length > TREE_MAP_SHAPE_MAX) return [];

            return {
              key: shortHash(keyChain.concat(level1.name, level2.name).join("|")),
              type: chartType,
              dataset,
              locale: dg.locale,
              values: {
                measure,
                minValue: range[0],
                maxValue: range[1],
              },
              series: [
                {
                  dimension: axis1.dimension,
                  hierarchy: axis1.hierarchy,
                  level: level1,
                  members: members1,
                },
                {
                  dimension: axis2.dimension,
                  hierarchy: axis2.hierarchy,
                  level: level2,
                  members: members2,
                },
              ],
              timeline: timeHierarchy
                ? (level => ({
                    dimension: timeHierarchy.dimension,
                    hierarchy: timeHierarchy.hierarchy,
                    level,
                    members: timeHierarchy.members[level.name],
                  }))(getLast(timeHierarchy.levels))
                : undefined,
            };
          },
        );
      })
  );
}
