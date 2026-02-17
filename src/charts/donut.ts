import type {TesseractMeasure} from "@datawheel/logiclayer-client";
import {filterMap} from "../toolbox/array";
import {shortHash} from "../toolbox/math";
import {isSummableMeasure} from "../toolbox/validation";
import type {ChartLimits} from "../types";
import {ChartEligibility} from "./check";
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
  const eligibility = new ChartEligibility(chartType);

  const categoryHierarchies = Object.values(datagroup.nonTimeHierarchies);

  const timeline = buildDeepestSeries(datagroup.timeHierarchy);

  return datagroup.measureColumns.flatMap(valueColumn => {
    const {measure, range} = valueColumn;
    const aggregator = measure.annotations.aggregation_method || measure.aggregator;
    const units = measure.annotations.units_of_measurement || "";
    const keyChain = [chartType, dataset.length, measure.name];
    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    // Work only with the mainline measures
    if (valueColumn.parentMeasure) return [];

    if (
      eligibility.bailIf(
        !isSummableMeasure(measure),
        `Values in measure '${measure.name}' can't be summed (${aggregator} / ${units})`,
      )
    ) {
      return [];
    }

    // Bail if there are negative values in members
    if (
      eligibility.bailIf(
        values.minValue < 0,
        `Measure '${measure.name}' contains members with negative values`,
      )
    ) {
      return [];
    }

    const allLevels = categoryHierarchies.flatMap(catHierarchy =>
      filterMap(catHierarchy.levels, catLevel => {
        if (
          eligibility.bailIf(
            catLevel.members.length < 2,
            `Level '${catLevel.entity.name}' has ${catLevel.members.length} member; at least 2 required`,
          )
        ) {
          return null;
        }
        return [catHierarchy, catLevel] as const;
      }),
    );

    if (
      eligibility.bailIf(
        allLevels.length > 1 && !isSummableMeasure(measure),
        `Discarding multilevel '${allLevels
          .map(entry => entry[1].name)
          .join("-")}', measure '${measure.name}' can't be summed`,
      )
    ) {
      return [];
    }

    return allLevels.flatMap(entry => {
      const [catHierarchy, catLevel] = entry;

      if (
        eligibility.bailIf(
          catLevel.members.length > DONUT_SHAPE_MAX,
          `Level '${catLevel.entity.name}' has ${catLevel.members.length}, limit DONUT_SHAPE_MAX = ${DONUT_SHAPE_MAX}`,
        )
      ) {
        return [];
      }

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
}

export const percentageUnitTester: {
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
