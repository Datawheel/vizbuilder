import {filterMap} from "../toolbox/array";
import {yieldPartialPermutations} from "../toolbox/iterator";
import {shortHash} from "../toolbox/math";
import {aggregatorIn} from "../toolbox/validation";
import type {ChartLimits} from "../types";
import {type BaseChart, buildDeepestSeries, buildSeries} from "./common";
import type {Datagroup} from "./datagroup";

export interface TreeMap extends BaseChart {
  type: "treemap";
}

/**
 * Requirements:
 * - Present 2 levels of treemap hierarchy
 *
 * Notes:
 * - If the 2 levels belong to the same dimension, ensure level depths apply.
 */
export function generateTreemapConfigs(
  datagroup: Datagroup,
  {TREE_MAP_SHAPE_MAX}: ChartLimits,
): TreeMap[] {
  const {dataset} = datagroup;
  const chartType = "treemap" as const;

  const categoryHierarchies = Object.values(datagroup.nonTimeHierarchies);

  const timeline = buildDeepestSeries(datagroup.timeHierarchy);

  // Pick only levels with member counts above the limit
  const nonTimeLevels = categoryHierarchies.flatMap(hierarchy =>
    filterMap(hierarchy.levels, level => {
      if (level.members.length === 1) return null;
      return [hierarchy, level] as const;
    }),
  );

  // Bail if time dimension is the only valid dimension
  if (categoryHierarchies.length === 0) return [];

  return datagroup.measureColumns.flatMap(valueColumn => {
    const {measure, range} = valueColumn;
    const aggregator = measure.annotations.aggregation_method || measure.aggregator;

    // Discard if measure is associated to a parent measure
    if (valueColumn.parentMeasure) return [];

    // Treemaps are valid only with SUM-aggregated measures
    if (!aggregatorIn(aggregator, ["SUM", "COUNT"])) return [];

    // All values must be positive
    if (dataset.some(row => (row[measure.name] as number) < 0)) return [];

    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    const keyChain = [chartType, dataset.length, measure.name];

    return [...yieldPartialPermutations(nonTimeLevels, 2)].flatMap<TreeMap>(tuple => {
      const [mainHierarchy, mainLevel] = tuple[0];
      const [otherHierarchy, otherLevel] = tuple[1];

      // Bail if levels belong to same hierarchy but aren't sorted by depth
      if (
        mainHierarchy.dimension.name === otherHierarchy.dimension.name &&
        mainHierarchy.hierarchy.name === otherHierarchy.hierarchy.name &&
        mainLevel.entity.depth > otherLevel.entity.depth
      ) {
        return [];
      }

      // Bail if number of shapes to draw exceeds limit
      // TODO: recalculate count with threshold enabled
      const shapeCount = mainLevel.members.length * otherLevel.members.length;
      if (shapeCount > TREE_MAP_SHAPE_MAX) {
        console.debug(
          "[%s] Series '%s' contains %d members, limit TREE_MAP_SHAPE_MAX = %d",
          chartType,
          `${mainLevel.name} > ${otherLevel.name}`,
          shapeCount,
          TREE_MAP_SHAPE_MAX,
        );
        return [];
      }

      return {
        key: shortHash(keyChain.concat(mainLevel.name, otherLevel.name).join("|")),
        type: chartType,
        datagroup,
        values,
        series: [
          buildSeries(mainHierarchy, mainLevel),
          buildSeries(otherHierarchy, otherLevel),
        ],
        timeline,
        extraConfig: {},
      };
    });
  });
}
