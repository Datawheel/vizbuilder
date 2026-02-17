import {flatMap, groupBy, has, sortBy} from "lodash-es";
import {filterMap} from "../toolbox/array";
import {shortHash} from "../toolbox/math";
import {isSummableMeasure} from "../toolbox/validation";
import type {ChartLimits} from "../types";
import {ChartEligibility} from "./check";
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
  const {dataset} = dg;
  const chartType = "lineplot" as const;
  const eligibility = new ChartEligibility(chartType);

  const categoryHierarchies = Object.values(dg.nonTimeHierarchies);

  const timeline = buildDeepestSeries(dg.timeHierarchy);

  // Bail if no time dimension present
  if (!timeline) {
    eligibility.bailIf(
      !timeline,
      `No time dimension in this request, all lineplots discarded`,
    );
    return [];
  }

  return dg.measureColumns.flatMap(valueColumn => {
    const {measure, range} = valueColumn;
    const keyChain = [chartType, dataset.length, measure.name];
    const finalPlots: LinePlot[] = [];
    const values = {
      measure,
      minValue: range[0],
      maxValue: range[1],
    };

    if (valueColumn.parentMeasure) return [];

    // Bail if the time level doesn't have enough members to draw a line
    const filteredData = dg.dataset.filter(row => row[measure.name] != null);
    const timeMembers = new Set(filteredData.map(row => row[timeline.name]));
    if (
      eligibility.bailIf(
        timeMembers.size < LINEPLOT_LINE_POINT_MIN,
        `Time dimension has ${timeline.members.length} member, not enough to make a meaningful lineplot`,
      )
    ) {
      return [];
    }

    const levelsWithMoreThanOneMember = categoryHierarchies.flatMap(catHierarchy =>
      filterMap(catHierarchy.levels, catLevel => {
        return catLevel.members.length < 2 ? null : ([catHierarchy, catLevel] as const);
      }),
    );

    // Create a total sum plot over time if the aggregator allows it
    if (isSummableMeasure(measure) || levelsWithMoreThanOneMember.length === 0) {
      finalPlots.push({
        key: shortHash(keyChain.join()),
        type: chartType,
        datagroup: dg,
        values,
        series: [],
        timeline,
        extraConfig: {},
      });
    }

    const categoryLinePlots = categoryHierarchies.flatMap(catHierarchy => {
      return catHierarchy.levels.flatMap<LinePlot>(catLevel => {
        const {members} = catLevel;

        if (
          eligibility.bailIf(
            members.length < 2,
            `Level '${catLevel.name}' has ${members.length} members, at least 2 required`,
          )
        ) {
          return [];
        }

        if (
          eligibility.bailIf(
            members.length > LINEPLOT_LINE_MAX,
            `Level '${catLevel.name}' has ${members.length} members, limit LINEPLOT_LINE_MAX = ${LINEPLOT_LINE_MAX}`,
          )
        ) {
          return [];
        }

        return {
          key: shortHash(keyChain.concat(catLevel.name).join()),
          type: chartType,
          datagroup: dg,
          values,
          series: [buildSeries(catHierarchy, catLevel)],
          timeline,
          extraConfig: {},
        };
      });
    });

    return finalPlots.concat(categoryLinePlots);
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
  return dataset.filter(item => has(timeElements, item[mainDrilldownName]));
}
