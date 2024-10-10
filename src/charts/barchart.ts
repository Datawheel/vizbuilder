import type {ChartLimits} from "../constants";
import {
  Aggregator,
  type TesseractDimension,
  type TesseractHierarchy,
  type TesseractLevel,
  type TesseractMeasure,
  type TesseractProperty,
} from "../schema";
import {getLast} from "../toolbox/array";
import type {Datagroup} from "../toolbox/datagroup";
import {shortHash} from "../toolbox/math";

// TODO: add criteria
// bail if sum measure && sum of all values for each series is the same

// TODO: encode stacked bars in the config
export interface BarChart {
  key: string;
  type: "barchart";
  dataset: Record<string, unknown>[];
  locale: string;
  orientation: "vertical" | "horizontal";
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
  }[];
  timeline?: {
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    members: string[] | number[];
  };
}

export function examineBarchartConfigs(
  dg: Datagroup,
  chartLimits: ChartLimits,
): BarChart[] {
  return [
    ...buildHorizontalBarcharts(dg, chartLimits),
    ...buildVerticalBarcharts(dg, chartLimits),
  ];
}

/**
 * This function generates barcharts not related to a time dimension.
 * If the data includes a time dimension, should be controlled using a timeline.
 *
 * Requirements:
 * - at least one non-time drilldown with more than one member
 * - measure that is not of aggregation type "UNKNOWN"
 * - first drilldown (in each combination of drilldowns) has less than CHART_LIMIT.MAX_BAR members
 *
 * Notes:
 * - Horizontal orientation improves label readability
 */
export function buildHorizontalBarcharts(
  dg: Datagroup,
  {BARCHART_MAX_BARS}: ChartLimits,
): BarChart[] {
  const {dataset, timeHierarchy} = dg;
  const chartType = "barchart" as const;

  // pick only hierarchies from a non-time dimension
  const qualiAxes = [
    ...Object.values(dg.geoHierarchies),
    ...Object.values(dg.stdHierarchies),
  ];

  const dimensionCount = Number(timeHierarchy) + qualiAxes.length;

  return (
    dg.measureColumns
      // Work only with the mainline measures
      .filter(axis => !axis.parentMeasure)
      // Do not show any stacked charts if aggregation_method is "NONE"
      // @see {@link https://github.com/Datawheel/canon/issues/327}
      // TODO: check applicability? pytesseract doesn't have UNKNOWN aggregator
      // .filter(column => column.measure.aggregator !== "UNKNOWN")
      .flatMap(quantiAxis => {
        const {measure, range} = quantiAxis;

        if (dimensionCount > 1 && measure.aggregator !== Aggregator.SUM) return [];

        return qualiAxes.flatMap(qualiAxis => {
          const {hierarchy} = qualiAxis;
          const keyChain = [chartType, dataset.length, measure.name, hierarchy.name];

          return qualiAxis.levels.flatMap<BarChart>(level => {
            const members = qualiAxis.members[level.name];

            if (members.length < 2 || members.length > BARCHART_MAX_BARS) return [];

            return {
              key: shortHash(keyChain.concat(level.name).join("|")),
              type: chartType,
              dataset,
              locale: dg.locale,
              orientation: "horizontal" as const,
              values: {
                measure,
                minValue: range[0],
                maxValue: range[1],
              },
              series: [
                {
                  dimension: qualiAxis.dimension,
                  hierarchy: qualiAxis.hierarchy,
                  level,
                  members,
                },
              ],
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

/**
 * Requirements:
 * - All levels must have with at least 2 members
 * - If dimensions other than time, measure aggregator must be sum
 *
 * Notes:
 * - Vertical orientation is more natural to understand time on x-axis
 */
export function buildVerticalBarcharts(
  dg: Datagroup,
  {BARCHART_YEAR_MAX_BARS}: ChartLimits,
): BarChart[] {
  const {dataset, timeHierarchy} = dg;
  const chartType = "barchart" as const;

  // Pick only hierarchies from a non-time dimension
  const qualiAxes = [
    ...Object.values(dg.geoHierarchies),
    ...Object.values(dg.stdHierarchies),
  ];

  // Bail if no time dimension present
  if (!timeHierarchy) return [];

  // Bail if the time level has less than 2 members
  const deepestTimeLevel = getLast(timeHierarchy.levels);
  if (timeHierarchy.members[deepestTimeLevel.name].length < 2) {
    return [];
  }

  // If all levels, besides the one from time dimension, have only 1 member,
  // then the chart results in a single block
  if (
    qualiAxes.every(axis => {
      const members = axis.members;
      return axis.levels.every(level => members[level.name].length === 1);
    })
  )
    return [];

  return (
    dg.measureColumns
      // Work only with the mainline measures
      .filter(axis => !axis.parentMeasure)
      .flatMap(quantiAxis => {
        const {measure, range} = quantiAxis;

        return qualiAxes.flatMap(qualiAxis => {
          const {hierarchy} = qualiAxis;
          const keyChain = [chartType, dataset.length, measure.name, hierarchy.name];

          return qualiAxis.levels.flatMap<BarChart>(level => {
            const members = qualiAxis.members[level.name];

            if (members.length < 2 || members.length > BARCHART_YEAR_MAX_BARS) return [];

            return {
              key: shortHash(keyChain.concat().join("|")),
              type: chartType,
              dataset,
              locale: dg.locale,
              orientation: "vertical",
              values: {
                measure,
                minValue: range[0],
                maxValue: range[1],
              },
              series: [
                (level => ({
                  dimension: timeHierarchy.dimension,
                  hierarchy: timeHierarchy.hierarchy,
                  level,
                  members: timeHierarchy.members[level.name],
                }))(getLast(timeHierarchy.levels)),
                {
                  dimension: qualiAxis.dimension,
                  hierarchy: qualiAxis.hierarchy,
                  level,
                  members,
                },
              ],
            };
          });
        });
      })
  );
}
