import flatMap from "lodash/flatMap";
import groupBy from "lodash/groupBy";
import sortBy from "lodash/sortBy";
import type {ChartLimits} from "../constants";
import type {
  TesseractDimension,
  TesseractHierarchy,
  TesseractLevel,
  TesseractMeasure,
} from "../schema";
import type {ChartType} from "../structs";
import {filterMap} from "../toolbox/array";
import type {Datagroup} from "../toolbox/datagroup";
import {shortHash} from "../toolbox/math";
import {hasProperty} from "../toolbox/validation";

export interface LinePlot {
  key: string;
  type: "lineplot";
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
    members: string[] | number[] | boolean[];
  };
  time: {
    dimension: TesseractDimension;
    hierarchy: TesseractHierarchy;
    level: TesseractLevel;
    members: string[] | number[];
  };
}

/**
 * Requirements:
 * - time drilldown present
 * - time drilldown with at least LINE_POINT_MIN members
 * - std drilldowns
 */
export function buildLineplot(
  dg: Datagroup,
  {LINEPLOT_LINE_MAX, LINEPLOT_LINE_POINT_MIN}: ChartLimits,
): LinePlot[] {
  const {dataset, timeHierarchy} = dg;
  const chartType: ChartType = "lineplot";

  // Bail if no time dimension present
  if (!timeHierarchy) return [];

  // Keep time levels with enough time points to draw a line
  const timeLevels = timeHierarchy.levels.filter(
    level => timeHierarchy.members[level.name].length > LINEPLOT_LINE_POINT_MIN,
  );
  if (timeLevels.length === 0) return [];

  // Pick only hierarchies from a non-time dimension
  const nonTimeHierarchies = {...dg.geoHierarchies, ...dg.stdHierarchies};
  const qualiAxes = Object.values(nonTimeHierarchies);

  // Pick only levels with member counts under the limit
  const nonTimeLevels = qualiAxes.flatMap(axis =>
    filterMap(axis.levels, level => {
      const members = axis.members[level.name];
      return members.length > 1 && members.length <= LINEPLOT_LINE_MAX
        ? ([axis.hierarchy.name, level] as const)
        : null;
    }),
  );

  return dg.measureColumns
    .filter(axis => !axis.parentMeasure)
    .flatMap(quantiAxis => {
      const {measure, range} = quantiAxis;

      return timeLevels.flatMap(timeLevel => {
        const keyChain = [chartType];

        return nonTimeLevels.flatMap<LinePlot>(([hierarchyName, level]) => {
          const axis = nonTimeHierarchies[hierarchyName];
          return {
            key: shortHash(keyChain.concat().join("|")),
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
              members: axis.members[level.name],
            },
            time: {
              dimension: timeHierarchy.dimension,
              hierarchy: timeHierarchy.hierarchy,
              level: timeLevel,
              members: timeHierarchy.members[timeLevel.name],
            },
          };
        });
      });
    });
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
