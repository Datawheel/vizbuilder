import {flatMap, groupBy, sortBy} from "lodash-es";
import {shortHash} from "../toolbox/math";
import {hasProperty} from "../toolbox/validation";
import type {ChartLimits} from "../types";
import {type BaseChart, buildDeepestSeries, buildSeries} from "./common";
import type {Datagroup} from "./datagroup";

export interface LinePlot extends BaseChart {
  type: "lineplot";
  timeline: NonNullable<BaseChart["timeline"]>;
}

/**
 * Requirements:
 * - time dimension present
 * - time level with at least LINE_POINT_MIN members
 * - at least one std level
 */
export function generateLineplotConfigs(
  dg: Datagroup,
  {LINEPLOT_LINE_MAX, LINEPLOT_LINE_POINT_MIN}: ChartLimits,
): LinePlot[] {
  const {dataset, timeHierarchy: timeAxis} = dg;
  const chartType = "lineplot" as const;

  const categoryAxes = Object.values(dg.nonTimeHierarchies);

  const timeline = buildDeepestSeries(timeAxis);

  // Bail if no time dimension present
  if (!timeAxis || !timeline) return [];

  // Bail if the time level doesn't have enough members to draw a line
  if (timeline.members.length < LINEPLOT_LINE_POINT_MIN) return [];

  const metricChart: LinePlot[] = dg.measureColumns.map(col => {
    return {
      key: shortHash([chartType, dataset.length, col.measure.name].join("|")),
      type: chartType,
      datagroup: dg,
      values: {
        measure: col.measure,
        minValue: col.range[0],
        maxValue: col.range[1],
      },
      series: [],
      timeline,
      extraConfig: {},
    };
  });

  return dg.measureColumns
    .flatMap(valueAxis => {
      const {measure, range} = valueAxis;

      if (valueAxis.parentMeasure) return [];

      const values = {
        measure,
        minValue: range[0],
        maxValue: range[1],
      };

      return categoryAxes.flatMap(categoryAxis => {
        const keyChain = [chartType, dataset.length, measure.name];

        return categoryAxis.levels.flatMap<LinePlot>(axisLevel => {
          const {level, members} = axisLevel;

          // Pick only levels with member counts within the limit
          if (members.length < 2 || members.length > LINEPLOT_LINE_MAX) return [];

          return {
            key: shortHash(keyChain.concat(level.name).join("|")),
            type: chartType,
            datagroup: dg,
            values,
            series: [buildSeries(categoryAxis, axisLevel)],
            timeline,
            extraConfig: {},
          };
        });
      });
    })
    .concat(metricChart);
}

export function getTopTenByPeriod<T>(
  dataset: T[],
  {
    mainDrilldownName,
    measureName,
    timeDrilldownName,
  }: {mainDrilldownName: string; measureName: string; timeDrilldownName: string},
): T[] {
  const datasetByPeriod = groupBy(dataset, timeDrilldownName);

  const topTenPointsOfEachPeriod = flatMap(datasetByPeriod, points =>
    sortBy(points, measureName).slice(-10),
  );
  const topTenDrilldownMembers = groupBy(topTenPointsOfEachPeriod, mainDrilldownName);

  if (Object.keys(topTenDrilldownMembers).length < 12) {
    return topTenPointsOfEachPeriod;
  }

  const periodList = Object.keys(datasetByPeriod).sort();
  const lastPeriod = periodList[periodList.length - 1];
  const lastPeriodDataset = sortBy(datasetByPeriod[lastPeriod], measureName).slice(-10);
  const timeElements = groupBy(lastPeriodDataset, mainDrilldownName);
  return dataset.filter(item => hasProperty(timeElements, item[mainDrilldownName]));
}
