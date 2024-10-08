import flatMap from "lodash/flatMap";
import groupBy from "lodash/groupBy";
import sortBy from "lodash/sortBy";
import type {ChartLimits} from "../constants";
import type {Aggregator} from "../schema";
import {getLast} from "../toolbox/array";
import type {Datagroup} from "../toolbox/datagroup";
import {hasProperty} from "../toolbox/validation";

export interface LinePlot {
  key: string;
  type: "lineplot";
  dataset: Record<string, unknown>[];
  locale: string;
  values: {
    name: string;
    caption: string;
    aggregator: Aggregator;
    minValue: number;
    maxValue: number;
  };
  series: {
    name: string;
    caption: string;
    members: string[] | number[] | boolean[];
  };
  time: {
    name: string;
    caption: string;
    members: string[] | number[];
  };
}

/**
 * Requirements:
 * - time drilldown present
 * - time drilldown with at least LINE_POINT_MIN members
 * - std drilldowns
 */
export function buildLineplot(dg: Datagroup, chartLimits: ChartLimits): LinePlot[] {
  const {dataset, timeHierarchy} = dg;

  // Bail if no time dimension present
  if (!timeHierarchy) return [];

  // Bail if there's not enough members to draw a line (only points)
  if (
    timeHierarchy.members[getLast(timeHierarchy.levels).name].length <
    chartLimits.LINEPLOT_LINE_POINT_MIN
  ) {
    return [];
  }

  // Pick only hierarchies from a non-time dimension
  const qualiAxes = [
    ...Object.values(dg.geoHierarchies),
    ...Object.values(dg.stdHierarchies),
  ].filter(
    axis =>
      axis.members[getLast(axis.levels).name].length <= chartLimits.LINEPLOT_LINE_MAX,
  );

  // if there are non-time drilldowns with a valid number of members...
  const validDrilldowns =
    otherDrilldownsUnderMemberLimit.length > 0
      ? otherDrilldownsUnderMemberLimit // use this list
      : otherDrilldowns.length > 0 // but if there are non-time drilldowns but none are under the line threshold
        ? [] // show nothing
        : [false]; // finally, if there is only a time dimension, show a single line chart

  return dg.measureColumns
    .filter(axis => !axis.parentMeasure)
    .flatMap(quantiAxis =>
      validDrilldowns.map(level => {
        const levels = level ? [level] : [];
        return {
          chartType: CT.LINEPLOT,
          dg,
          isMap: false,
          isTimeline: false, // time level is plotted on an axis in line plot
          key: keyMaker(dg.dataset, levels, quantiAxis, CT.LINEPLOT),
          levels,
          measureSet: quantiAxis,
        };
      }),
    );
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
