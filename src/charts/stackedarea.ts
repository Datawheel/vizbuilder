import type {ChartLimits} from "../constants";
import {
  Aggregator,
  type TesseractDimension,
  type TesseractHierarchy,
  type TesseractLevel,
  type TesseractMeasure,
} from "../schema";
import {filterMap} from "../toolbox/array";
import type {Datagroup, LevelCaption} from "../toolbox/datagroup";
import {yieldPermutations} from "../toolbox/iterator";
import {shortHash} from "../toolbox/math";
import { isOneOf } from "../toolbox/validation";
import {buildTimeSeries} from "./common";

export interface StackedArea {
  key: string;
  type: "stackedarea";
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
  }[];
  timeline?: {
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    members: string[] | number[] | boolean[];
  };
}

export function examineStackedareaConfigs(
  dg: Datagroup,
  {STACKED_SHAPE_MAX, STACKED_TIME_MEMBER_MIN}: ChartLimits,
): StackedArea[] {
  const {dataset, timeHierarchy: timeAxis} = dg;
  const chartType = "stackedarea" as const;

  const categoryAxes = Object.values(dg.nonTimeHierarchies);

  const timeline = buildTimeSeries(timeAxis);

  // Bail if there's no Time dimension
  if (!timeAxis || !timeline) return [];

  // Bail if there's not enough time points to draw a line
  if (timeline.members.length < STACKED_TIME_MEMBER_MIN) return [];

  // Pick only levels with at least 2 members
  const nonTimeLevels = categoryAxes.flatMap(axis =>
    filterMap(axis.levels, axisLevel => {
      return axisLevel.members.length > 1 ? ([axis, axisLevel] as const) : null;
    }),
  );

  // Bail if time dimension is the only valid dimension
  if (categoryAxes.length === 0) return [];

  return dg.measureColumns.flatMap(valueAxis => {
    const {measure, range} = valueAxis;
    const aggregator = measure.annotations.aggregation_method || measure.aggregator;
    const units = measure.annotations.units_of_measurement;

    // Stacked Area charts are valid only with SUM-aggregated measures
    if (![Aggregator.SUM, Aggregator.COUNT, "SUM", "COUNT"].includes(aggregator))
      return [];

    // Bail if measure is marked as 'Percentage' or 'Rate'
    if (["Percentage", "Rate"].includes(units as string)) return []

    // All values must be positive
    if (dataset.some(row => (row[measure.name] as number) < 0)) return [];

    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    const keyChain = [chartType, dataset.length, measure.name];

    return [...yieldPermutations(nonTimeLevels)].flatMap<StackedArea>(
      ([hier1, hier2]) => {
        const [axis1, level1] = hier1;
        const [axis2, level2] = hier2;

        const members1 = level1.members;
        const members2 = level2.members;

        // Bail if the amount of shapes to draw is above the limit
        if (members1.length * members2.length > STACKED_SHAPE_MAX) return [];

        return {
          key: shortHash(keyChain.concat(level1.level.name, level2.level.name).join("|")),
          type: chartType,
          dataset,
          locale: dg.locale,
          values,
          series: [
            {
              dimension: axis1.dimension,
              hierarchy: axis1.hierarchy,
              level: level1.level,
              captions: level1.captions,
              members: members1,
            },
            {
              dimension: axis2.dimension,
              hierarchy: axis2.hierarchy,
              level: level2.level,
              captions: level2.captions,
              members: members2,
            },
          ],
          timeline,
        };
      },
    );
  });
}
