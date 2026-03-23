import type {TesseractMeasure} from "@datawheel/logiclayer-client";
import {filterMap} from "../toolbox/array";
import {shortHash} from "../toolbox/math";
import {isAggregableAcross, isAggregator} from "../toolbox/validation";
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

    const nonAggregableLevels = allLevels.filter(
      item =>
        ["Percentage", "Rate", "Ratio", "Index", "Growth"].some(token =>
          units.includes(token),
        ) ||
        !(
          isAggregator(measure, ["SUM", "COUNT"]) ||
          isAggregableAcross(measure, item[0].hierarchy.name)
        ),
    );

    return allLevels.flatMap(entry => {
      const [catHierarchy, catLevel] = entry;

      const otherNonAggregableLevels = filterMap(nonAggregableLevels, item => {
        if (item !== entry) return null;
        return item[1].name;
      });
      if (
        eligibility.bailIf(
          otherNonAggregableLevels.length > 0,
          `Values in measure '${measure.name}' can't be summed at levels ${otherNonAggregableLevels}`,
        )
      ) {
        return [];
      }

      if (
        eligibility.bailIf(
          catLevel.members.length > DONUT_SHAPE_MAX,
          `Level '${catLevel.entity.name}' has ${catLevel.members.length} members, limit DONUT_SHAPE_MAX = ${DONUT_SHAPE_MAX}`,
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
