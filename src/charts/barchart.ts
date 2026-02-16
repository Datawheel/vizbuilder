import {filterMap} from "../toolbox/array";
import {yieldPartialPermutations} from "../toolbox/iterator";
import {shortHash} from "../toolbox/math";
import {isSummableMeasure} from "../toolbox/validation";
import type {ChartLimits} from "../types";
import {ChartEligibility} from "./check";
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
  // TODO: criteria for orientation is very subjective;
  // timeline in vertical should be considered as an exception and prefer lines
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
  {
    BARCHART_MAX_GROUPS,
    BARCHART_MAX_STACKED_BARS,
    BARCHART_MAX_GROUPED_BARS,
  }: ChartLimits,
): BarChart[] {
  const {dataset} = datagroup;
  const chartType = "barchart" as const;
  const eligibility = new ChartEligibility("barchart-hori");

  // In horizontal barcharts, always reserve timeline for the interactive dimension
  const timeline = buildDeepestSeries(datagroup.timeHierarchy);

  const categoryHierarchies = Object.values(datagroup.nonTimeHierarchies);

  return datagroup.measureColumns.flatMap(valueColumn => {
    const {measure, range} = valueColumn;
    const keyChain = [chartType, dataset.length, measure.name];
    const isSummable = isSummableMeasure(measure);
    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    // Work only with the mainline measures
    if (valueColumn.parentMeasure) return [];

    const allLevels = categoryHierarchies.flatMap(catHierarchy =>
      filterMap(catHierarchy.levels, catLevel => {
        // We need to filter levels where there's a single member
        // It's not meaningful as it would render a single block
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

    if (allLevels.length === 1) {
      return allLevels.flatMap<BarChart>(pair => {
        const [mainHierarchy, mainLevel] = pair;

        if (
          eligibility.bailIf(
            mainLevel.members.length > BARCHART_MAX_GROUPS,
            `Unique series '${mainLevel.name}' contains ${mainLevel.members.length} members; limit BARCHART_MAX_GROUPS = ${BARCHART_MAX_GROUPS}`,
          )
        ) {
          return [];
        }

        return {
          key: shortHash(keyChain.concat(mainLevel.name).join()),
          type: chartType,
          datagroup: datagroup,
          orientation: "horizontal",
          values,
          series: [buildSeries(mainHierarchy, mainLevel)],
          timeline,
          extraConfig: {},
        };
      });
    }

    return [...yieldPartialPermutations(allLevels, 2)].flatMap<BarChart>(tuple => {
      const [mainHierarchy, mainLevel] = tuple[0];
      const [otherHierarchy, otherLevel] = tuple[1];

      // Bail if both levels belong to the same dimension and are not in depth order
      if (
        mainHierarchy === otherHierarchy &&
        mainLevel.entity.depth < otherLevel.entity.depth
      ) {
        return [];
      }

      // Bail if the amount of members in main level is out of limits
      if (
        eligibility.bailIf(
          mainLevel.members.length > BARCHART_MAX_GROUPS,
          `Main series '${mainLevel.name}' contains ${mainLevel.members.length} members; limit BARCHART_MAX_GROUPS = ${BARCHART_MAX_GROUPS}`,
        )
      ) {
        return [];
      }

      // Bail if the amount of members in stacked level is out of limits
      if (
        eligibility.bailIf(
          isSummable && otherLevel.members.length > BARCHART_MAX_STACKED_BARS,
          `Stacked series '${otherLevel.name}' contains ${otherLevel.members.length} members; limit BARCHART_MAX_STACKED_BARS = ${BARCHART_MAX_STACKED_BARS}`,
        )
      ) {
        return [];
      }

      // Bail if the measure is not summable and number of groups exceeds limit
      if (
        eligibility.bailIf(
          !isSummable && otherLevel.members.length > BARCHART_MAX_GROUPED_BARS,
          `Grouped series '${otherLevel.name}' contains ${otherLevel.members.length} members and measure '${measure.name}' can't be stacked; limit BARCHART_MAX_GROUPED_BARS = ${BARCHART_MAX_GROUPED_BARS}`,
        )
      ) {
        return [];
      }

      return {
        key: shortHash(keyChain.concat(mainLevel.name, otherLevel.name).join()),
        type: chartType,
        datagroup: datagroup,
        orientation: "horizontal",
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

/**
 * Requirements:
 * - All levels must have with at least 2 members
 * - When aggregator is not sum, bars are grouped (up to 2 dimensions)
 * - Time dimension always has priority as first dimension
 *
 * Notes:
 * - Vertical orientation makes more natural to understand time on x-axis
 * - Also works better for buckets, ranges, brackets, and horizontally-positioned
 *   elements (like timezones)
 */
export function generateVertBarchartConfigs(
  dg: Datagroup,
  {
    BARCHART_MAX_GROUPED_BARS,
    BARCHART_MAX_STACKED_BARS,
    BARCHART_VERTICAL_MAX_GROUPS,
    BARCHART_VERTICAL_MAX_PERIODS,
    BARCHART_VERTICAL_TOTAL_BARS,
  }: ChartLimits,
): BarChart[] {
  const {dataset} = dg;
  const chartType = "barchart" as const;
  const eligibility = new ChartEligibility("barchart-vert");

  const categoryHierarchies = Object.values(dg.nonTimeHierarchies);

  // If all levels, besides the one from time dimension, have only 1 member,
  // then the chart results in a single block
  if (
    categoryHierarchies.every(hierarchy =>
      hierarchy.levels.every(level => level.members.length === 1),
    )
  ) {
    return [];
  }

  const timeline = buildSeriesIf(dg.timeHierarchy, series => {
    const memCount = series.members.length;
    return !eligibility.bailIf(
      memCount < 2 || memCount > BARCHART_VERTICAL_MAX_PERIODS,
      `Time series '${series.name}' contains a ${memCount} members; limit BARCHART_VERTICAL_MAX_PERIODS = ${BARCHART_VERTICAL_MAX_PERIODS}`,
    );
  });

  return dg.measureColumns.flatMap(valueColumn => {
    const {measure, range} = valueColumn;
    const keyChain = [chartType, "vertical", dataset.length, measure.name];
    const isSummable = isSummableMeasure(measure);
    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    // Work only with the mainline measures
    if (valueColumn.parentMeasure) return [];

    // TODO: migrate loop inside if(timeline) to use this, like in generateHoriBartchartConfigs
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

    if (timeline) {
      if (
        eligibility.bailIf(
          timeline.members.length > BARCHART_VERTICAL_MAX_PERIODS,
          `Time series '${timeline.name}' contains ${timeline.members.length} members; limit BARCHART_VERTICAL_MAX_PERIODS = ${BARCHART_VERTICAL_MAX_PERIODS}`,
        )
      ) {
        return [];
      }

      if (allLevels.length === 0) {
        // Wouldn't this generate similar charts to the single measure lineplot?
        console.log(
          "=== TODO: implement barchart vertical with timeline against value ===",
        );
      }

      // If the measures can be summed across a certain dimension, apply stackability
      return allLevels.flatMap<BarChart>(pair => {
        const [catHierarchy, catLevel] = pair;
        const {members, entity: level} = catLevel;

        // Bail if the amount of members in stacked level is out of limits
        if (
          eligibility.bailIf(
            isSummable && members.length > BARCHART_MAX_STACKED_BARS,
            `Stacked series '${level.name}' contains ${members.length} members; limit BARCHART_MAX_STACKED_BARS = ${BARCHART_MAX_STACKED_BARS}`,
          )
        ) {
          return [];
        }

        // Bail if the measure is not summable and number of groups exceeds limit
        if (
          eligibility.bailIf(
            !isSummable && members.length > BARCHART_MAX_GROUPED_BARS,
            `Grouped series '${level.name}' contains ${members.length} members and measure '${measure.name}' can't be stacked; limit BARCHART_MAX_GROUPED_BARS = ${BARCHART_MAX_GROUPED_BARS}`,
          )
        ) {
          return [];
        }

        const totalBars = timeline.members.length * members.length;
        if (
          eligibility.bailIf(
            totalBars > BARCHART_VERTICAL_TOTAL_BARS,
            `Combination of time series '${timeline.name}' and category series '${level.name}' would render ${timeline.members.length} groups of ${members.length} bars, limit BARCHART_VERTICAL_TOTAL_BARS = ${BARCHART_VERTICAL_TOTAL_BARS}`,
          )
        ) {
          return [];
        }

        return {
          key: shortHash(keyChain.concat(timeline.name, catLevel.name).join()),
          type: chartType,
          datagroup: dg,
          orientation: "vertical",
          values,
          series: [timeline, buildSeries(catHierarchy, catLevel)],
          extraConfig: {},
        };
      });
    }

    return [...yieldPartialPermutations(allLevels, 2)].flatMap(tuple => {
      const [mainHierarchy, mainLevel] = tuple[0];
      const [otherHierarchy, otherLevel] = tuple[1];

      // Bail if both levels belong to the same dimension and are not in depth order
      if (
        mainHierarchy === otherHierarchy &&
        mainLevel.entity.depth < otherLevel.entity.depth
      ) {
        return [];
      }

      if (
        eligibility.bailIf(
          mainLevel.members.length > BARCHART_VERTICAL_MAX_GROUPS,
          `Main series '${mainLevel.name}' has ${mainLevel.members.length} members; limit BARCHART_VERTICAL_MAX_GROUPS = ${BARCHART_VERTICAL_MAX_GROUPS}`,
        )
      ) {
        return [];
      }

      const totalBars = mainLevel.members.length * otherLevel.members.length;
      if (
        eligibility.bailIf(
          totalBars > BARCHART_VERTICAL_TOTAL_BARS,
          `Combination of series '${mainLevel.name}' and '${otherLevel.name}' would render ${mainLevel.members.length} groups of ${otherLevel.members.length} bars, limit BARCHART_VERTICAL_TOTAL_BARS = ${BARCHART_VERTICAL_TOTAL_BARS}`,
        )
      ) {
        return [];
      }

      return {
        key: shortHash(keyChain.concat(mainLevel.name, otherLevel.name).join()),
        type: chartType,
        datagroup: dg,
        orientation: "vertical" as const,
        values,
        series: [
          buildSeries(mainHierarchy, mainLevel),
          buildSeries(otherHierarchy, otherLevel),
        ],
        extraConfig: {},
      };
    });
  });
}
