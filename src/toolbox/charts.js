import {shortHash} from "./math";
import flattenDeep from "lodash/flattenDeep";
import flatMap from "lodash/flatMap";
import {
  buildMemberMap,
  getPermutations,
  getTopTenByPeriod,
  permutationIterator
} from "./array";
import {isGeographicLevel, isTimeLevel} from "./validation";

/** @type {Record<string, VizBldr.ChartType>} */
const CT = {
  BARCHART: "barchart",
  DONUT: "donut",
  GEOMAP: "geomap",
  HISTOGRAM: "histogram",
  LINEPLOT: "lineplot",
  PIE: "pie",
  STACKED: "stacked",
  TREEMAP: "treemap"
};

/**
 * Generates a unique key based on the parameters set for a chart.
 * @param {any[]} dataset
 * @param {import("@datawheel/olap-client").Level[]} levels
 * @param {VizBldr.Struct.MeasureSet} measureSet
 * @param {VizBldr.ChartType} chartType
 */
const keyMaker = (dataset, levels, measureSet, chartType) =>
  shortHash(
    levels
      .map(item => item.caption)
      .concat(measureSet.measure.name, `${dataset.length}`, chartType)
      .join("|")
  );

/**
 * @param {VizBldr.Struct.Datagroup} dg
 * @param {VizBldr.ChartType} chartType
 * @returns {VizBldr.Struct.Chart[]}
 */
export function chartRemixer(dg, chartType) {
  const newCharts = remixerForChartType.hasOwnProperty(chartType)
    ? remixerForChartType[chartType](dg)
    : defaultChart(chartType, dg);
  return newCharts;
}

/**
 * @param {VizBldr.ChartType} chartType
 * @param {VizBldr.Struct.Datagroup} dg
 * @returns {VizBldr.Struct.Chart[]}
 */
function defaultChart(chartType, dg) {
  return flatMap(dg.measureSets, measureSet =>
    flatMap([1, 2], k =>
      Array.from(permutationIterator(dg.stdDrilldowns, k), levels => ({
        chartType,
        dg,
        isMap: levels.some(isGeographicLevel),
        isTimeline: levels.some(isTimeLevel),
        key: keyMaker(dg.dataset, levels, measureSet, chartType),
        levels,
        measureSet
      }))
    )
  );
}

/**
 * @type {Record<string, (dg: VizBldr.Struct.Datagroup) => VizBldr.Struct.Chart[]>}
 */
const remixerForChartType = {

  /**
   * BARCHART
   * - By default is horizontal because improves label readability
   */
  barchart(dg) {
    const {dataset, members, membersCount, timeDrilldown} = dg;
    const stdDrilldowns = dg.drilldowns
      .filter(lvl => lvl !== timeDrilldown && membersCount[lvl.caption] > 1);
    const chartType = CT.BARCHART;

    return flatMap(dg.measureSets, measureSet => {
      const {measure} = measureSet;

      /**
       * Do not show any stacked charts if aggregation_method is "NONE"
       * @see {@link https://github.com/Datawheel/canon/issues/327}
       */
      if (measure.aggregatorType === "UNKNOWN") {
        return [];
      }

      const chartProps = {chartType, dg, measureSet, members};

      return flatMap([...new Set([1, 2, stdDrilldowns.length])], k => 
        Array.from(permutationIterator(stdDrilldowns, k), levels => {
    
          /** Barcharts with more than 20 members are hard to read. */
          if (membersCount[levels[0].caption] > 20) return null;

          /** Disable if all levels, except for level from time dimension, have only 1 member. */
          if (levels.every(lvl => membersCount[lvl.caption] === 1)) return null;

          return {
            ...chartProps,
            levels,
            key: keyMaker(dataset, levels, measureSet, chartType)
          };
        }).filter(Boolean)
      );
    });
  },

  /**
   * BARCHART FOR YEARS
   * - By default is vertical because of time notion
   * - timeLevel required
   */
  barchartyear(dg) {
    const {membersCount, timeDrilldown} = dg;
    const stdDrilldowns = dg.drilldowns.filter(lvl => lvl !== timeDrilldown);
    const firstLevel = stdDrilldowns[0];

    if (

      /** timeLevel is required for obvious reasons */
      !timeDrilldown ||
      membersCount[timeDrilldown.caption] < 2 ||

      /** Barcharts with more than 20 members are hard to read. */
      membersCount[firstLevel.caption] > 20 ||

      /** Disable if all levels, except for timeLevel, have only 1 member. */
      stdDrilldowns.every(lvl => membersCount[lvl.caption] === 1)
    ) {
      return [];
    }

    /**
     * - Stacked bars only work with SUM-aggregated measures
     * - If there's more than 1 level, Percentage and Rate should not be stackable
     * @see {@link https://github.com/Datawheel/canon/issues/487}
     */
    const allowedMeasures = dg.measureSets.filter(
      ({measure}) =>
        ["SUM", "UNKNOWN"].includes(measure.aggregatorType) &&
        (stdDrilldowns.length < 2 || 
          ["Percentage", "Rate"].includes(`${measure.annotations.units_of_measurement}`))
    );

    return defaultChart(CT.BARCHARTYEAR, {...dg, measureSets: allowedMeasures});
  },

  /**
   * DONUT CHART
   * - Donut charts don't work with non-SUM measures
   */
  donut(dg) {
    const allowedMeasures = dg.measureSets.filter(
      measureSet =>
        !["SUM", "UNKNOWN"].includes(measureSet.measure.aggregatorType)
    );

    return defaultChart("donut", {...dg, measureSets: allowedMeasures});
  },

  /**
   * PIE CHART
   * - Works the same as donut
   */
  pie(dg) {
    return remixerForChartType.donut(dg);
  },

  /**
   * GEOMAP
   * - geoLevel required
   */
  geomap(dg) {
    const {cuts, geoDrilldown, stdDrilldowns, members} = dg;

    if (

      /** Disable if there's no user-defined topojson config for the geoLevel */
      !dg.topojsonConfig ||

      /** Disable if there's no geoLevel in this query */
      !geoDrilldown
    ) {
      return [];
    }

    const geoDrilldownName = geoDrilldown.caption;
    const geoDrilldownMembers = members[geoDrilldownName] || [];

    const isGeoPlusUniqueCutQuery = () => {
      const notGeoDrilldown = stdDrilldowns[0];
      if (notGeoDrilldown) {
        const notGeoLvlCut = cuts.get(notGeoDrilldown.caption);
        return notGeoLvlCut && notGeoLvlCut.length === 1;
      }
      return false;
    };

    if (

      /** Disable if the geoLevel has less than 3 regions */
      geoDrilldownMembers.length < 3 ||

      /** If besides geoLevel, there's another level with only one cut */
      stdDrilldowns.length === 1 && !isGeoPlusUniqueCutQuery()
    ) {
      return [];
    }

    return defaultChart(CT.GEOMAP, dg);
  },

  /**
   * HISTOGRAM
   * - TODO: implement bucket detection
   */
  histogram(dg) {
    return [];

    // const allowedMeasures = dg.measureSets.filter(
    //   measureSet => measureSet.measure.aggregatorType !== "BUCKET"
    // );
    // return remixerForChartType.barchart({
    //   ...dg,
    //   measureSets: allowedMeasures
    // });
  },

  /**
   * LINEPLOTS
   * - timeLevel required
   */
  lineplot(dg) {
    const {membersCount, timeDrilldown} = dg;

    /** timeLevel is required on stacked area charts */
    if (!timeDrilldown || membersCount[timeDrilldown.caption] < 2) {
      return [];
    }

    const stdDrilldowns = dg.drilldowns.filter(lvl => lvl !== timeDrilldown);

    const timesFn = (total, lvl) => total * membersCount[lvl.caption];
    const memberTotal = stdDrilldowns.reduce(timesFn, 1);

    /*
     * If there's more than 60 lines in a lineplot, only show top ten each year.
     * Due to the implementation, this remove lineplot from this datagroup
     * and creates a new datagroup, lineplot-only, for the new trimmed dataset.
     * @see Issue#296 on {@link https://github.com/Datawheel/canon/issues/296 | GitHub}
     */
    if (memberTotal > 60) {
      const newDataset = getTopTenByPeriod(dg.dataset, {
        timeDrilldownName: timeDrilldown.caption,
        firstDrilldownName: stdDrilldowns[0].caption
      });

      const drilldownNames = dg.drilldowns.map(lvl => lvl.caption);
      const {members, membersCount} = buildMemberMap(newDataset, drilldownNames);

      return dg.measureSets.map(measureSet => ({
        chartType: CT.LINEPLOT,
        dg: {...dg, dataset: newDataset, members, membersCount},
        isTopTen: true,
        key: keyMaker(newDataset, stdDrilldowns, measureSet, CT.LINEPLOT),
        levels: stdDrilldowns,
        measureSet
      }));
    }

    return defaultChart(CT.LINEPLOT, dg);
  },

  /**
   * STACKED AREA
   * - timeLevel required.
   */
  stacked(dg) {
    const {drilldowns, membersCount, timeDrilldown} = dg;

    if (

      /** timeLevel is required on stacked area charts */
      !timeDrilldown ||
      membersCount[timeDrilldown.caption] < 2 ||

      /** Disable if there will be more than 200 shapes in the chart */
      drilldowns.reduce((total, lvl) => total * membersCount[lvl.caption], 1) > 200 ||

      /** Disable if all levels, especially timeLevel, contain only 1 member */
      drilldowns.every(lvl => membersCount[lvl.caption] === 1)
    ) {
      return [];
    }

    /**
     * - Don't show stacked charts if aggregation_method is "NONE"
     * - Don't show total bar for Percentages and Rates
     * @see {@link https://github.com/Datawheel/canon/issues/327}
     * @see {@link https://github.com/Datawheel/canon/issues/487}
     */
    const allowedMeasures = dg.measureSets.filter(
      ({measure}) =>
        ["AVG", "AVERAGE", "MEDIAN", "NONE"].indexOf(measure.aggregatorType) > -1 ||
        ["Percentage", "Rate"].indexOf(`${measure.annotations.units_of_measurement}`) > -1 &&
          membersCount[drilldowns[0].caption] > 1
    );

    return defaultChart("stacked", {...dg, measureSets: allowedMeasures});
  },

  /**
   * TREEMAPS
   */
  treemap(dg) {
    const {dataset, drilldowns, membersCount, members, timeDrilldown} = dg;
    const stdDrilldowns = drilldowns.filter(lvl => lvl !== timeDrilldown);
    const chartType = CT.TREEMAP;

    if (

      /**
       * Disable if there will be more than 1000 shapes in the chart
       * TODO: Implement threshold parameters and remove this
       */
      stdDrilldowns.reduce((total, lvl) => total * membersCount[lvl.caption], 1) > 1000 ||

      /** Disable if all levels, except for timeLevel, have only 1 member. */
      stdDrilldowns.every(lvl => membersCount[lvl.caption] === 1)
    ) {
      return [];
    }

    const chartReductions = dg.measureSets.map(measureSet => {
      const {measure} = measureSet;

      if (

        /** Treemaps only work with SUM-aggregated measures  */
        !["SUM", "UNKNOWN"].includes(measure.aggregatorType) ||

        /** @see {@link https://github.com/Datawheel/canon/issues/487} */
        ["Percentage", "Rate"].indexOf(`${measure.annotations.units_of_measurement}`) > -1 &&
          membersCount[stdDrilldowns[0].caption] > 1
      ) {
        return [];
      }

      const relevantLevels = stdDrilldowns.filter(lvl => membersCount[lvl.caption] > 1);
      const chartProps = {chartType, dataset, dg, measureSet, members};
      return getPermutations(relevantLevels).map(levels => ({
        ...chartProps,
        levels,
        key: keyMaker(dataset, levels, measureSet, chartType)
      }));
    });

    return flattenDeep(chartReductions).filter(Boolean);
  }
};
