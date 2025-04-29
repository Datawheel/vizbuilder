import {getLast} from "../toolbox/array";
import {yieldPartialPermutations} from "../toolbox/iterator";
import {shortHash} from "../toolbox/math";
import {aggregatorIn} from "../toolbox/validation";
import type {ChartLimits} from "../types";
import {type BaseChart, buildDeepestSeries, buildSeries, buildSeriesIf} from "./common";
import type {Datagroup} from "./datagroup";

// TODO: add criteria
// bail if sum measure && sum of all values for each series is the same

export interface BarChart extends BaseChart {
  type: "barchart";
  orientation: "vertical" | "horizontal";
}

export function generateBarchartConfigs(
  datagroup: Datagroup,
  chartLimits: ChartLimits,
): BarChart[] {
  return [
    ...generateHoriBartchartConfigs(datagroup, chartLimits),
    ...generateVertBarchartConfigs(datagroup, chartLimits),
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
export function generateHoriBartchartConfigs(
  datagroup: Datagroup,
  {BARCHART_MAX_BARS, BARCHART_MAX_STACKED_BARS}: ChartLimits,
): BarChart[] {
  const {dataset, timeHierarchy: timeAxis} = datagroup;
  const chartType = "barchart" as const;

  const categoryAxes = Object.values(datagroup.nonTimeHierarchies);

  const timeline = buildDeepestSeries(timeAxis);

  return datagroup.measureColumns.flatMap(valueAxis => {
    const {measure, range} = valueAxis;
    const aggregator = measure.annotations.aggregation_method || measure.aggregator;
    const units = measure.annotations.units_of_measurement || "";

    // Work only with the mainline measures
    if (valueAxis.parentMeasure) return [];

    // Do not show any stacked charts if aggregation_method is "NONE"
    // @see {@link https://github.com/Datawheel/canon/issues/327}
    // TODO: check applicability? pytesseract doesn't have UNKNOWN aggregator
    // if (measure.aggregator !== "UNKNOWN") return [];

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

    const allLevels = categoryAxes
      .flatMap(categoryAxis =>
        categoryAxis.levels.map(axisLevel => [categoryAxis, axisLevel] as const),
      )
      .filter(tuple => {
        const {level, members} = tuple[1];
        if (members.length < 2) {
          console.debug(
            "[%s] Level %s contains %d members; needs at least 2",
            chartType,
            level.name,
            members.length,
          );
          return false;
        }
        return true;
      });

    return [...yieldPartialPermutations(allLevels, 2)].flatMap<BarChart>(tuple => {
      const keyChain = [chartType, dataset.length, measure.name];

      const [mainAxis, mainAxisLevel] = tuple[0];
      const [otherAxis, otherAxisLevel] = tuple[1];

      // Bail if the amount of members in main axis is out of limits
      if (mainAxisLevel.members.length > BARCHART_MAX_BARS) {
        console.debug(
          "[%s] Main series '%s' contains %d members; limit BARCHART_MAX_BARS = %d",
          chartType,
          mainAxisLevel.name,
          mainAxisLevel.members.length,
          BARCHART_MAX_BARS,
        );
        return [];
      }

      // Bail if the amount of members in stacked axis is out of limits
      if (otherAxisLevel.members.length > BARCHART_MAX_STACKED_BARS) {
        console.debug(
          "[%s] Stacked series '%s' contains %d members; limit BARCHART_MAX_STACKED_BARS = %d",
          chartType,
          otherAxisLevel.name,
          otherAxisLevel.members.length,
          BARCHART_MAX_STACKED_BARS,
        );
        return [];
      }

      return {
        key: shortHash(
          keyChain.concat(mainAxisLevel.name, otherAxisLevel.name).join("|"),
        ),
        type: chartType,
        datagroup: datagroup,
        orientation: "horizontal",
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

/**
 * Requirements:
 * - All levels must have with at least 2 members
 * - When aggregator is not sum, bars are grouped (up to 2 dimensions)
 * - Time dimension always has priority as first dimension
 *
 * Notes:
 * - Vertical orientation makes more natural to understand time on x-axis
 */
export function generateVertBarchartConfigs(
  dg: Datagroup,
  {BARCHART_YEAR_MAX_BARS, BARCHART_VERTICAL_MAX_GROUPS}: ChartLimits,
): BarChart[] {
  const {dataset, timeHierarchy: timeAxis} = dg;
  const chartType = "barchart" as const;

  const categoryAxes = Object.values(dg.nonTimeHierarchies);

  // If all levels, besides the one from time dimension, have only 1 member,
  // then the chart results in a single block
  if (categoryAxes.every(axis => axis.levels.every(level => level.members.length === 1)))
    return [];

  return dg.measureColumns.flatMap(valueAxis => {
    const {measure, range} = valueAxis;

    // Work only with the mainline measures
    if (valueAxis.parentMeasure) return [];

    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    const timeline = buildSeriesIf(timeAxis, series => {
      const memCount = series.members.length;
      if (memCount < 2) {
        console.debug(
          "[%s] Time series '%s' contains only a single member",
          chartType,
          series.name,
        );
        return false;
      }
      if (memCount < BARCHART_VERTICAL_MAX_GROUPS) {
        console.debug(
          "[%s] Time series '%s' contains %d members, limit BARCHART_VERTICAL_MAX_GROUPS = %d",
          chartType,
          series.name,
          memCount,
          BARCHART_VERTICAL_MAX_GROUPS,
        );
        return false;
      }
      return true;
    });

    if (timeline) {
      return categoryAxes.flatMap(categoryAxis => {
        const {dimension, hierarchy} = categoryAxis;
        const keyChain = [
          chartType,
          "horizontal",
          dataset.length,
          measure.name,
          dimension.name,
          hierarchy.name,
        ];

        return categoryAxis.levels.flatMap<BarChart>(axisLevel => {
          const {members} = axisLevel;

          // Bail if amount of segments is out of bounds
          if (members.length < 2 || members.length > BARCHART_YEAR_MAX_BARS) return [];

          return [
            {
              key: shortHash(keyChain.concat().join("|")),
              type: chartType,
              datagroup: dg,
              orientation: "vertical",
              values,
              series: [timeline, buildSeries(categoryAxis, axisLevel)],
              extraConfig: {},
            },
          ];
        });
      });
    }

    return [...yieldPartialPermutations(categoryAxes, 2)].flatMap<BarChart>(tuple => {
      const mainAxis = tuple[0];
      const otherAxis = tuple[1];

      return mainAxis.levels.flatMap(mainLevel => {
        const mainMemCount = mainLevel.members.length;
        if (mainMemCount < 2 || mainMemCount > BARCHART_VERTICAL_MAX_GROUPS) return [];

        return otherAxis.levels.flatMap(otherLevel => {
          if (otherLevel.members.length < 2) return [];

          const keyChain = [
            chartType,
            "vertical",
            dataset.length,
            measure.name,
            mainLevel.name,
            otherLevel.name,
          ].join("|");

          return [
            {
              key: shortHash(keyChain),
              type: chartType,
              datagroup: dg,
              orientation: "vertical",
              values,
              series: [
                buildSeries(mainAxis, mainLevel),
                buildSeries(otherAxis, otherLevel),
              ],
              extraConfig: {},
            },
          ];
        });
      });
    });
  });
}
