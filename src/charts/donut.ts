import type {ChartLimits} from "../constants";
import type {
  TesseractDimension,
  TesseractHierarchy,
  TesseractLevel,
  TesseractMeasure,
} from "../schema";
import type {Datagroup, LevelCaption} from "../toolbox/datagroup";
import {shortHash} from "../toolbox/math";
import {buildTimeSeries} from "./common";

export interface DonutChart {
  key: string;
  type: "donut";
  datagroup: Datagroup;
  values: {
    measure: TesseractMeasure;
    minValue: number;
    maxValue: number;
  };
  series: {
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    captions: {[K: string]: LevelCaption};
    members: string[] | number[] | boolean[];
  };
  timeline?: {
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    members: string[] | number[] | boolean[];
  };
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
export function examineDonutConfigs(
  dg: Datagroup,
  {DONUT_SHAPE_MAX}: ChartLimits,
): DonutChart[] {
  const {dataset, timeHierarchy: timeAxis} = dg;
  const chartType = "donut" as const;

  const categoryAxes = Object.values(dg.nonTimeHierarchies);

  const timeline = buildTimeSeries(timeAxis);

  return (
    dg.measureColumns
      // Work only with the mainline measures
      .filter(axis => !axis.parentMeasure)
      .flatMap(valueAxis => {
        const {measure, range} = valueAxis;
        const units = measure.annotations.units_of_measurement;

        // Bail if measure doesn't represent percentage, rate, or proportion
        if (units && !["Percentage", "Rate"].includes(units)) return [];

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
            const {captions, level, members} = axisLevel;

            // Bail if amount of segments in ring is out of limits
            if (members.length < 2 || members.length > DONUT_SHAPE_MAX) return [];

            return {
              key: shortHash(keyChain.concat(level.name).join("|")),
              type: chartType,
              dataset,
              locale: dg.locale,
              values,
              series: {dimension, hierarchy, level, captions, members},
              timeline,
            };
          });
        });
      })
  );
}
