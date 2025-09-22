import type {TesseractMeasure} from "@datawheel/logiclayer-client";
import {shortHash} from "../toolbox/math";
import {aggregatorIn, isOneOf} from "../toolbox/validation";
import type {ChartLimits} from "../types";
import {type BaseChart, buildDeepestSeries, buildSeries} from "./common";
import type {Datagroup, DataPoint} from "./datagroup";

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
  const {dataset} = datagroup;
  const chartType = "donut" as const;

  const categoryHierarchies = Object.values(datagroup.nonTimeHierarchies);

  const timeline = buildDeepestSeries(datagroup.timeHierarchy);

  return datagroup.measureColumns.flatMap(valueColumn => {
    const {measure, range} = valueColumn;
    const aggregator = measure.annotations.aggregation_method || measure.aggregator;
    const units = measure.annotations.units_of_measurement || "";

    // Work only with the mainline measures
    if (valueColumn.parentMeasure) return [];

    // Bail if the measure can't be summed, or doesn't represent percentage, rate, or proportion
    if (
      !aggregatorIn(aggregator, ["SUM", "COUNT"]) &&
      !isOneOf(units, ["Percentage", "Percentage Base 100", "Rate"])
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

    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    // Bail if there are negative values in members
    if (values.minValue < 0) {
      console.debug(
        "[%s] Measure '%s' contains members with negative values",
        chartType,
        measure.name,
      );
      return [];
    }

    // const percentageTest = percentageUnitTester[units];
    // if (percentageTest && !percentageTest(measure, dataset, range)) {
    //   return [];
    // }

    return categoryHierarchies.flatMap(catHierarchy => {
      const {dimension, hierarchy} = catHierarchy;
      const keyChain = [
        chartType,
        dataset.length,
        measure.name,
        dimension.name,
        hierarchy.name,
      ];

      return catHierarchy.levels.flatMap<DonutChart>(catLevel => {
        const {members} = catLevel;

        // Bail if amount of segments in ring is out of limits
        if (members.length < 2 || members.length > DONUT_SHAPE_MAX) return [];

        return {
          key: shortHash(keyChain.concat(catLevel.name).join()),
          type: chartType,
          datagroup,
          values,
          series: [buildSeries(catHierarchy, catLevel)],
          timeline,
          extraConfig: {},
        };
      });
    });
  });
}

const percentageUnitTester: {
  [K: string]: (
    measure: TesseractMeasure,
    dataset: DataPoint[],
    range: [number, number],
  ) => boolean;
} = {
  // Percentage: (measure, dataset, range) => range[1] < 100,
  // Rate: (measure, dataset, range) => range[1] < 100,
  "Percentage Base 100": (measure, dataset, range) => range[1] < 100,
  Share: (measure, dataset, range) => range[0] >= 0 && range[1] <= 100,
};
