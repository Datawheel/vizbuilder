import flatMap from "lodash/flatMap";
import flattenDeep from "lodash/flattenDeep";
import includes from "lodash/includes";
import range from "lodash/range";
import {
  buildMemberMap,
  getPermutations,
  getTopTenByPeriod,
  permutationIterator
} from "./array";
import {shortHash} from "./math";
import {isGeographicLevel, isTimeLevel} from "./validation";

/** @type {Record<string, VizBldr.ChartType>} */
const CT = {
  BARCHART: "barchart",
  BARCHARTYEAR: "barchartyear",
  DONUT: "donut",
  GEOMAP: "geomap",
  HISTOGRAM: "histogram",
  LINEPLOT: "lineplot",
  PIE: "pie",
  STACKED: "stacked",
  TREEMAP: "treemap"
};

/**
 * Parameters for determining the constraints and limits of certain chart types
 */
const CHART_LIMITS = {
  MAX_BARS: 20,
  LINE_POINT_MIN: 2,
  LINE_TOP_TEN_THRESHOLD: 60,
  LINE_MAX: 20,
  STACKED_SHAPE_MAX: 200,
  TREE_MAP_MAX_SHAPE: 1000
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
 * Creates zero or more chart config objects for a given ChartType based on what the data looks like
 *    and what the specified chart type allows
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
 * Default Chart builder that creates a chart for each combination of measure and drilldown combination
 * @param {VizBldr.ChartType} chartType
 * @param {VizBldr.Struct.Datagroup} dg
 * @returns {VizBldr.Struct.Chart[]}
 */
function defaultChart(chartType, dg) {
  const kValues = range(1, dg.stdDrilldowns.length + 1);
  return flatMap(dg.measureSets, measureSet =>
    flatMap(kValues, k =>
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
 * Map of ChartType -> function for building valid Chart config arrays
 * @type {Record<string, (dg: VizBldr.Struct.Datagroup) => VizBldr.Struct.Chart[]>}
 */
const remixerForChartType = {

  /**
   * BARCHART
   * Requirements:
   * - at least one non-time drilldown with more than one member
   * - measure that is not of aggregation type "UNKNOWN"
   * - first drilldown (in each combination of drilldowns) has less than CHART_LIMIT.MAX_BAR members
   * 
   * Notes:
   * - By default is horizontal because improves label readability
   */
  barchart(dg) {
    const chartType = CT.BARCHART;
    const {dataset, members, membersCount, timeDrilldown} = dg;

    // get all drilldowns that are not time-related and have more than one member
    const validDrilldowns = dg.drilldowns
      .filter(lvl => lvl !== timeDrilldown && membersCount[lvl.caption] > 1);

    /* DISABLE if no non-time drilldowns with more than one member */
    if (validDrilldowns.length === 0) return [];

    /**
     * Do not show any stacked charts if aggregation_method is "NONE"
     * @see {@link https://github.com/Datawheel/canon/issues/327}
     */
    const validMeasures =
      dg.measureSets.filter(measureSet => measureSet?.measure?.aggregatorType && measureSet.measure.aggregatorType !== "UNKNOWN");

    return flatMap(validMeasures, measureSet => {
      const chartProps = {chartType, dg, measureSet, members};
      const kValues = range(1, validDrilldowns.length + 1);

      return flatMap(kValues, k =>
        Array.from(permutationIterator(validDrilldowns, k), levels => {

          /** Disable if too many bars would make the chart unreadable */
          if (membersCount[levels[0].caption] > CHART_LIMITS.MAX_BARS) return null;

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
   * 
   * Requirements:
   * - timeLevel with at least 2 members
   * - if std drilldowns exist, not all have only one member
   * 
   * Notes:
   * - By default is vertical because of time notion
   */
  barchartyear(dg) {
    const {membersCount, timeDrilldown, stdDrilldowns} = dg;
    const firstLevel = stdDrilldowns[0] || timeDrilldown;

    /* DISABLE IF... */
    if (
      /* no time level present */
      !timeDrilldown ||

      /* time level has less than 2 members */
      membersCount[timeDrilldown.caption] < 2 ||

      /** Barcharts with more than 20 members are hard to read. */
      // membersCount[firstLevel.caption] > 20 ||

      /** all levels, except for timeLevel, have only 1 member. */
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
        includes(["SUM", "UNKNOWN"], measure.aggregatorType) &&
        (stdDrilldowns.length < 2 || includes(["Percentage", "Rate"], measure.annotations.units_of_measurement))
    );

    return defaultChart(CT.BARCHARTYEAR, {...dg, measureSets: allowedMeasures});
  },

  /**
   * DONUT CHART
   * 
   * Requirements:
   * - measure cannot have SUM or UNKNOWN aggregation type
   */
  donut(dg) {
    const allowedMeasures = dg.measureSets.filter(
      measureSet => !includes(["SUM", "UNKNOWN"], measureSet.measure.aggregatorType)
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
   * 
   * Requirements:
   * - geoLevel 
   * - topoJsonConfig
   * - 2 or less drilldowns
   * - more than 3 geo level members
   */
  geomap(dg) {
    const {cuts, drilldowns, geoDrilldown, stdDrilldowns, membersCount} = dg;

    /* DISABLE IF... */
    if (
      /* there's no user-defined topojson config for the geoLevel */
      !dg.topojsonConfig ||

      /* there's no geoLevel in this query */
      !geoDrilldown ||

      /* more than one other drilldown dimension */
      drilldowns.length > 2 ||

      /* geoLevel has less than 3 regions */
      membersCount[geoDrilldown.caption] < 3 ||

      /* there's a standard drilldown dimension with more than one cut */
      (stdDrilldowns[0] && (cuts.get(stdDrilldowns[0]?.caption)?.length || 1) > 1)
    ) {
      return [];
    }

    /*
      Assumptions at this point:
      - one geo level with 3 or more members
      - no other levels
      -   OR one standard level with a cut of only one member
      -   OR one time level
     */

    // TODO - add in logic to iterate over a standard drilldown level with only a few cuts or members

    return flatMap(dg.measureSets, measureSet => ({
      chartType: CT.GEOMAP,
      dg,
      isMap: true,
      isTimeline: !!dg.timeDrilldown,
      key: keyMaker(dg.dataset, drilldowns, measureSet, CT.GEOMAP),
      levels: drilldowns,
      measureSet
    }));  
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
   * 
   * Requirements:
   * - time drilldown with at least LINE_POINT_MIN members
   * - std drilldowns
   */
  lineplot(dg) {
    const {membersCount, timeDrilldown, stdDrilldowns} = dg;

    /** timeLevel is required on stacked area charts */
    if (!timeDrilldown || membersCount[timeDrilldown.caption] < CHART_LIMITS.LINE_POINT_MIN) {
      return [];
    }
    /* Get total number of lines by combination of all standard drilldowns */
    const memberTotal = stdDrilldowns.reduce((total, lvl) => total * membersCount[lvl.caption], 1);

    /**
     * If there's more than CHART_LIMITS.LINE_MAX lines in a lineplot, only show top ten each year.
     * @see {@link https://github.com/Datawheel/canon/issues/296 | Issue#296 on GitHub}
     */
    if (memberTotal > CHART_LIMITS.LINE_TOP_TEN_THRESHOLD) {
      return dg.measureSets.map(measureSet => {
        const newDataset = getTopTenByPeriod(dg.dataset, {
          measureName: measureSet.measure.name,
          timeDrilldownName: timeDrilldown.caption,
          mainDrilldownName: stdDrilldowns[0].caption
        });

        const drilldownNames = dg.drilldowns.map(lvl => lvl.caption);
        const {members, membersCount} = buildMemberMap(newDataset, drilldownNames);

        /** @type {VizBldr.Struct.Chart[]} */
        return {
          chartType: CT.LINEPLOT,
          dg: {...dg, dataset: newDataset, members, membersCount},
          isTopTen: true,
          key: keyMaker(newDataset, stdDrilldowns, measureSet, CT.LINEPLOT),
          levels: stdDrilldowns,
          measureSet
        };
      });
    }

    // get list of all non-time drilldowns (geo + standard) with less than CHART_LIMITS.LINE_MAX members
    let otherDrilldowns =
      (dg.stdDrilldowns || []).concat((dg.geoDrilldown ? [dg.geoDrilldown] : []))
      .filter(lvl => dg.membersCount[lvl.caption] <= CHART_LIMITS.LINE_MAX);

    // for each measure...
    return flatMap(dg.measureSets, measureSet =>
      // if other drilldowns exist, create one for each
      // unless there are none, in which case we will draw a one-line chart
      (otherDrilldowns.length > 0 ? otherDrilldowns : [false]).map(level => {
        const levels = level ? [level] : [];
        return {
          chartType: CT.LINEPLOT,
          dg,
          isMap: isGeographicLevel(level),
          isTimeline: false, // time level is plotted on x-axis in line plot
          key: keyMaker(dg.dataset, levels, measureSet, CT.LINEPLOT),
          levels,
          measureSet
        };
      })
    );
  },

  /**
   * STACKED AREA
   * 
   * Requirements:
   * - timeLevel
   * - total combination of datapoint groups is less than CHART_LIMITS.STACKED_SHAPE_MAX
   * - measure is not aggregation type of AVG, MEDIAN, or NONE
   */
  stacked(dg) {
    const {drilldowns, membersCount, timeDrilldown} = dg;

    /* DISABLE IF... */
    if (
      /** timeLevel is required on stacked area charts */
      !timeDrilldown ||
      membersCount[timeDrilldown.caption] < 2 ||

      /** Disable if there will be more than CHART_LIMITS.STACKED_SHAPE_MAX shapes in the chart */
      drilldowns.reduce((total, lvl) => total * membersCount[lvl.caption], 1) > CHART_LIMITS.STACKED_SHAPE_MAX ||

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
        !includes(["AVG", "AVERAGE", "MEDIAN", "NONE"], measure.aggregatorType) ||
        includes(["Percentage", "Rate"], measure.annotations.units_of_measurement) &&
          membersCount[drilldowns[0].caption] > 1
    );

    return defaultChart("stacked", {...dg, measureSets: allowedMeasures});
  },

  /**
   * TREEMAPS
   * 
   * Requirements:
   * - drilldown 
   */
  treemap(dg) {
    const {dataset, membersCount, members, timeDrilldown, stdDrilldowns} = dg;
    const chartType = CT.TREEMAP;

    /* DISABLE IF... */
    if (
      // only drilldown is time level
      (timeDrilldown && stdDrilldowns.length === 0) ||

      // there will be more than ChartLimits.TREE_MAP_MAX_SHAPE shapes in the chart
      stdDrilldowns.reduce((total, lvl) => total * membersCount[lvl.caption], 1) > CHART_LIMITS.TREE_MAP_MAX_SHAPE ||

      // all levels, except for timeLevel, have only 1 member.
      stdDrilldowns.every(lvl => membersCount[lvl.caption] === 1)

    ) {
      return [];
    }
    
    const relevantLevels = stdDrilldowns.filter(lvl => membersCount[lvl.caption] > 1);
    
    const chartReductions = dg.measureSets.map(measureSet => {
      const {measure} = measureSet;

      if (

        /** Treemaps only work with SUM-aggregated measures  */
        !includes(["SUM", "UNKNOWN"], measure.aggregatorType) ||

        /** @see {@link https://github.com/Datawheel/canon/issues/487} */
        includes(["Percentage", "Rate"], measure.annotations.units_of_measurement) &&
          membersCount[stdDrilldowns[0].caption] > 1
      ) {
        return [];
      }
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
