import {Aggregator} from "../schema";
import {filterMap} from "../toolbox/array";
import {yieldPartialPermutations} from "../toolbox/iterator";
import {shortHash} from "../toolbox/math";
import {aggregatorIn} from "../toolbox/validation";
import type {ChartLimits} from "../types";
import {type BaseChart, buildDeepestSeries, buildSeries} from "./common";
import type {Datagroup} from "./datagroup";

export interface StackedArea extends BaseChart {
  type: "stackedarea";
  timeline: NonNullable<BaseChart["timeline"]>;
}

export function generateStackedareaConfigs(
  datagroup: Datagroup,
  {STACKED_SHAPE_MAX, STACKED_TIME_MEMBER_MIN}: ChartLimits,
): StackedArea[] {
  const {dataset} = datagroup;
  const chartType = "stackedarea" as const;

  const categoryHierarchy = Object.values(datagroup.nonTimeHierarchies);

  const timeline = buildDeepestSeries(datagroup.timeHierarchy);

  // Bail if there's no Time dimension
  if (!timeline) return [];

  // Bail if there's not enough time points to draw a line
  if (timeline.members.length < STACKED_TIME_MEMBER_MIN) return [];

  // Pick only levels with at least 2 members
  const nonTimeLevels = categoryHierarchy.flatMap(hierarchy =>
    filterMap(hierarchy.levels, level => {
      return level.members.length > 1 ? ([hierarchy, level] as const) : null;
    }),
  );

  // Bail if time dimension is the only valid dimension
  if (categoryHierarchy.length === 0) return [];

  return datagroup.measureColumns.flatMap(valueColumn => {
    const {measure, range} = valueColumn;
    const aggregator = measure.annotations.aggregation_method || measure.aggregator;
    const units = measure.annotations.units_of_measurement;

    // Stacked Area charts are valid only with SUM-aggregated measures
    if (!aggregatorIn(aggregator, ["SUM", "COUNT"])) {
      return [];
    }

    // Bail if measure is marked as 'Percentage' or 'Rate'
    if (["Percentage", "Rate"].includes(units as string)) {
      return [];
    }

    // All values must be positive
    if (dataset.some(row => (row[measure.name] as number) < 0)) {
      return [];
    }

    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    const keyChain = [chartType, dataset.length, measure.name];

    return [...yieldPartialPermutations(nonTimeLevels, 2)].flatMap<StackedArea>(tuple => {
      const [mainHierarchy, mainLevel] = tuple[0];
      const [otherHierarchy, otherLevel] = tuple[1];

      // Bail if the amount of shapes to draw is above the limit
      if (mainLevel.members.length * otherLevel.members.length > STACKED_SHAPE_MAX) {
        return [];
      }

      return {
        key: shortHash(keyChain.concat(mainLevel.name, otherLevel.name).join()),
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
