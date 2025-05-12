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
  const {dataset, timeHierarchy: timeAxis} = datagroup;
  const chartType = "treemap" as const;

  const categoryAxes = Object.values(datagroup.nonTimeHierarchies);

  const timeline = buildDeepestSeries(timeAxis);

  // Pick only levels with member counts above the limit
  const nonTimeLevels = categoryAxes.flatMap(axis =>
    filterMap(axis.levels, axisLevel => {
      if (axisLevel.members.length === 1) return null;
      return [axis, axisLevel] as const;
    }),
  );

  // Bail if time dimension is the only valid dimension
  if (categoryAxes.length === 0) return [];

  return datagroup.measureColumns.flatMap(valueAxis => {
    const {measure, range} = valueAxis;
    const aggregator = measure.annotations.aggregation_method || measure.aggregator;
    const units = measure.annotations.units_of_measurement;

    // Discard if measure is associated to a parent measure
    if (valueAxis.parentMeasure) return [];

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
      const [mainAxis, mainAxisLevel] = tuple[0];
      const [otherAxis, otherAxisLevel] = tuple[1];

      // Bail if levels belong to same hierarchy but aren't sorted by depth
      if (
        mainAxis.dimension.name === otherAxis.dimension.name &&
        mainAxis.hierarchy.name === otherAxis.hierarchy.name &&
        mainAxisLevel.level.depth > otherAxisLevel.level.depth
      ) {
        return [];
      }

      // Bail if number of shapes to draw exceeds limit
      // TODO: recalculate count with threshold enabled
      const shapeCount = mainAxisLevel.members.length * otherAxisLevel.members.length;
      if (shapeCount > TREE_MAP_SHAPE_MAX) {
        console.debug(
          "[%s] Series '%s' contains %d members, limit TREE_MAP_SHAPE_MAX = %d",
          chartType,
          `${mainAxisLevel.name} > ${otherAxisLevel.name}`,
          shapeCount,
          TREE_MAP_SHAPE_MAX,
        );
        return [];
      }

      return {
        key: shortHash(
          keyChain.concat(mainAxisLevel.name, otherAxisLevel.name).join("|"),
        ),
        type: chartType,
        datagroup,
        values,
        series: [
          buildSeries(mainAxis, mainAxisLevel),
          buildSeries(otherAxis, otherAxisLevel),
        ],
        timeline,
        extraConfig: {},
      };
    });
  });
}
