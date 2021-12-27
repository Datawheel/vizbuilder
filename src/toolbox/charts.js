import flatMap from "lodash/flatMap";
import flattenDeep from "lodash/flattenDeep";
import includes from "lodash/includes";
import range from "lodash/range";

import {
  getPermutations,
  permutationIterator
} from "./array";
import {shortHash} from "./math";
import {dataIsSignConsistent, isGeographicLevel, isTimeLevel} from "./validation";

/** @type {Record<string, VizBldr.ChartType>} */
export const CT = {
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

/** List of ChartTypes that do not directly visualize time dimensions but might show time via timeline feature */
const TIME_NATIVE_CHART_TYPES = [
  CT.BARCHARTYEAR, CT.LINEPLOT, CT.STACKED
];

/**
 * Returns a combined list of all drilldowns that are NOT of a time type
 * @param {VizBldr.Struct.Datagroup} dg 
 * @returns {import("@datawheel/olap-client").Level[]} List of combined non-time levels
 */
const getNonTimeDrilldowns = dg => dg.drilldowns.filter(lvl => !isTimeLevel(lvl));

/**
 * Returns a combined list of all drilldowns that are NOT of a geographical type
 * @param {VizBldr.Struct.Datagroup} dg 
 * @returns {import("@datawheel/olap-client").Level[]} List of combined non-geo levels
 */
const getNonGeoDrilldowns = dg => dg.drilldowns.filter(lvl => !isGeographicLevel(lvl));

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
 * @param {VizBldr.ChartLimits} chartLimits
 * @returns {VizBldr.Struct.Chart[]}
 */
export function chartRemixer(dg, chartType, chartLimits) {
  const newCharts = remixerForChartType.hasOwnProperty(chartType)
    ? remixerForChartType[chartType](dg, chartLimits)
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
      // get different combinations of non-time (discrete) drilldowns
      Array.from(permutationIterator(getNonTimeDrilldowns(dg), k), levels => ({
        chartType,
        dg,
        isMap: levels.some(isGeographicLevel),
        // timeline is only possible if time drilldown is present and the chartType does not include a time axis already
        isTimeline: !!dg.timeDrilldown && !TIME_NATIVE_CHART_TYPES.includes(chartType),
        key: keyMaker(dg.dataset, levels, measureSet, chartType),
        levels,
        measureSet
      }))
    )
  );
}

/**
 * Map of ChartType -> function for building valid Chart config arrays
 * @type {Record<string, (dg: VizBldr.Struct.Datagroup, chartLimits: VizBldr.ChartLimits) => VizBldr.Struct.Chart[]>}
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
  barchart(dg, chartLimits) {
    const chartType = CT.BARCHART;
    const {dataset, members, membersCount, timeDrilldown} = dg;

    // get all drilldowns that are not time-related and have more than one member
    const validDrilldowns = getNonTimeDrilldowns(dg).filter(lvl => membersCount[lvl.caption] > 1);

    /* DISABLE if no non-time drilldowns with more than one member */
    if (validDrilldowns.length === 0) return [];

    /**
     * Do not show any stacked charts if aggregation_method is "NONE"
     * @see {@link https://github.com/Datawheel/canon/issues/327}
     */
    const validMeasures =
      dg.measureSets.filter(measureSet => measureSet?.measure?.aggregatorType && measureSet.measure.aggregatorType !== "UNKNOWN");

    const isTimeline = !!timeDrilldown;

    return flatMap(validMeasures, measureSet => {
      const chartProps = {chartType, dg, measureSet, members, isTimeline};
      const kValues = range(1, validDrilldowns.length + 1);

      /** @type {VizBldr.Struct.Chart[]} */
      return flatMap(kValues, k =>
        Array.from(permutationIterator(validDrilldowns, k), levels => {

          // TODO: change this to compute the product of different drilldowns
          /** Disable if too many bars would make the chart unreadable */
          if (membersCount[levels[0].caption] > chartLimits.BARCHART_MAX_BARS) return null;

          /** @type {VizBldr.Struct.Chart} */
          const output = {
            ...chartProps,
            levels,
            isMap: false,
            key: keyMaker(dataset, levels, measureSet, chartType)
          };
          return output;
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
  barchartyear(dg, chartLimits) {
    const {membersCount, timeDrilldown, stdDrilldowns} = dg;
    const firstLevel = stdDrilldowns[0] || timeDrilldown;

    /* DISABLE IF... */
    if (
      /* no time level present */
      !timeDrilldown ||

      /* time level has less than 2 members */
      membersCount[timeDrilldown.caption] < 2 ||

      /** Barcharts with more than 20 members are hard to read. */
      membersCount[firstLevel.caption] > chartLimits.BARCHART_YEAR_MAX_BARS ||

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
   * - measure cannot have UNKNOWN, AVERAGE, MEDIAN, or NONE aggregation type
   */
  donut(dg, chartLimits) {
    const allowedMeasures = dg.measureSets.filter(
      measureSet => !includes(["UNKNOWN", "AVG", "AVERAGE", "MEDIAN", "NONE"], measureSet.measure.aggregatorType)
    );
    return defaultChart("donut", {...dg, measureSets: allowedMeasures});
  },

  /**
   * PIE CHART
   * - Works the same as donut
   */
  pie(dg, chartLimits) {
    return remixerForChartType.donut(dg, chartLimits);
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
  geomap(dg, chartLimits) {
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
      levels: getNonTimeDrilldowns(dg),
      measureSet
    }));  
  },

  /**
   * HISTOGRAM
   * - TODO: implement bucket detection
   */
  histogram(dg, chartLimits) {
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
   * - time drilldown present
   * - time drilldown with at least LINE_POINT_MIN members
   * - std drilldowns
   */
  lineplot(dg, chartLimits) {
    const {membersCount, timeDrilldown} = dg;

    /* DISABLE IF... */
    if (
      // no time drilldown
      !timeDrilldown ||
      
      // time level members are less than minimum required 
      membersCount[timeDrilldown.caption] < chartLimits.LINEPLOT_LINE_POINT_MIN
    ) {
      return [];
    }

    // get list of all non-time drilldowns (geo + standard)
    const otherDrilldowns = getNonTimeDrilldowns(dg);

    const otherDrilldownsUnderMemberLimit = otherDrilldowns
      .filter(lvl => dg.membersCount[lvl.caption] <= chartLimits.LINEPLOT_LINE_MAX);

    // if there are non-time drilldowns with a valid number of members...
    const validDrilldowns = otherDrilldownsUnderMemberLimit.length > 0
      ? otherDrilldownsUnderMemberLimit // use this list
      : otherDrilldowns.length > 0 // but if there are non-time drilldowns but none are under the line threshold
        ? [] // show nothing
        : [false]; // finally, if there is only a time dimension, show a single line chart

    // for each measure...
    return flatMap(dg.measureSets, measureSet =>
      validDrilldowns.map(level => {
        const levels = level ? [level] : [];
        return {
          chartType: CT.LINEPLOT,
          dg,
          isMap: isGeographicLevel(level),
          isTimeline: false, // time level is plotted on an axis in line plot
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
   * - timeLevel with chartLimits.STACKED_TIME_MEMBER_MIN or more members
   * - total combination of datapoint groups is less than chartLimits.STACKED_SHAPE_MAX
   * - measure is not aggregation type of AVG, MEDIAN, or NONE
   * - data for a certain measure is SIGN_CONSISTENT (meaning it is all negative or all positive, non including zero values)
   */
  stacked(dg, chartLimits) {
    const {drilldowns, membersCount, timeDrilldown} = dg;

    const nonTimeDrilldowns = getNonTimeDrilldowns(dg);

    /* DISABLE IF... */
    if (
      /** no time level */
      !timeDrilldown ||

      /** time level has less than two members */
      membersCount[timeDrilldown.caption] < chartLimits.STACKED_TIME_MEMBER_MIN ||

      /** there are more than CHART_LIMITS.STACKED_SHAPE_MAX shapes in the chart */
      nonTimeDrilldowns.reduce((total, lvl) => total * membersCount[lvl.caption], 1) > chartLimits.STACKED_SHAPE_MAX ||

      /** other levels contain only 1 member */
      nonTimeDrilldowns.every(lvl => membersCount[lvl.caption] === 1)
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
        (
          // measure must be of a "stackable" aggregation type like SUM
          !includes(["AVG", "AVERAGE", "MEDIAN", "NONE"], measure.aggregatorType) ||
          (includes(["Percentage", "Rate"], measure.annotations.units_of_measurement) && membersCount[drilldowns[0].caption] > 1)
        ) &&
        // make sure that data is all negative or all positive
        dataIsSignConsistent(dg.dataset, measure)
    );

    return defaultChart("stacked", {...dg, measureSets: allowedMeasures});
  },

  /**
   * TREEMAPS
   * 
   * Requirements:
   * - standard drilldown with more than one member present
   * - measure is of aggregation type SUM or UNKNOWN
   */
  treemap(dg, chartLimits) {
    const {dataset, membersCount, members, timeDrilldown} = dg;
    const chartType = CT.TREEMAP;

    const nonTimeDrilldowns = getNonTimeDrilldowns(dg);

    /* DISABLE IF... */
    if (
      // only drilldown is time level
      (timeDrilldown && nonTimeDrilldowns.length === 0) ||

      // all levels, except for timeLevel, have only 1 member.
      nonTimeDrilldowns.every(lvl => membersCount[lvl.caption] === 1)

    ) {
      return [];
    }
    
    const relevantLevels = nonTimeDrilldowns.filter(lvl => membersCount[lvl.caption] > 1);
    
    const chartReductions = dg.measureSets.map(measureSet => {
      const {measure} = measureSet;

      if (
        /** Treemaps only work with SUM-aggregated measures  */
        !includes(["SUM", "UNKNOWN"], measure.aggregatorType) ||

        /** @see {@link https://github.com/Datawheel/canon/issues/487} */
        (includes(["Percentage", "Rate"], measure.annotations.units_of_measurement) &&
          membersCount[nonTimeDrilldowns?.[0].caption] > 1) ||

        // make sure that data is all positive
        !dataIsSignConsistent(dg.dataset, measure)
      ) {
        return [];
      }
      const chartProps = {chartType, dataset, dg, measureSet, members};
      return getPermutations(relevantLevels).map(levels => {

        // DISABLE if there will be more than ChartLimits.TREE_MAP_MAX_SHAPE shapes in the chart
        if (levels.reduce((total, lvl) => total * membersCount[lvl.caption], 1) > chartLimits.TREE_MAP_SHAPE_MAX) return null;

        return {
          ...chartProps,
          levels,
          isMap: false,
          isTimeline: !!timeDrilldown,
          key: keyMaker(dataset, levels, measureSet, chartType)
        }
      });
    });

    return flattenDeep(chartReductions).filter(Boolean);
  }
};
