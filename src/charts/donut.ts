import type {TesseractMeasure} from "@datawheel/logiclayer-client";
import {filterMap} from "../toolbox/array";
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
    const isPercentage = ["Percentage", "Rate"].some(token => units.includes(token));

    // Work only with the mainline measures
    if (valueColumn.parentMeasure) return [];

    // Bail if the measure can't be summed, or doesn't represent percentage, rate, or proportion
    if (!aggregatorIn(aggregator, ["SUM", "COUNT"]) && !isPercentage) {
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

    const allLevels = categoryHierarchies.flatMap(catHierarchy =>
      filterMap(catHierarchy.levels, catLevel => {
        if (catLevel.members.length < 2) {
          console.debug(
            "[%s] Discarding level '%s': needs at least 2 members, has %d",
            chartType,
            catLevel.entity.name,
            catLevel.members.length,
          );
          return null;
        }
        if (catLevel.members.length > DONUT_SHAPE_MAX) {
          console.debug(
            "[%s] Discarding level '%s': surpasses the limit of %d members, has %d",
            chartType,
            catLevel.entity.name,
            DONUT_SHAPE_MAX,
            catLevel.members.length,
          );
          return null;
        }
        return [catHierarchy, catLevel] as const;
      }),
    );

    if (isPercentage && allLevels.length > 1) {
      console.debug(
        "[%s] Discarding multilevel '%s': Percentages can't be summed",
        chartType,
        allLevels.map(entry => entry[1].name).join("-"),
      );
      return [];
    }

    // const percentageTest = percentageUnitTester[units];
    // if (percentageTest && !percentageTest(measure, dataset, range)) {
    //   return [];
    // }

    return allLevels.map(entry => {
      const [catHierarchy, catLevel] = entry;
      const keyChain = [
        chartType,
        dataset.length,
        measure.name,
        catHierarchy.dimension.name,
        catHierarchy.hierarchy.name,
        catLevel.name,
      ];

      return {
        key: shortHash(keyChain.join()),
        type: chartType,
        datagroup,
        values,
        series: [buildSeries(catHierarchy, catLevel)],
        timeline,
        extraConfig: {},
      };
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
