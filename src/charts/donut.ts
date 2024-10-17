import {shortHash} from "../toolbox/math";
import {aggregatorIn} from "../toolbox/validation";
import type {ChartLimits} from "../types";
import {type BaseChart, buildDeepestSeries, buildSeries} from "./common";
import type {Datagroup} from "./datagroup";

export interface DonutChart extends BaseChart {
  type: "donut";
}

/**
 * Requirements:
 * - a single dimension per chart
 * - measure must represent a percentage or proportion
 * - can show multiple levels of a single hierarchy
 *
 * Notes:
 * - limited amount of segments per ring
 */
export function generateDonutConfigs(
  datagroup: Datagroup,
  {DONUT_SHAPE_MAX}: ChartLimits,
): DonutChart[] {
  const {dataset, timeHierarchy: timeAxis} = datagroup;
  const chartType = "donut" as const;

  const categoryAxes = Object.values(datagroup.nonTimeHierarchies);

  const timeline = buildDeepestSeries(timeAxis);

  return datagroup.measureColumns.flatMap(valueAxis => {
    const {measure, range} = valueAxis;
    const aggregator = measure.annotations.aggregation_method || measure.aggregator;
    const units = measure.annotations.units_of_measurement || "";

    // Work only with the mainline measures
    if (valueAxis.parentMeasure) return [];

    // Bail if the measure can't be summed, or doesn't represent percentage, rate, or proportion
    if (
      categoryAxes.length > 1 &&
      !aggregatorIn(aggregator, ["SUM", "COUNT"]) &&
      !["Percentage", "Rate"].includes(units)
    ) {
      console.debug(
        "[%s] Measure '%s' has aggregator '%s' and units '%s'; can't be summed.",
        chartType,
        measure.name,
        aggregator,
        units,
      );
      return [];
    }

    // TODO: if percentage, identify which dimensions output 100%

    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    return categoryAxes.flatMap(categoryAxis => {
      const {dimension, hierarchy} = categoryAxis;
      const keyChain = [
        chartType,
        dataset.length,
        measure.name,
        dimension.name,
        hierarchy.name,
      ];

      return categoryAxis.levels.flatMap<DonutChart>(axisLevel => {
        const {level, members} = axisLevel;

        // Bail if amount of segments in ring is out of limits
        if (members.length < 2 || members.length > DONUT_SHAPE_MAX) return [];

        return {
          key: shortHash(keyChain.concat(level.name).join("|")),
          type: chartType,
          datagroup,
          values,
          series: [buildSeries(categoryAxis, axisLevel)],
          timeline,
        };
      });
    });
  });
}
