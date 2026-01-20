import {filterMap} from "../toolbox/array";
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
  const {dataset} = datagroup;
  const chartType = "barchart" as const;

  const categoryHierarchies = Object.values(datagroup.nonTimeHierarchies);

  // In horizontal barcharts, always separate timeline to the interactive dimension
  const timeline = buildDeepestSeries(datagroup.timeHierarchy);

  return datagroup.measureColumns.flatMap(valueColumn => {
    const {measure, range} = valueColumn;
    const aggregator = measure.annotations.aggregation_method || measure.aggregator;
    const units = measure.annotations.units_of_measurement || "";

    // Work only with the mainline measures
    if (valueColumn.parentMeasure) return [];

    // Bail if the measure can't be summed, or doesn't represent percentage, rate, or proportion
    if (
      categoryHierarchies.length > 1 &&
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
        return [catHierarchy, catLevel] as const;
      }),
    );

    if (allLevels.length === 1) {
      return allLevels.flatMap<BarChart>(pair => {
        const [mainHierarchy, mainLevel] = pair;

        // Bail if the amount of members in main level is out of limits
        if (mainLevel.members.length > BARCHART_MAX_BARS) {
          console.debug(
            "[%s] Unique series '%s' contains %d members; limit BARCHART_MAX_BARS = %d",
            chartType,
            mainLevel.name,
            mainLevel.members.length,
            BARCHART_MAX_BARS,
          );
          return [];
        }

        return {
          key: shortHash(
            [chartType, dataset.length, measure.name, mainLevel.name].join(),
          ),
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
      const keyChain = [chartType, dataset.length, measure.name];

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
      if (mainLevel.members.length > BARCHART_MAX_BARS) {
        console.debug(
          "[%s] Main series '%s' contains %d members; limit BARCHART_MAX_BARS = %d",
          chartType,
          mainLevel.name,
          mainLevel.members.length,
          BARCHART_MAX_BARS,
        );
        return [];
      }

      // Bail if the amount of members in stacked level is out of limits
      if (otherLevel.members.length > BARCHART_MAX_STACKED_BARS) {
        console.debug(
          "[%s] Stacked series '%s' contains %d members; limit BARCHART_MAX_STACKED_BARS = %d",
          chartType,
          otherLevel.name,
          otherLevel.members.length,
          BARCHART_MAX_STACKED_BARS,
        );
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
 */
export function generateVertBarchartConfigs(
  dg: Datagroup,
  {
    BARCHART_YEAR_MAX_BARS,
    BARCHART_VERTICAL_MAX_GROUPS,
    BARCHART_VERTICAL_TOTAL_BARS,
  }: ChartLimits,
): BarChart[] {
  const {dataset} = dg;
  const chartType = "barchart" as const;

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
    if (memCount < 2) {
      console.debug(
        "[%s] Time series '%s' contains a single member",
        chartType,
        series.name,
      );
      return false;
    }
    return true;
  });

  return dg.measureColumns.flatMap(valueColumn => {
    const {measure, range} = valueColumn;
    const units = measure.annotations.units_of_measurement || "";
    const isPercentage = ["Percentage", "Rate"].some(token => units.includes(token));

    // Work only with the mainline measures
    if (valueColumn.parentMeasure) return [];

    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    // TODO: migrate loop inside if(timeline) to use this, like in generateHoriBartchartConfigs
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
        return [catHierarchy, catLevel] as const;
      }),
    );

    if (timeline) {
      // Percentages can't be summed if split in more than 1 dimension
      if (allLevels.length > 1 && isPercentage) return [];

      // In vertical barcharts the time dimension should be the primary series.
      // If present, mix it with all available levels, and discard from there.
      return categoryHierarchies.flatMap(catHierarchy => {
        const keyChain = [chartType, "vertical", dataset.length, measure.name];

        return catHierarchy.levels.flatMap<BarChart>(catLevel => {
          const {members} = catLevel;

          // Bail if amount of segments is out of bounds
          if (members.length < 2 || members.length > BARCHART_YEAR_MAX_BARS) {
            return [];
          }

          const totalBars = timeline.members.length * members.length;
          if (totalBars > BARCHART_VERTICAL_TOTAL_BARS) {
            console.debug(
              "[%s] Attempt to render %d groups of %d bars, limit BARCHART_VERTICAL_TOTAL_BARS = %d",
              chartType,
              timeline.members.length,
              members.length,
              BARCHART_VERTICAL_TOTAL_BARS,
            );
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
      });
    }

    return [...yieldPartialPermutations(categoryHierarchies, 2)].flatMap(tuple => {
      const mainHierarchy = tuple[0];
      const otherHierarchy = tuple[1];

      return mainHierarchy.levels.flatMap(mainLevel => {
        const mainMemCount = mainLevel.members.length;
        if (mainMemCount < 2 || mainMemCount > BARCHART_VERTICAL_MAX_GROUPS) {
          return [];
        }

        return otherHierarchy.levels.flatMap<BarChart>(otherLevel => {
          if (otherLevel.members.length < 2) {
            return [];
          }

          const totalBars = mainLevel.members.length * otherLevel.members.length;
          if (totalBars > BARCHART_VERTICAL_TOTAL_BARS) {
            console.debug(
              "[%s] Attempt to render %d groups of %d bars, limit BARCHART_VERTICAL_TOTAL_BARS = %d",
              chartType,
              mainLevel.members.length,
              otherLevel.members.length,
              BARCHART_VERTICAL_TOTAL_BARS,
            );
            return [];
          }

          const keyChain = [
            chartType,
            "vertical",
            dataset.length,
            measure.name,
            mainLevel.name,
            otherLevel.name,
          ].join();

          return {
            key: shortHash(keyChain),
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
    });
  });
}
