import type {ChartLimits} from "../constants";
import type {
  TesseractDimension,
  TesseractHierarchy,
  TesseractLevel,
  TesseractMeasure,
  TesseractProperty,
} from "../schema";
import {getLast} from "../toolbox/array";
import type {Datagroup} from "../toolbox/datagroup";
import {shortHash} from "../toolbox/math";

export interface DonutChart {
  key: string;
  type: "donut";
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
  };
  timeline?: {
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    members: string[] | number[];
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
  const {dataset, timeHierarchy} = dg;
  const chartType = "donut" as const;

  // Pick only hierarchies from a non-time dimension
  const nonTimeHierarchies = {...dg.geoHierarchies, ...dg.stdHierarchies};
  const qualiAxes = Object.values(nonTimeHierarchies);

  return (
    dg.measureColumns
      // Work only with the mainline measures
      .filter(axis => !axis.parentMeasure)
      .flatMap(quantiAxis => {
        const {measure, range} = quantiAxis;
        const aggregator = measure.annotations.aggregation_method || measure.aggregator;
        const units = measure.annotations.units_of_measurement;

        // Bail if measure doesn't represent percentage, rate, or proportion
        if (units && !["Percentage", "Rate"].includes(units)) return [];

        return qualiAxes.flatMap(axis => {
          const keyChain = [chartType, dataset.length, measure.name];

          return axis.levels.flatMap<DonutChart>(level => {
            const members = axis.members[level.name];

            // Bail if amount of segments in ring is above limits
            if (members.length > DONUT_SHAPE_MAX) return [];

            return {
              key: shortHash(keyChain.concat(level.name).join("|")),
              type: chartType,
              dataset,
              locale: dg.locale,
              values: {
                measure,
                minValue: range[0],
                maxValue: range[1],
              },
              series: {
                dimension: axis.dimension,
                hierarchy: axis.hierarchy,
                level,
                members,
              },
              timeline: timeHierarchy
                ? (level => ({
                    dimension: timeHierarchy.dimension,
                    hierarchy: timeHierarchy.hierarchy,
                    level,
                    members: timeHierarchy.members[level.name],
                  }))(getLast(timeHierarchy.levels))
                : undefined,
            };
          });
        });
      })
  );
}
