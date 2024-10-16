import type {ChartLimits} from "../constants";
import type {
  TesseractDimension,
  TesseractHierarchy,
  TesseractLevel,
  TesseractMeasure,
} from "../schema";
import {filterMap, getLast} from "../toolbox/array";
import type {Datagroup, LevelCaption} from "../toolbox/datagroup";
import {yieldPartialPermutations} from "../toolbox/iterator";
import {shortHash} from "../toolbox/math";
import {aggregatorIn, buildSeries, buildTimeSeries} from "./common";

// TODO: add criteria
// bail if sum measure && sum of all values for each series is the same

// TODO: encode stacked bars in the config
export interface BarChart {
  key: string;
  type: "barchart";
  datagroup: Datagroup;
  orientation: "vertical" | "horizontal";
  values: {
    measure: TesseractMeasure;
    minValue: number;
    maxValue: number;
  };
  series: {
    name: string;
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    captions: {[K: string]: LevelCaption};
    members: string[] | number[] | boolean[];
  }[];
  timeline?: {
    name: string;
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    members: string[] | number[] | boolean[];
  };
}

export function examineBarchartConfigs(
  datagroup: Datagroup,
  chartLimits: ChartLimits,
): BarChart[] {
  return [
    ...examineHoriBartchartConfigs(datagroup, chartLimits),
    // ...examineVertBarchartConfigs(datagroup, chartLimits),
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
export function examineHoriBartchartConfigs(
  datagroup: Datagroup,
  {BARCHART_MAX_BARS}: ChartLimits,
): BarChart[] {
  const {dataset, timeHierarchy: timeAxis} = datagroup;
  const chartType = "barchart" as const;

  const categoryAxes = Object.values(datagroup.nonTimeHierarchies);

  const timeline = buildTimeSeries(timeAxis);

  const dimensionCount = (timeAxis ? 1 : 0) + categoryAxes.length;

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

    // Bail if the measure can't be summed and there are more than 1 dimension
    // TODO: refine, needs validation
    if (
      dimensionCount > 1 &&
      !aggregatorIn(aggregator, ["SUM"]) &&
      !["Rate", "Percentage"].includes(units)
    ) {
      console.debug(
        chartType,
        `Data is sliced in ${dimensionCount} dimensions and measure '${measure.name}' is not a SUM and measured as '${units}'`,
      );
      return [];
    }

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
            chartType,
            `Level ${level.name} contains ${members.length} members, out of bounds`,
          );
          return false;
        }
        return true;
      });

    return [...yieldPartialPermutations(allLevels, 2)].flatMap(tuple => {
      const keyChain = [chartType, dataset.length, measure.name];

      const [mainAxis, mainAxisLevel] = tuple[0];
      const [otherAxis, otherAxisLevel] = tuple[1];

      // Bail if the amount of members is out of limits
      if (
        mainAxisLevel.members.length * otherAxisLevel.members.length >
        BARCHART_MAX_BARS
      ) {
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
      };
    });
  });
}

/**
 * Requirements:
 * - All levels must have with at least 2 members
 * - If dimensions other than time, measure aggregator must be sum
 *
 * Notes:
 * - Vertical orientation is more natural to understand time on x-axis
 */
export function examineVertBarchartConfigs(
  dg: Datagroup,
  {BARCHART_YEAR_MAX_BARS}: ChartLimits,
): BarChart[] {
  const {dataset, timeHierarchy: timeAxis} = dg;
  const chartType = "barchart" as const;

  const categoryAxes = Object.values(dg.nonTimeHierarchies);

  const timeline = buildTimeSeries(timeAxis);

  // Bail if no time dimension present
  if (!timeAxis || !timeline) return [];

  // Bail if the time level has less than 2 members
  const deepestTimeLevel = getLast(timeAxis.levels);
  if (deepestTimeLevel.members.length < 2) return [];

  // If all levels, besides the one from time dimension, have only 1 member,
  // then the chart results in a single block
  if (categoryAxes.every(axis => axis.levels.every(level => level.members.length === 1)))
    return [];

  return (
    dg.measureColumns
      // Work only with the mainline measures
      .filter(axis => !axis.parentMeasure)
      .flatMap(valueAxis => {
        const {measure, range} = valueAxis;

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

          return categoryAxis.levels.flatMap<BarChart>(axisLevel => {
            const {captions, level, members, name} = axisLevel;

            // Bail if amount of segments is out of bounds
            if (members.length < 2 || members.length > BARCHART_YEAR_MAX_BARS) return [];

            return {
              key: shortHash(keyChain.concat().join("|")),
              type: chartType,
              datagroup: dg,
              orientation: "vertical",
              values,
              series: [timeline, {name, dimension, hierarchy, level, captions, members}],
            };
          });
        });
      })
  );
}
